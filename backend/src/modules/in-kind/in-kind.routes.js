const router = require("express").Router();
const repo = require("./in-kind.repository");
const { success, error } = require("../../utils/response");

const handle = (fn) => async (req, res) => {
  try { return await fn(req, res); }
  catch (err) {
    console.error("[in-kind]", err);
    return error(res, err.message, err.statusCode || 500);
  }
};

router.get("/", handle(async (req, res) =>
  success(res, await repo.list(req.schoolId, req.query))));
router.get("/:id", handle(async (req, res) =>
  success(res, await repo.getById(req.params.id, req.schoolId))));
router.post("/", handle(async (req, res) =>
  success(res, await repo.create({ ...req.body, school_id: req.schoolId, recorded_by: req.user?.id || null }), 201)));
router.post("/:id/approve", handle(async (req, res) =>
  success(res, await repo.approve(req.params.id, req.schoolId, req.user?.id))));
router.post("/:id/reject", handle(async (req, res) =>
  success(res, await repo.reject(req.params.id, req.schoolId, req.user?.id, req.body?.reason))));
router.delete("/:id", handle(async (req, res) =>
  success(res, await repo.remove(req.params.id, req.schoolId))));

module.exports = router;