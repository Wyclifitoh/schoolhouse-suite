const { error } = require("../utils/response");

const { query } = require("../config/database");

const requireSchool = async (req, res, next) => {
  const schoolId = req.headers["x-school-id"];
  if (!schoolId) {
    return error(res, "X-School-ID header is required", 400);
  }
  
  if (req.user) {
    try {
      const roles = await query(
        "SELECT 1 FROM user_roles WHERE user_id = ? AND school_id = ? AND is_active = TRUE LIMIT 1",
        [req.user.id, schoolId]
      );
      if (!roles || roles.length === 0) {
        return error(res, "You do not have access to this school", 403);
      }
    } catch (err) {
      return error(res, "Tenant authorization check failed", 500);
    }
  }

  req.schoolId = schoolId;
  next();
};

module.exports = { requireSchool };
