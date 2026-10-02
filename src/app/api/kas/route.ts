import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveBuffer } from "@/lib/upload";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tipe = searchParams.get("tipe"); // PEMASUKAN / PENGELUARAN
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const where: Record<string, any> = {};
    if (tipe === "PEMASUKAN" || tipe === "PENGELUARAN") {
      where.tipe = tipe;
    }

    const [transaksi, total, aggregations] = await Promise.all([
      prisma.kasTransaksi.findMany({
        where,
        include: {
          laporan: {
            select: { kode: true, judul: true },
          },
          pengurus: {
            select: { nama: true, jabatan: true },
          },
        },
        orderBy: { tanggal: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.kasTransaksi.count({ where }),
      prisma.kasTransaksi.groupBy({
        by: ["tipe"],
        _sum: { nominal: true },
      }),
    ]);

    let totalPemasukan = 0;
    let totalPengeluaran = 0;

    for (const agg of aggregations) {
      if (agg.tipe === "PEMASUKAN") totalPemasukan = agg._sum.nominal || 0;
      if (agg.tipe === "PENGELUARAN") totalPengeluaran = agg._sum.nominal || 0;
    }

    const saldoKas = totalPemasukan - totalPengeluaran;

    return NextResponse.json({
      success: true,
      data: transaksi,
      summary: {
        totalPemasukan,
        totalPengeluaran,
        saldoKas,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching kas:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data kas" },
      { status: 500 }
    );
  }
}

/**
 * Endpoint POST untuk Bot Service:
 * - action: "SALDO" -> mengecek saldo terkini
 * - Default -> mencatat transaksi PEMASUKAN atau PENGELUARAN
 */
export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (apiKey !== process.env.API_SECRET_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action } = body;

    // 1. Cek Saldo Kas
    if (action === "SALDO") {
      const aggregations = await prisma.kasTransaksi.groupBy({
        by: ["tipe"],
        _sum: { nominal: true },
      });

      let totalPemasukan = 0;
      let totalPengeluaran = 0;

      for (const agg of aggregations) {
        if (agg.tipe === "PEMASUKAN") totalPemasukan = agg._sum.nominal || 0;
        if (agg.tipe === "PENGELUARAN") totalPengeluaran = agg._sum.nominal || 0;
      }

      const saldo = totalPemasukan - totalPengeluaran;

      return NextResponse.json({
        success: true,
        data: { totalPemasukan, totalPengeluaran, saldo },
      });
    }

    // 2. Catat Transaksi Baru
    const {
      tipe,
      nominal,
      kategori,
      keterangan,
      noWhatsapp,
      lid,
      kodeLaporan,
      fotoBase64,
      fotoExt,
    } = body;

    if (!tipe || !nominal || !kategori || !keterangan || (!noWhatsapp && !lid)) {
      return NextResponse.json(
        { error: "tipe, nominal, kategori, keterangan, dan nomor pengurus wajib diisi" },
        { status: 400 }
      );
    }

    const cleanNo = (noWhatsapp || "").replace(/[^0-9]/g, "");
    const formatted62 = cleanNo.startsWith("0") ? "62" + cleanNo.slice(1) : cleanNo;
    const formatted08 = cleanNo.startsWith("62") ? "0" + cleanNo.slice(2) : cleanNo;
    const cleanLid = (lid || "").replace(/[^0-9]/g, "");

    const pengurus = await prisma.pengurus.findFirst({
      where: {
        aktif: true,
        OR: [
          ...(formatted62 ? [{ noWhatsapp: formatted62 }] : []),
          ...(formatted08 ? [{ noWhatsapp: formatted08 }] : []),
          ...(cleanNo ? [{ noWhatsapp: cleanNo }] : []),
          ...(cleanLid ? [{ noWhatsapp: cleanLid }] : []),
        ],
      },
    });

    if (!pengurus) {
      return NextResponse.json(
        { error: `Nomor WA (${noWhatsapp || lid}) tidak terdaftar sebagai pengurus aktif` },
        { status: 403 }
      );
    }

    // Simpan foto bukti struk/kuitansi jika ada
    let buktiUrl: string | null = null;
    if (fotoBase64) {
      try {
        const buffer = Buffer.from(fotoBase64, "base64");
        buktiUrl = await saveBuffer(buffer, fotoExt || "jpg", "update");
      } catch (err: any) {
        console.warn("Gagal simpan foto bukti kas:", err.message);
      }
    }

    // Cek laporan terkait jika ada
    let laporanId: string | null = null;
    if (kodeLaporan) {
      const lap = await prisma.laporan.findUnique({
        where: { kode: kodeLaporan.toUpperCase().trim() },
      });
      if (lap) {
        laporanId = lap.id;
      }
    }

    const transaksi = await prisma.kasTransaksi.create({
      data: {
        tipe,
        nominal: parseFloat(nominal),
        kategori,
        keterangan,
        buktiUrl,
        laporanId,
        pengurusId: pengurus.id,
      },
    });

    // Hitung saldo akhir
    const aggregations = await prisma.kasTransaksi.groupBy({
      by: ["tipe"],
      _sum: { nominal: true },
    });

    let totalPemasukan = 0;
    let totalPengeluaran = 0;

    for (const agg of aggregations) {
      if (agg.tipe === "PEMASUKAN") totalPemasukan = agg._sum.nominal || 0;
      if (agg.tipe === "PENGELUARAN") totalPengeluaran = agg._sum.nominal || 0;
    }

    const saldoAkhir = totalPemasukan - totalPengeluaran;

    return NextResponse.json({
      success: true,
      data: {
        ...transaksi,
        saldoAkhir,
      },
    });
  } catch (error) {
    console.error("Error saving kas via bot:", error);
    return NextResponse.json(
      { error: "Gagal mencatat transaksi kas" },
      { status: 500 }
    );
  }
}
