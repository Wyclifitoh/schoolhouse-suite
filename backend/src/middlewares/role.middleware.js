const { error } = require('../utils/response');
const { query } = require('../config/database');

const authorize = (...allowedRoles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return error(res, 'Authentication required', 401);
    }

    const schoolId = req.headers['x-school-id'] || req.params.schoolId;
    if (!schoolId) {
      return error(res, 'X-School-ID header is required', 400);
    }

    try {
      const result = await query(
        `SELECT role FROM user_roles WHERE user_id = $1 AND school_id = $2 AND role = ANY($3::text[])`,
        [req.user.id, schoolId, allowedRoles]
      );

      if (result.rows.length === 0) {
        return error(res, 'Insufficient permissions', 403);
      }

      req.schoolId = schoolId;
      req.userRole = result.rows[0].role;
      next();
    } catch (err) {
      console.error('Authorization error:', err);
      return error(res, 'Authorization check failed', 500);
    }
  };
};

module.exports = { authorize };
