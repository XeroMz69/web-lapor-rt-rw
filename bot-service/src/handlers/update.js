const { client } = require("../whatsapp");

const STATUS_MAP = {
  selesai: "SELESAI",
  done: "SELESAI",
  diproses: "DIPROSES",
  proses: "DIPROSES",
  ditolak: "DITOLAK",
  tolak: "DITOLAK",
  pending: "PENDING",
};

function setupUpdateHandler() {
  const onIncoming = async (msg) => {
    const body = (msg.body || "").trim();
    if (!body.toLowerCase().startsWith("!update")) return;

    const groupId = process.env.WA_GROUP_ID;
    const remoteJid = msg.id?.remote || msg.from;
    const isTargetGroup =
      remoteJid === groupId || msg.from === groupId || msg.to === groupId;

    console.log(`[!update detected] from: ${msg.from}, to: ${msg.to}, remote: ${remoteJid}, isTarget: ${isTargetGroup}`);

    if (!isTargetGroup) return;

    try {
      // 1. Ekstrak kode laporan
      let kode = null;
      const selfKodeMatch = body.match(/(LP-\d{4,})/i);

      if (selfKodeMatch) {
        kode = selfKodeMatch[1].toUpperCase();
      } else {
        let quotedText = "";

        if (msg._data && msg._data.quotedMsg) {
          quotedText =
            msg._data.quotedMsg.caption ||
            msg._data.quotedMsg.body ||
            "";
        }

        if (!quotedText) {
          try {
            const quotedMsg = await msg.getQuotedMessage();
            quotedText = quotedMsg?.body || quotedMsg?.caption || "";
          } catch (e) {
            console.warn("getQuotedMessage fallback:", e.message);
          }
        }

        const quotedMatch = quotedText.match(/(LP-\d{4,})/i);
        if (quotedMatch) {
          kode = quotedMatch[1].toUpperCase();
        }
      }

      if (!kode) {
        await client.sendMessage(
          groupId,
          "⚠️ Kode laporan tidak ditemukan.\n\nPastikan Anda *reply pesan laporan* dari bot, atau sebutkan kodenya langsung:\n*!update LP-0001 Selesai Jalan sudah ditambal*"
        );
        return;
      }

      // 2. Parse status & keterangan
      const parts = body.split(/\s+/).filter(Boolean);
      parts.shift(); // hapus !update

      if (parts[0] && parts[0].toUpperCase().startsWith("LP-")) {
        parts.shift(); // lewatkan kode jika ada di posisi pertama
      }

      if (parts.length < 2) {
        await client.sendMessage(
          groupId,
          `⚠️ Format salah.\nGunakan: *!update <Status> <Keterangan>*\n\nPilihan status: *Selesai*, *Diproses*, *Ditolak*\nContoh: _!update Selesai Jalan sudah diperbaiki_`
        );
        return;
      }

      const statusKey = parts[0].toLowerCase();
      const status = STATUS_MAP[statusKey];
      if (!status) {
        await client.sendMessage(
          groupId,
          `⚠️ Status "${parts[0]}" tidak valid.\nGunakan: *Selesai*, *Diproses*, atau *Ditolak*`
        );
        return;
      }

      const keterangan = parts.slice(1).join(" ");

      // 3. Ambil nomor WhatsApp pengirim dengan resolusi LID
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
              console.log(`[LID Resolved] ${author} → ${res[0].pn}`);
            }
          } catch (e) {
            console.warn("getContactLidAndPhone:", e.message);
          }
        }

        if (!noWhatsapp) {
          try {
            const contact = await msg.getContact();
            if (contact && contact.number && !contact.number.includes("-")) {
              noWhatsapp = contact.number;
            }
          } catch (e) {
            console.warn("getContact fallback:", e.message);
          }
        }

        if (!noWhatsapp && author && !author.endsWith("@g.us")) {
          noWhatsapp = author.replace(/@.*$/, "").replace(/:.*$/, "");
        }
      }

      noWhatsapp = (noWhatsapp || lidNumber).replace(/[^0-9]/g, "");
      if (noWhatsapp.startsWith("0")) {
        noWhatsapp = "62" + noWhatsapp.slice(1);
      }

      console.log(`[Processing update] Laporan: ${kode}, Status: ${status}, Pengurus no: "${noWhatsapp}" (LID: "${lidNumber}")`);

      // 4. Download foto bukti (jika ada)
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
        } catch (mediaErr) {
          console.error("Gagal download foto bukti:", mediaErr.message);
        }
      }

      // 5. Kirim update ke Next.js API
      const nextjsUrl = process.env.NEXTJS_URL || "http://localhost:3000";
      const response = await fetch(`${nextjsUrl}/api/laporan/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.API_SECRET_KEY || "",
        },
        body: JSON.stringify({
          kode,
          status,
          keterangan,
          noWhatsapp,
          lid: lidNumber,
          fotoBase64,
          fotoExt,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        const statusEmoji = {
          SELESAI: "✅",
          DIPROSES: "🔄",
          DITOLAK: "❌",
        };
        const replyText = [
          `${statusEmoji[status] || "📝"} *Update Berhasil!*`,
          ``,
          `📋 Laporan: *${kode}*`,
          `📊 Status: *${status}*`,
          `📝 Keterangan: ${keterangan}`,
          `👤 Pengurus: ${noWhatsapp}`,
          fotoBase64 ? `📸 Foto bukti: Tersimpan` : "",
        ]
          .filter(Boolean)
          .join("\n");

        await client.sendMessage(groupId, replyText);
      } else {
        await client.sendMessage(groupId, `⚠️ Gagal update: ${result.error}`);
      }
    } catch (error) {
      console.error("Error handling !update:", error);
      await client.sendMessage(groupId, "❌ Terjadi kesalahan saat memproses update.");
    }
  };

  client.on("message_create", onIncoming);
  console.log("Update handler registered");
}

module.exports = { setupUpdateHandler };
