const { client } = require("../whatsapp");

function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Handler pesan grup untuk modul Kas Warga:
 * 1. !saldo -> Cek total kas & rincian saat ini
 * 2. !kas masuk <nominal> <kategori> | <keterangan>
 * 3. !kas keluar <nominal> <kategori> | <keterangan> [LP-xxxx]
 */
function setupKasHandler() {
  const onIncoming = async (msg) => {
    const body = (msg.body || "").trim();
    const lower = body.toLowerCase();

    if (!lower.startsWith("!kas") && !lower.startsWith("!saldo")) return;

    const groupId = process.env.WA_GROUP_ID;
    const remoteJid = msg.id?.remote || msg.from;
    const isTargetGroup =
      remoteJid === groupId || msg.from === groupId || msg.to === groupId;

    if (!isTargetGroup) return;

    try {
      const nextjsUrl = process.env.NEXTJS_URL || "http://localhost:3000";

      // 1. Perintah !saldo
      if (lower.startsWith("!saldo")) {
        const response = await fetch(`${nextjsUrl}/api/kas`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.API_SECRET_KEY || "",
          },
          body: JSON.stringify({ action: "SALDO" }),
        });

        const res = await response.json();
        if (response.ok && res.data) {
          const { totalPemasukan, totalPengeluaran, saldo } = res.data;
          const reply = [
            `💰 *LAPORAN SALDO KAS WARGA*`,
            ``,
            `💳 *Saldo Tersedia : ${formatRupiah(saldo)}*`,
            `📈 Total Pemasukan : ${formatRupiah(totalPemasukan)}`,
            `📉 Total Pengeluaran: ${formatRupiah(totalPengeluaran)}`,
            ``,
            `─────────────────`,
            `💡 _Cek pembukuan lengkap & bukti kuitansi di web:_`,
            `🔗 ${nextjsUrl}/kas`,
          ].join("\n");

          await client.sendMessage(groupId, reply);
        } else {
          await client.sendMessage(groupId, `⚠️ Gagal mengecek saldo: ${res.error}`);
        }
        return;
      }

      // 2. Perintah !kas masuk / !kas keluar
      // Contoh: !kas masuk 500000 Iuran Warga | Pembayaran iuran warga blok C
      // Contoh: !kas keluar 150000 Perbaikan Jalan | Beli semen untuk jalan LP-0001
      const parts = body.split(/\s+/);
      const subCommand = (parts[1] || "").toLowerCase();

      if (subCommand !== "masuk" && subCommand !== "keluar") {
        const help = [
          `📖 *PANDUAN PENCATATAN KAS WA*`,
          ``,
          `*1. Cek Saldo:*`,
          `   _!saldo_`,
          ``,
          `*2. Catat Pemasukan:*`,
          `   _!kas masuk <Nominal> <Kategori> | <Keterangan>_`,
          `   Contoh: _!kas masuk 3500000 Iuran Warga | Pembayaran 70 KK bulan ini_`,
          ``,
          `*3. Catat Pengeluaran (Bisa sertakan foto nota/struk):*`,
          `   _!kas keluar <Nominal> <Kategori> | <Keterangan> [KodeLaporan]_`,
          `   Contoh: _!kas keluar 250000 Perbaikan Jalan | Beli semen pasir LP-0001_`,
        ].join("\n");
        await client.sendMessage(groupId, help);
        return;
      }

      const tipe = subCommand === "masuk" ? "PEMASUKAN" : "PENGELUARAN";
      const rawNominal = parts[2] || "";
      const nominal = parseFloat(rawNominal.replace(/[^0-9.]/g, ""));

      if (isNaN(nominal) || nominal <= 0) {
        await client.sendMessage(
          groupId,
          `⚠️ Nominal "${rawNominal}" tidak valid. Masukkan angka (misal: 250000).`
        );
        return;
      }

      // Gabungkan sisa teks setelah nominal
      const rest = parts.slice(3).join(" ");
      let kategori = "";
      let keterangan = "";

      if (rest.includes("|")) {
        const splitPipe = rest.split("|");
        kategori = splitPipe[0].trim();
        keterangan = splitPipe.slice(1).join("|").trim();
      } else {
        kategori = "Operasional RT/RW";
        keterangan = rest.trim();
      }

      if (!keterangan) {
        await client.sendMessage(
          groupId,
          `⚠️ Keterangan wajib diisi.\nContoh: _!kas ${subCommand} ${rawNominal} ${kategori || "Iuran"} | Keterangan lengkap pengeluaran_`
        );
        return;
      }

      // Deteksi jika ada kode laporan LP-xxxx
      let kodeLaporan = null;
      const matchLap = (body + " " + (msg._data?.quotedMsg?.body || "")).match(/(LP-\d{4,})/i);
      if (matchLap) {
        kodeLaporan = matchLap[1].toUpperCase();
      }

      // Ambil nomor pengurus (dengan resolusi LID)
      let noWhatsapp = "";
      let lidNumber = "";

      if (msg.fromMe) {
        noWhatsapp = client.info?.wid?.user || "";
      } else {
        const author = msg.author || msg.from || "";
        if (author.endsWith("@lid")) {
          lidNumber = author.replace(/@.*$/, "").replace(/:.*$/, "");
          try {
            const res = await client.getContactLidAndPhone([author]);
            if (res && res[0] && res[0].pn) {
              noWhatsapp = res[0].pn.replace(/@.*$/, "").replace(/:.*$/, "");
            }
          } catch (_) {}
        }
        if (!noWhatsapp) {
          try {
            const contact = await msg.getContact();
            if (contact && contact.number && !contact.number.includes("-")) {
              noWhatsapp = contact.number;
            }
          } catch (_) {}
        }
        if (!noWhatsapp && author && !author.endsWith("@g.us")) {
          noWhatsapp = author.replace(/@.*$/, "").replace(/:.*$/, "");
        }
      }

      noWhatsapp = (noWhatsapp || lidNumber).replace(/[^0-9]/g, "");
      if (noWhatsapp.startsWith("0")) {
        noWhatsapp = "62" + noWhatsapp.slice(1);
      }

      // Download foto kuitansi jika pengurus melampirkan foto
      let fotoBase64 = null;
      let fotoExt = null;
      if (msg.hasMedia) {
        try {
          const media = await msg.downloadMedia();
          if (media && media.data) {
            fotoBase64 = media.data;
            const ext = media.mimetype?.split("/")?.[1] || "jpg";
            fotoExt = ext.replace("jpeg", "jpg");
          }
        } catch (_) {}
      }

      // Kirim pencatatan ke Next.js API
      const response = await fetch(`${nextjsUrl}/api/kas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.API_SECRET_KEY || "",
        },
        body: JSON.stringify({
          tipe,
          nominal,
          kategori,
          keterangan,
          noWhatsapp,
          lid: lidNumber,
          kodeLaporan,
          fotoBase64,
          fotoExt,
        }),
      });

      const res = await response.json();

      if (response.ok) {
        const isMasuk = tipe === "PEMASUKAN";
        const reply = [
          `${isMasuk ? "📥" : "📤"} *Pencatatan Kas Berhasil!*`,
          ``,
          `📊 Tipe      : *${tipe}*`,
          `💵 Nominal   : *${formatRupiah(nominal)}*`,
          `🏷️ Kategori  : ${kategori}`,
          `📝 Rincian   : ${keterangan}`,
          kodeLaporan ? `📋 Laporan   : *${kodeLaporan}*` : "",
          fotoBase64 ? `📸 Bukti Struk: Tersimpan` : "",
          ``,
          `💳 *Saldo Kas Sekarang: ${formatRupiah(res.data.saldoAkhir)}*`,
          `🔗 Pantau di web: ${nextjsUrl}/kas`,
        ]
          .filter(Boolean)
          .join("\n");

        await client.sendMessage(groupId, reply);
      } else {
        await client.sendMessage(groupId, `⚠️ Gagal mencatat kas: ${res.error}`);
      }
    } catch (err) {
      console.error("Error handling !kas:", err);
      await client.sendMessage(groupId, "❌ Terjadi kesalahan sistem saat memproses perintah kas.");
    }
  };

  client.on("message_create", onIncoming);
  console.log("Kas handler registered (!kas, !saldo)");
}

module.exports = { setupKasHandler };
