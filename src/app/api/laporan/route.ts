import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateKodeLaporan } from "@/lib/generate-kode";
import { saveFile } from "@/lib/upload";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const kategori = formData.get("kategori") as string;
    const judul = formData.get("judul") as string;
    const deskripsi = formData.get("deskripsi") as string;
    const latitude = parseFloat(formData.get("latitude") as string);
    const longitude = parseFloat(formData.get("longitude") as string);
    const alamat = formData.get("alamat") as string | null;
    const foto = formData.get("foto") as File | null;

    if (!kategori || !judul || !deskripsi || !foto) {
      return NextResponse.json(
        { error: "Kategori, judul, deskripsi, dan foto wajib diisi" },
        { status: 400 }
      );
    }

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: "Lokasi tidak valid" },
        { status: 400 }
      );
    }

    // Simpan foto ke lokal dengan validasi ketat (JPG, JPEG, PNG, HEIC)
    let fotoUrl: string;
    try {
      fotoUrl = await saveFile(foto, "laporan");
    } catch (uploadErr: any) {
      return NextResponse.json(
        { error: uploadErr.message || "File foto tidak valid" },
        { status: 400 }
      );
    }

    // Generate kode laporan
    const kode = await generateKodeLaporan();

    // Simpan ke DB secara anonim
    const laporan = await prisma.laporan.create({
      data: {
        kode,
        nama: "Anonim",
        noHp: "-",
        kategori: kategori as any,
        judul,
        deskripsi,
        fotoUrl,
        latitude,
        longitude,
        alamat,
      },
    });

    // Trigger Bot Service untuk kirim notifikasi ke grup WA
    let botSent = false;
    let fallbackContact: { nama: string; noWhatsapp: string } | null = null;

    try {
      const botUrl = process.env.BOT_SERVICE_URL;
      if (botUrl) {
        // Beri timeout 4 detik agar pelapor tidak menunggu lama jika bot mati/unreachable
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const botRes = await fetch(`${botUrl}/api/notify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.API_SECRET_KEY?.replace(/^"|"$/g, "") || "",
          },
          body: JSON.stringify({
            kode: laporan.kode,
            nama: "Anonim (Warga)",
            kategori: laporan.kategori,
            judul: laporan.judul,
            deskripsi: laporan.deskripsi,
            fotoUrl: laporan.fotoUrl,
            latitude: laporan.latitude,
            longitude: laporan.longitude,
            alamat: laporan.alamat,
            createdAt: laporan.createdAt,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const botData = await botRes.json().catch(() => ({}));
        if (botRes.ok) {
          botSent = true;
          console.log("Bot notification sent successfully:", botData);
        } else {
          console.warn("Bot service responded with error:", botRes.status, botData);
        }
      }
    } catch (err: any) {
      console.warn("Bot service unreachable / timeout:", err?.message || err);
    }

    // Jika bot mati/gagal kirim, ambil kontak pengurus darurat untuk ditampilkan ke pelapor
    if (!botSent) {
      // Prioritaskan kontak darurat dari .env jika didefinisikan
      const envEmergencyPhone = process.env.EMERGENCY_CONTACT_PHONE || process.env.NO_PENGURUS_DARURAT;
      const envEmergencyName = process.env.EMERGENCY_CONTACT_NAME || "Pengurus RT/RW (Call Center)";

      if (envEmergencyPhone) {
        let cleanPhone = envEmergencyPhone.replace(/[^0-9]/g, "");
        if (cleanPhone.startsWith("0")) {
          cleanPhone = "62" + cleanPhone.slice(1);
        }
        fallbackContact = {
          nama: envEmergencyName,
          noWhatsapp: cleanPhone,
        };
      } else {
        try {
          const pengurusDarurat = await prisma.pengurus.findFirst({
            where: { aktif: true },
            select: { nama: true, jabatan: true, noWhatsapp: true },
            orderBy: { createdAt: "asc" },
          });

          if (pengurusDarurat) {
            fallbackContact = {
              nama: `${pengurusDarurat.nama} (${pengurusDarurat.jabatan})`,
              noWhatsapp: pengurusDarurat.noWhatsapp,
            };
          } else {
            fallbackContact = {
              nama: "Pengurus RT/RW (Call Center)",
              noWhatsapp: "6285773074389",
            };
          }
        } catch (_) {
          fallbackContact = {
            nama: "Pengurus RT/RW",
            noWhatsapp: "6285773074389",
          };
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: laporan,
        botStatus: {
          sent: botSent,
          fallbackContact: !botSent ? fallbackContact : null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating laporan:", error);
    return NextResponse.json(
      { error: "Gagal membuat laporan" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const kategori = searchParams.get("kategori");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (kategori) where.kategori = kategori;

  const [data, total] = await Promise.all([
    prisma.laporan.findMany({
      where,
      include: { updates: { include: { pengurus: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.laporan.count({ where }),
  ]);

  return NextResponse.json({
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
