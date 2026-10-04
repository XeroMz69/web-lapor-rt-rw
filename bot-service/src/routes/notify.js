const { Router } = require("express");
const { MessageMedia } = require("whatsapp-web.js");
const { client, isReady } = require("../whatsapp");
const authMiddleware = require("../middleware/auth");
const path = require("path");
const fs = require("fs");

const router = Router();

const KATEGORI_LABEL = {
  JALAN_RUSAK: "🛣️ Jalan Rusak",
  SAMPAH: "🗑️ Sampah",
  PENERANGAN: "💡 Penerangan",
  SALURAN_AIR: "🌊 Saluran Air",
  FASILITAS_UMUM: "🏗️ Fasilitas Umum",
  KEAMANAN: "🔒 Keamanan",
  LAINNYA: "📋 Lainnya",
};

router.post("/", authMiddleware, async (req, res) => {
  if (!isReady()) {
    return res.status(503).json({ error: "WhatsApp belum siap" });
  }

  const groupId = process.env.WA_GROUP_ID;
  if (!groupId) {
    return res.status(500).json({ error: "WA_GROUP_ID belum diset di .env" });
  }

  try {
    const { kode, nama, kategori, judul, deskripsi, fotoUrl, latitude, longitude, alamat, createdAt } = req.body;

    const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
    const waktu = new Date(createdAt).toLocaleString("id-ID", {
      dateStyle: "long",
      timeStyle: "short",
    });

    const caption = [
      `📢 *LAPORAN BARU* — ${kode}`,
      ``,
      `👤 Pelapor: ${nama || "Anonim (Warga)"}`,
      `📂 Kategori: ${KATEGORI_LABEL[kategori] || kategori}`,
      `📌 Judul: *${judul}*`,
      `📝 Deskripsi: ${deskripsi}`,
      `📍 Lokasi: ${alamat || "-"}`,
      `🗺️ Maps: ${mapsUrl}`,
      `🕐 Waktu: ${waktu}`,
      ``,
      `─────────────────`,
      `Balas pesan ini dengan:`,
      `*!update <Status> <Keterangan>*`,
      `Contoh: _!update Selesai Jalan sudah ditambal_`,
    ].join("\n");

    // Validasi fotoUrl mencegah path traversal / SSRF
    const safeFotoUrl = typeof fotoUrl === "string" && fotoUrl.startsWith("/uploads/")
      ? fotoUrl
      : null;
    const publicMediaUrl = process.env.MEDIA_PUBLIC_URL;

    let media = null;
    if (safeFotoUrl || (typeof fotoUrl === "string" && fotoUrl.startsWith("https://"))) {
      // Fallback 1: baca langsung dari filesystem jika satu mesin
      const localPath = path.resolve(__dirname, "../../..", `public${safeFotoUrl}`);
      if (fs.existsSync(localPath)) {
        media = MessageMedia.fromFilePath(localPath);
      } else {
        // Fallback 2: ambil via HTTP ke server Next.js terpercaya
        const nextjsUrl = process.env.NEXTJS_URL || "http://localhost:3000";
        try {
          const parsedUrl = new URL(fotoUrl, nextjsUrl);
          // Hanya izinkan Next.js atau public R2 yang dikonfigurasi.
          const allowedOrigins = [
            new URL(nextjsUrl).origin,
            ...(publicMediaUrl ? [new URL(publicMediaUrl).origin] : []),
          ];
          if (allowedOrigins.includes(parsedUrl.origin)) {
            media = await MessageMedia.fromUrl(parsedUrl.toString(), {
              unsafeMime: true,
            });
          }
        } catch (_) {}
      }
    }

    if (media) {
      await client.sendMessage(groupId, media, { caption });
    } else {
      // Kirim tanpa foto jika gagal atau path tidak valid
      await client.sendMessage(groupId, caption);
    }

    res.json({ success: true, message: `Notifikasi ${kode} terkirim` });
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({ error: "Gagal kirim notifikasi" });
  }
});

module.exports = router;
