const router = require("express").Router();
const repo = require("./bulk-payments.repository");
const { success, error } = require("../../utils/response");

const handle = (fn) => async (req, res) => {
  try { return await fn(req, res); }
  catch (err) {
    console.error("[bulk-payments]", err);
    return error(res, err.message, err.statusCode || 500);
  }
};

router.get("/", handle(async (req, res) =>
  success(res, await repo.list(req.schoolId, req.query))));
router.get("/:id", handle(async (req, res) =>
  success(res, await repo.getById(req.params.id, req.schoolId))));
router.post("/", handle(async (req, res) =>
  success(res, await repo.createDraft({
    ...req.body, school_id: req.schoolId, recorded_by: req.user?.id || null,
    term_id: req.session?.termId || req.body.term_id || null,
    academic_year_id: req.session?.academicYearId || req.body.academic_year_id || null,
  }), 201)));
router.put("/:id", handle(async (req, res) =>
  success(res, await repo.updateDraft(req.params.id, req.schoolId, req.body))));
router.post("/:id/commit", handle(async (req, res) =>
  success(res, await repo.commit(req.params.id, req.schoolId, req.user?.id))));
router.delete("/:id", handle(async (req, res) =>
  success(res, await repo.remove(req.params.id, req.schoolId))));

module.exports = router;