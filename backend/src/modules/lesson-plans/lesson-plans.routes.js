const router = require("express").Router();
const c = require("./lesson-plans.controller");
const { query, queryOne, execute } = require("../../config/database");
const { success, error } = require("../../utils/response");
const crypto = require("crypto");

// Strands (lightweight CRUD, scoped by school/subject/grade)
router.get("/strands", async (req, res) => {
  try {
    const where = ["school_id = ?"];
    const params = [req.schoolId];
    if (req.query.subject_id) {
      where.push("subject_id = ?");
      params.push(req.query.subject_id);
    }
    if (req.query.grade_id) {
      where.push("grade_id = ?");
      params.push(req.query.grade_id);
    }
    const rows = await query(
      `SELECT * FROM cbc_strands WHERE ${where.join(" AND ")} ORDER BY name`,
      params,
    );
    return success(res, rows);
  } catch (err) {
    return error(res, err.message);
  }
});
router.post("/strands", async (req, res) => {
  try {
    const id = crypto.randomUUID();
    const { subject_id, grade_id, name, description } = req.body;
    await execute(
      `INSERT INTO cbc_strands (id, school_id, subject_id, grade_id, name, description)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, req.schoolId, subject_id, grade_id, name, description || null],
    );
    const row = await queryOne(`SELECT * FROM cbc_strands WHERE id = ?`, [id]);
    return success(res, row, 201);
  } catch (err) {
    return error(res, err.message);
  }
});
router.delete("/strands/:id", async (req, res) => {
  try {
    await execute(`DELETE FROM cbc_strands WHERE id = ? AND school_id = ?`, [
      req.params.id,
      req.schoolId,
    ]);
    return success(res, { deleted: true });
  } catch (err) {
    return error(res, err.message);
  }
});

// Sub-strands
router.get("/sub-strands", c.listSubStrands);
router.post("/sub-strands", c.createSubStrand);
router.put("/sub-strands/:id", c.updateSubStrand);
router.delete("/sub-strands/:id", c.removeSubStrand);

// Templates
router.get("/templates", c.listTemplates);
router.post("/templates", c.createTemplate);
router.put("/templates/:id", c.updateTemplate);
router.delete("/templates/:id", c.removeTemplate);

// Coverage & dashboard
router.get("/coverage", c.coverage);
router.get("/dashboard", c.dashboard);
router.get("/roster", c.roster);

// Plans
router.get("/", c.list);
router.post("/", c.create);
router.post("/from-timetable/:timetable_entry_id", c.fromTimetable);
router.get("/:id", c.get);
router.put("/:id", c.update);
router.delete("/:id", c.remove);
router.post("/:id/duplicate", c.duplicate);
router.post("/:id/publish", c.publish);
router.post("/:id/deliver", c.deliver);
router.post("/:id/unpublish", c.unpublish);
router.get("/:id/pdf", c.pdf);

module.exports = router;
