import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveBuffer } from "@/lib/upload";

/**
 * Endpoint untuk Bot Service mengirim update status laporan.
 * Bot mengirim: kode laporan, status baru, keterangan, noWhatsapp pengurus, foto (base64).
 */
export async function POST(req: NextRequest) {
  // Validasi API key
  const apiKey = req.headers.get("x-api-key");
  if (apiKey !== process.env.API_SECRET_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { kode, status, keterangan, noWhatsapp, lid, fotoBase64, fotoExt } = body;

    if (!kode || !status || !keterangan || (!noWhatsapp && !lid)) {
      return NextResponse.json(
        { error: "kode, status, keterangan, noWhatsapp wajib diisi" },
        { status: 400 }
      );
    }

    // Cari laporan
    const laporan = await prisma.laporan.findUnique({ where: { kode } });
    if (!laporan) {
      return NextResponse.json(
        { error: `Laporan ${kode} tidak ditemukan` },
        { status: 404 }
      );
    }

    // Validasi pengurus (fleksibel format 62xxx / 08xxx / LID)
    const cleanNo = (noWhatsapp || "").replace(/[^0-9]/g, "");
    const formatted62 = cleanNo.startsWith("0") ? "62" + cleanNo.slice(1) : cleanNo;
    const formatted08 = cleanNo.startsWith("62") ? "0" + cleanNo.slice(2) : cleanNo;
    const cleanLid = (lid || "").replace(/[^0-9]/g, "");

    console.log(`[Next.js Update] Mencari pengurus: noWhatsapp="${cleanNo}", LID="${cleanLid}"`);

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
      console.warn(`[Next.js Update] Pengurus tidak ditemukan untuk nomor: ${noWhatsapp} (LID: ${lid})`);
      return NextResponse.json(
        { error: `Nomor WA (${noWhatsapp || lid}) tidak terdaftar sebagai pengurus aktif` },
        { status: 403 }
      );
    }

    // Simpan foto perbaikan jika ada
    let fotoUrl: string | null = null;
    if (fotoBase64) {
      const buffer = Buffer.from(fotoBase64, "base64");
      fotoUrl = await saveBuffer(buffer, fotoExt || "jpg", "update");
    }

    // Buat update & ubah status laporan dalam 1 transaksi
    const [update] = await prisma.$transaction([
      prisma.laporanUpdate.create({
        data: {
          laporanId: laporan.id,
          pengurusId: pengurus.id,
          status,
          keterangan,
          fotoUrl,
        },
      }),
      prisma.laporan.update({
        where: { id: laporan.id },
        data: { status },
      }),
    ]);

    return NextResponse.json({ success: true, data: update }, { status: 200 });
  } catch (error) {
    console.error("Error updating laporan:", error);
    return NextResponse.json(
      { error: "Gagal update laporan" },
      { status: 500 }
    );
  }
}
