const jwt = require("jsonwebtoken");
const { error } = require("../utils/response");
const { queryOne } = require("../config/database");

/** Authenticates platform-scoped JWTs (issued by /admin/auth/login). */
async function requirePlatformAuth(req, res, next) {
  const h = req.headers.authorization || "";
  if (!h.startsWith("Bearer ")) return error(res, "Platform auth required", 401);
  try {
    const decoded = jwt.verify(h.slice(7), process.env.JWT_SECRET);
    if (decoded.scope !== "platform") return error(res, "Not a platform token", 403);
    const user = await queryOne(
      "SELECT id, email, full_name, role, is_active FROM platform_users WHERE id = ?",
      [decoded.id],
    );
    if (!user || !user.is_active) return error(res, "Account disabled", 403);
    req.platformUser = user;
    next();
  } catch (e) {
    return error(res, "Invalid or expired platform token", 401);
  }
}

const requirePlatformRole = (...roles) => (req, res, next) => {
  if (!req.platformUser) return error(res, "Unauthorized", 401);
  if (roles.length && !roles.includes(req.platformUser.role))
    return error(res, "Insufficient platform role", 403);
  next();
};

module.exports = { requirePlatformAuth, requirePlatformRole };