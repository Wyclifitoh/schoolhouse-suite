const router = require("express").Router();
const repo = require("./api-keys.repository");
const { success, error } = require("../../utils/response");

const handle = (fn) => async (req, res) => {
  try { return await fn(req, res); }
  catch (err) {
    console.error("[api-keys]", err);
    return error(res, err.message, err.statusCode || 500);
  }
};

router.get("/", handle(async (req, res) =>
  success(res, await repo.list(req.schoolId))));
router.get("/logs", handle(async (req, res) =>
  success(res, await repo.listLogs(req.schoolId, req.query))));
router.post("/", handle(async (req, res) =>
  success(res, await repo.create({
    schoolId: req.schoolId,
    label: req.body.label,
    scopes: req.body.scopes,
    createdBy: req.user?.id || null,
  }), 201)));
router.delete("/:id", handle(async (req, res) =>
  success(res, await repo.revoke(req.params.id, req.schoolId))));

module.exports = router;