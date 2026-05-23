const { AT, GS, COMP, OBS, ANALYTICS, RC, recomputeRankings } = require("./extras.repository");
const { success, error } = require("../../utils/response");

const sid = (req) => req.schoolId || req.headers["x-school-id"];
const h = (fn) => async (req, res) => {
  try { return await fn(req, res); }
  catch (e) { return error(res, e.message, e.statusCode || 500); }
};

// ----- Assessment types -----
exports.listAssessmentTypes   = h(async (req, res) => success(res, await AT.list(sid(req))));
exports.createAssessmentType  = h(async (req, res) => {
  if (!req.body?.code || !req.body?.name) return error(res, "code and name required", 400);
  return success(res, await AT.create(sid(req), req.body), 201);
});
exports.updateAssessmentType  = h(async (req, res) => success(res, await AT.update(req.params.id, sid(req), req.body || {})));
exports.deleteAssessmentType  = h(async (req, res) => { await AT.remove(req.params.id, sid(req)); return success(res, { deleted: true }); });

// ----- Grading scales -----
exports.listGradingScales  = h(async (req, res) => success(res, await GS.list(sid(req))));
exports.getGradingScale    = h(async (req, res) => {
  const s = await GS.get(req.params.id, sid(req));
  if (!s) return error(res, "Scale not found", 404);
  return success(res, s);
});
exports.createGradingScale = h(async (req, res) => {
  if (!req.body?.name) return error(res, "name required", 400);
  return success(res, await GS.create(sid(req), req.body), 201);
});
exports.updateGradingScale = h(async (req, res) => success(res, await GS.update(req.params.id, sid(req), req.body || {})));
exports.deleteGradingScale = h(async (req, res) => { await GS.remove(req.params.id, sid(req)); return success(res, { deleted: true }); });

// ----- Competencies -----
exports.listCompetencies   = h(async (req, res) => success(res, await COMP.list(sid(req), req.query)));
exports.createCompetency   = h(async (req, res) => {
  if (!req.body?.code || !req.body?.name) return error(res, "code and name required", 400);
  return success(res, await COMP.create(sid(req), req.body), 201);
});
exports.updateCompetency   = h(async (req, res) => success(res, await COMP.update(req.params.id, sid(req), req.body || {})));
exports.deleteCompetency   = h(async (req, res) => { await COMP.remove(req.params.id, sid(req)); return success(res, { deleted: true }); });

// ----- Observations -----
exports.listObservations   = h(async (req, res) => success(res, await OBS.list(sid(req), req.session, req.query)));
exports.createObservation  = h(async (req, res) => {
  if (!req.body?.student_id || !req.body?.competency_id) return error(res, "student_id and competency_id required", 400);
  return success(res, await OBS.create(sid(req), req.session, req.body, req.user?.id), 201);
});
exports.deleteObservation  = h(async (req, res) => { await OBS.remove(req.params.id, sid(req)); return success(res, { deleted: true }); });

// ----- Analytics -----
exports.examAnalytics      = h(async (req, res) => {
  const [summary, subjects, students] = await Promise.all([
    ANALYTICS.examSummary(sid(req), req.params.id, req.session),
    ANALYTICS.subjectMeans(sid(req), req.params.id, req.session),
    ANALYTICS.studentTotals(sid(req), req.params.id, req.session),
  ]);
  return success(res, { summary, subjects, students });
});
exports.recomputeRankings  = h(async (req, res) =>
  success(res, await recomputeRankings(sid(req), req.params.id, req.session)));

// ----- Report cards -----
exports.listTemplates  = h(async (req, res) => success(res, await RC.listTemplates(sid(req))));
exports.createTemplate = h(async (req, res) => {
  if (!req.body?.name) return error(res, "name required", 400);
  return success(res, await RC.createTemplate(sid(req), req.body), 201);
});
exports.deleteTemplate = h(async (req, res) => { await RC.removeTemplate(req.params.id, sid(req)); return success(res, { deleted: true }); });

exports.listReportRuns = h(async (req, res) => success(res, await RC.listRuns(sid(req), req.session)));
exports.createReportRun = h(async (req, res) => success(res, await RC.createRun(sid(req), req.session, req.body || {}, req.user?.id), 201));
exports.publishReportRun = h(async (req, res) => { await RC.publishRun(req.params.id, sid(req)); return success(res, { published: true }); });
