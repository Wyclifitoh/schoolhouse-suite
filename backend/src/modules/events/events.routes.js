const router = require("express").Router();
const repo = require("./events.repository");
const { success, error } = require("../../utils/response");

const sid = (req) => req.schoolId || req.headers["x-school-id"];
const uid = (req) => req.user?.id || null;
const h = (fn) => async (req, res) => {
  try { return await fn(req, res); }
  catch (e) { return error(res, e.message || "Internal error", e.statusCode || 500); }
};

router.get("/", h(async (req, res) =>
  success(res, await repo.list(sid(req), req.query))));

router.get("/upcoming", h(async (req, res) =>
  success(res, await repo.upcoming(sid(req), req.query.limit || 5))));

router.get("/:id", h(async (req, res) => {
  const e = await repo.get(req.params.id, sid(req));
  if (!e) return error(res, "Event not found", 404);
  return success(res, e);
}));

router.post("/", h(async (req, res) =>
  success(res, await repo.create({ ...req.body, school_id: sid(req), created_by: uid(req) }), 201)));

router.put("/:id", h(async (req, res) =>
  success(res, await repo.update(req.params.id, sid(req), req.body))));

router.delete("/:id", h(async (req, res) => {
  await repo.remove(req.params.id, sid(req));
  return success(res, { deleted: true });
}));

module.exports = router;
