const svc = require("./lesson-plans.service");
const { generateLessonPlanPdf } = require("./pdf.service");
const { success, error, paginated } = require("../../utils/response");
const { parsePagination } = require("../../utils/pagination");

const wrap = (fn) => async (req, res) => {
  try { return await fn(req, res); }
  catch (err) { return error(res, err.message, err.status || 500); }
};

// Lesson plans
const list = wrap(async (req, res) => {
  const pagination = parsePagination(req.query);
  const { rows, total } = await svc.list(req, req.query, pagination);
  return paginated(res, rows, total, pagination.page, pagination.limit);
});
const get = wrap(async (req, res) => success(res, await svc.get(req, req.params.id)));
const create = wrap(async (req, res) => success(res, await svc.create(req, req.body), 201));
const update = wrap(async (req, res) => success(res, await svc.update(req, req.params.id, req.body)));
const remove = wrap(async (req, res) => { await svc.remove(req, req.params.id); return success(res, { deleted: true }); });
const fromTimetable = wrap(async (req, res) =>
  success(res, await svc.fromTimetable(req, req.params.timetable_entry_id), 201));
const duplicate = wrap(async (req, res) =>
  success(res, await svc.duplicate(req, req.params.id, req.body || {}), 201));
const publish = wrap(async (req, res) => success(res, await svc.setStatus(req, req.params.id, "published")));
const deliver = wrap(async (req, res) => success(res, await svc.setStatus(req, req.params.id, "delivered")));
const unpublish = wrap(async (req, res) => success(res, await svc.setStatus(req, req.params.id, "draft")));

const pdf = wrap(async (req, res) => {
  const plan = await svc.get(req, req.params.id);
  const buf = await generateLessonPlanPdf(plan);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition",
    `attachment; filename="lesson-plan-${plan.id}.pdf"`);
  res.send(buf);
});

const coverage = wrap(async (req, res) => success(res, await svc.coverage(req, req.query)));
const dashboard = wrap(async (req, res) => success(res, await svc.dashboard(req)));

// Templates
const listTemplates = wrap(async (req, res) => success(res, await svc.listTemplates(req, req.query)));
const createTemplate = wrap(async (req, res) => success(res, await svc.createTemplate(req, req.body), 201));
const updateTemplate = wrap(async (req, res) => success(res, await svc.updateTemplate(req, req.params.id, req.body)));
const removeTemplate = wrap(async (req, res) => { await svc.removeTemplate(req, req.params.id); return success(res, { deleted: true }); });

// Sub-strands
const listSubStrands = wrap(async (req, res) => success(res, await svc.listSubStrands(req, req.query)));
const createSubStrand = wrap(async (req, res) => success(res, await svc.createSubStrand(req, req.body), 201));
const updateSubStrand = wrap(async (req, res) => success(res, await svc.updateSubStrand(req, req.params.id, req.body)));
const removeSubStrand = wrap(async (req, res) => { await svc.removeSubStrand(req, req.params.id); return success(res, { deleted: true }); });

module.exports = {
  list, get, create, update, remove, fromTimetable, duplicate,
  publish, deliver, unpublish, pdf, coverage, dashboard,
  listTemplates, createTemplate, updateTemplate, removeTemplate,
  listSubStrands, createSubStrand, updateSubStrand, removeSubStrand,
};
