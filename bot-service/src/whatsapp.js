const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const path = require("path");

let ready = false;

// Bersihkan lock file usang agar sesi tidak corrupt saat restart
function cleanStaleLocks(dataPath) {
  const sessionDir = path.resolve(dataPath, "session");
  const locks = ["SingletonLock", "SingletonCookie", "SingletonSocket"];
  for (const lock of locks) {
    const p = path.join(sessionDir, lock);
    try {
      if (fs.existsSync(p)) {
        fs.unlinkSync(p);
      }
    } catch (_) {}
  }
}

cleanStaleLocks("./wa-session");

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: "./wa-session" }),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
    ],
  },
});

client.on("qr", (qr) => {
  console.log("Scan QR code di bawah ini:");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  ready = true;
  console.log("\n=================================");
  console.log("✅ WhatsApp Bot SIAP & TERKONEKSI");
  console.log("=================================");
  console.log("👉 Untuk mengetahui Group ID:");
  console.log("   Kirim pesan apa saja atau '!id' di grup WA target.");
  console.log("   ID grup akan langsung muncul di console ini.\n");
});

// Listener untuk cek ID grup atau chat
client.on("message_create", (msg) => {
  if (msg.from.endsWith("@g.us")) {
    console.log(`[Grup Terdeteksi] ID: ${msg.from}`);
  }
});

client.on("authenticated", () => {
  console.log("WhatsApp authenticated");
});

client.on("auth_failure", (msg) => {
  console.error("Auth failure:", msg);
});

client.on("disconnected", (reason) => {
  ready = false;
  console.log("WhatsApp disconnected:", reason);
});

client.initialize();

function isReady() {
  return ready;
}

module.exports = { client, isReady };
