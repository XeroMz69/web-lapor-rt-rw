require("dotenv").config();
const express = require("express");
const { client, isReady } = require("./whatsapp");
const notifyRoute = require("./routes/notify");
const { setupUpdateHandler } = require("./handlers/update");

const app = express();
app.use(express.json({ limit: "20mb" }));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", whatsapp: isReady() });
});

// Route: Next.js trigger kirim notifikasi ke grup WA
app.use("/api/notify", notifyRoute);

// Register handler !update dari grup WA
setupUpdateHandler();

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`Bot service running on port ${PORT}`);
});

// Penutupan bersih agar file sesi Chromium tersimpan rapi dan tidak corrupt
async function gracefulShutdown(signal) {
  console.log(`\n[${signal}] Menutup Bot Service secara aman...`);
  try {
    server.close();
    await client.destroy();
    console.log("Browser WhatsApp ditutup bersih. Sesi tersimpan.");
  } catch (err) {
    console.error("Error saat shutdown:", err.message);
  }
  process.exit(0);
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
