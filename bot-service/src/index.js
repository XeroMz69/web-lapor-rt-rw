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
app.listen(PORT, () => {
  console.log(`Bot service running on port ${PORT}`);
});
