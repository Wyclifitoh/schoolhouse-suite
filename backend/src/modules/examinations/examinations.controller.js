const repo = require("./examinations.repository");
const { listAuditForExam, listAuditForMark } = require("./audit");
const { success, error } = require("../../utils/response");

const sid = (req) => req.schoolId || req.headers["x-school-id"];
const ctx = (req) => ({
  actorId: req.user?.id || null,
  actorRole: req.user?.role || null,
  forceAdmin: req.user?.role === "admin" && req.headers["x-force-write"] === "true",
  reason: req.headers["x-edit-reason"] || null,
});

const handle = (fn) => async (req, res) => {
  try { return await fn(req, res); }
  catch (e) { return error(res, e.message, e.statusCode || 500); }
};

// ----- Exams -----
exports.listExams = handle(async (req, res) =>
  success(res, await repo.listExams(sid(req), req.session, req.query)));

exports.getExam = handle(async (req, res) => {
  const row = await repo.getExam(req.params.id, sid(req));
  if (!row) return error(res, "Exam not found", 404);
  return success(res, row);
});

exports.createExam = handle(async (req, res) => {
  if (!req.body?.name) return error(res, "name is required", 400);
  const row = await repo.createExam({
    ...req.body,
    school_id: sid(req),
    created_by: req.user?.id || null,
    academic_year_id: req.body.academic_year_id || req.session?.academicYearId || null,
    term_id: req.body.term_id || req.session?.termId || null,
    status: req.body.status || "DRAFT",
  });
  return success(res, row, 201);
});

exports.updateExam = handle(async (req, res) =>
  success(res, await repo.updateExam(req.params.id, sid(req), req.body || {})));

exports.deleteExam = handle(async (req, res) => {
  await repo.deleteExam(req.params.id, sid(req));
  return success(res, { deleted: true });
});

// ----- Lifecycle transitions -----
const makeTransition = (action) => handle(async (req, res) => {
  const row = await repo.transitionExam({
    id: req.params.id,
    schoolId: sid(req),
    action,
    actorId: req.user?.id,
    actorRole: req.user?.role,
    reason: req.body?.reason || null,
  });
  return success(res, row);
});
exports.submitExam  = makeTransition("submit");
exports.reviewExam  = makeTransition("review");
exports.approveExam = makeTransition("approve");
exports.lockExam    = makeTransition("lock");
exports.reopenExam  = makeTransition("reopen");
exports.archiveExam = makeTransition("archive");

// ----- Exam subjects -----
exports.listExamSubjects = handle(async (req, res) =>
  success(res, await repo.listExamSubjects(req.params.id)));

exports.upsertExamSubject = handle(async (req, res) => {
  if (!req.body?.subject_name) return error(res, "subject_name required", 400);
  return success(res, await repo.upsertExamSubject(req.params.id, req.body));
});

// ----- Schedules -----
exports.listSchedules   = handle(async (req, res) => success(res, await repo.listSchedules(sid(req), req.query.exam_id)));
exports.createSchedule  = handle(async (req, res) => {
  if (!req.body?.exam_id || !req.body?.subject_name) return error(res, "exam_id and subject_name required", 400);
  return success(res, await repo.createSchedule(req.body), 201);
});
exports.updateSchedule  = handle(async (req, res) => success(res, await repo.updateSchedule(req.params.id, req.body || {})));
exports.deleteSchedule  = handle(async (req, res) => { await repo.deleteSchedule(req.params.id); return success(res, { deleted: true }); });

// ----- Marks -----
exports.listMarks = handle(async (req, res) =>
  success(res, await repo.listMarks(sid(req), req.query, req.session)));

const stamp = (req, r) => ({
  ...r,
  school_id: sid(req),
  recorded_by: req.user?.id || null,
  academic_year_id: r.academic_year_id || req.session?.academicYearId || null,
  term_id:          r.term_id          || req.session?.termId          || null,
});

exports.recordMark = handle(async (req, res) => {
  for (const k of ["exam_id", "student_id", "subject_name"])
    if (!req.body?.[k]) return error(res, `${k} is required`, 400);
  return success(res, await repo.upsertMark(stamp(req, req.body), ctx(req)));
});

exports.bulkMarks = handle(async (req, res) => {
  const rows = Array.isArray(req.body?.marks) ? req.body.marks : [];
  if (!rows.length) return error(res, "marks array required", 400);
  const out = await repo.bulkUpsertMarks(rows.map((r) => stamp(req, r)), ctx(req));
  return success(res, { saved: out.length, marks: out });
});

exports.submitMarks = handle(async (req, res) =>
  success(res, await repo.submitDraftMarks({
    schoolId: sid(req), examId: req.params.id, session: req.session,
    actorId: req.user?.id, actorRole: req.user?.role,
  })));

exports.deleteMark = handle(async (req, res) => {
  await repo.deleteMark(req.params.id, sid(req), ctx(req));
  return success(res, { deleted: true });
});

// ----- Audit -----
exports.markAudit = handle(async (req, res) => success(res, await listAuditForMark(req.params.id)));
exports.examAudit = handle(async (req, res) => success(res, await listAuditForExam(req.params.id)));
