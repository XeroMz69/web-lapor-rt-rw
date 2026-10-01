/**
 * Middleware: validasi API key dari header x-api-key
 */
function authMiddleware(req, res, next) {
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== process.env.API_SECRET_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

module.exports = authMiddleware;
