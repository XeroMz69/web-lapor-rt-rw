const crypto = require("crypto");

/**
 * Middleware: validasi API key dengan timing-safe comparison
 */
function authMiddleware(req, res, next) {
  const apiKey = req.headers["x-api-key"];
  const secretKey = process.env.API_SECRET_KEY;

  if (!apiKey || !secretKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Samakan panjang buffer untuk mencegah timing attack
  const keyBuffer = Buffer.from(apiKey);
  const secretBuffer = Buffer.from(secretKey);

  if (
    keyBuffer.length !== secretBuffer.length ||
    !crypto.timingSafeEqual(keyBuffer, secretBuffer)
  ) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}

module.exports = authMiddleware;
