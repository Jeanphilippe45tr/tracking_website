const jwt = require("jsonwebtoken");
const { AdminUser } = require("../models");

const secret = () => process.env.JWT_SECRET;

function signToken(user) {
  return jwt.sign({ id: user.id }, secret(), { expiresIn: "7d" });
}

async function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token || !secret()) return res.status(401).json({ error: "Not authenticated" });
    const { id } = jwt.verify(token, secret());
    const user = await AdminUser.findByPk(id);
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Session expired. Please log in again." });
  }
}

module.exports = { signToken, requireAdmin };
