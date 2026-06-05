const router = require("express").Router();
const c = require("./staff-attendance.controller");
const { query } = require("../../config/database");
const { success, error } = require("../../utils/response");

async function requireSuperAdmin(req, res, next) {
  try {
    const rows = await query(
      `SELECT role FROM user_roles WHERE user_id = ? AND school_id = ? AND is_active = 1`,
      [req.user.id, req.schoolId],
    );
    if (!rows.some((r) => r.role === "super_admin")) {
      return error(res, "Only super admins can modify staff attendance", 403);
    }
    next();
  } catch (e) {
    return error(res, e.message, 500);
  }
}

router.get("/", c.listByDate);
router.get("/summary", c.summary);
router.post("/bulk", requireSuperAdmin, c.bulkSave);
router.post("/check-in", requireSuperAdmin, c.checkIn);
router.post("/check-out", requireSuperAdmin, c.checkOut);
router.delete("/:id", requireSuperAdmin, async (req, res) => {
  try {
    await query(`DELETE FROM staff_attendance WHERE id = ? AND school_id = ?`, [
      req.params.id,
      req.schoolId,
    ]);
    return success(res, { deleted: true });
  } catch (e) {
    return error(res, e.message, 500);
  }
});

module.exports = router;
