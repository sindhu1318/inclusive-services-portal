const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    return res.status(401).json({ message: "Please log in to continue." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !Number.isInteger(decoded.userId)) {
      return res.status(401).json({ message: "Invalid login token." });
    }
    req.user = { id: decoded.userId, email: decoded.email };
    next();
  } catch {
    return res.status(401).json({ message: "Your session expired. Please log in again." });
  }
}

module.exports = authenticateToken;
