const router = require("express").Router();
const repo = require("./income.repository");
const { success, error } = require("../../utils/response");

const handle = (fn) => async (req, res) => {
  try { return await fn(req, res); }
  catch (err) {
    console.error("[income]", err);
    return error(res, err.message, err.statusCode || 500);
  }
};

router.get("/categories", handle(async (req, res) =>
  success(res, await repo.listCategories(req.schoolId))));
router.post("/categories", handle(async (req, res) =>
  success(res, await repo.createCategory({ ...req.body, school_id: req.schoolId }), 201)));
router.put("/categories/:id", handle(async (req, res) =>
  success(res, await repo.updateCategory(req.params.id, req.schoolId, req.body))));
router.delete("/categories/:id", handle(async (req, res) =>
  success(res, await repo.deleteCategory(req.params.id, req.schoolId))));

router.get("/reports", handle(async (req, res) =>
  success(res, await repo.report(req.schoolId, req.query))));

router.get("/", handle(async (req, res) =>
  success(res, await repo.listEntries(req.schoolId, req.query))));
router.post("/", handle(async (req, res) =>
  success(res, await repo.createEntry({
    ...req.body, school_id: req.schoolId, recorded_by: req.user?.id || null,
  }), 201)));
router.put("/:id", handle(async (req, res) =>
  success(res, await repo.updateEntry(req.params.id, req.schoolId, req.body))));
router.delete("/:id", handle(async (req, res) =>
  success(res, await repo.deleteEntry(req.params.id, req.schoolId))));

module.exports = router;