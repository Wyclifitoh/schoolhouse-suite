const router = require("express").Router();
const repo = require("./remark-bands.repository");
const { success, error } = require("../../utils/response");

const sid = (req) => req.schoolId || req.headers["x-school-id"];
const h = (fn) => async (req, res) => {
  try { return await fn(req, res); }
  catch (e) { return error(res, e.message || "Internal error", e.statusCode || 500); }
};

router.get("/", h(async (req, res) =>
  success(res, await repo.list(sid(req), req.query))));

router.post("/", h(async (req, res) =>
  success(res, await repo.upsert({ ...req.body, school_id: sid(req) }), 201)));

router.put("/:id", h(async (req, res) =>
  success(res, await repo.upsert({ ...req.body, id: req.params.id, school_id: sid(req) }))));

router.delete("/:id", h(async (req, res) => {
  await repo.remove(req.params.id, sid(req));
  return success(res, { deleted: true });
}));

module.exports = router;
