const repo = require("./lesson-plans.repository");
const coverageRepo = require("./coverage.repository");
const tplRepo = require("./templates.repository");
const subStrandRepo = require("./sub-strands.repository");

const TEACHER_ONLY_ROLES = ["teacher"];
const ADMIN_ROLES = ["super_admin", "school_admin", "deputy_admin"];

const resolveTeacherScope = async (req) => {
  if (req.user && TEACHER_ONLY_ROLES.includes(req.userRole)) {
    const t = await repo.teacherFromUser(req.schoolId, req.user.id);
    if (!t) {
      const err = new Error("Teacher profile not found for this user");
      err.status = 403;
      throw err;
    }
    return t.id;
  }
  return null;
};

const assertTeacherCanModify = async (req, plan) => {
  const scopeId = await resolveTeacherScope(req);
  if (scopeId && plan.teacher_id !== scopeId) {
    const err = new Error("You can only modify your own lesson plans");
    err.status = 403;
    throw err;
  }
};

const list = async (req, filters, pagination) => {
  const scope = await resolveTeacherScope(req);
  const f = { ...filters };
  if (scope) f.teacher_id = scope;
  return repo.list(req.schoolId, f, pagination);
};

const get = async (req, id) => {
  const plan = await repo.findById(req.schoolId, id);
  if (!plan) { const e = new Error("Lesson plan not found"); e.status = 404; throw e; }
  const scope = await resolveTeacherScope(req);
  if (scope && plan.teacher_id !== scope) {
    const e = new Error("Not authorized"); e.status = 403; throw e;
  }
  return plan;
};

const create = async (req, data) => {
  const scope = await resolveTeacherScope(req);
  const teacherId = scope || data.teacher_id;
  if (!teacherId) { const e = new Error("teacher_id required"); e.status = 400; throw e; }
  if (scope && !(await repo.isTeacherAllocated(
    req.schoolId, scope, data.subject_id, data.grade_id, data.stream_id,
  ))) {
    const e = new Error("You are not allocated this subject/class");
    e.status = 403; throw e;
  }
  const payload = {
    ...data,
    school_id: req.schoolId,
    teacher_id: teacherId,
    academic_year_id: data.academic_year_id || req.session?.academicYearId || null,
    term_id: data.term_id || req.session?.termId || null,
    status: data.status || "draft",
  };
  const id = await repo.create(payload);
  const plan = await repo.findById(req.schoolId, id);
  if (plan.status !== "draft") await repo.writeCoverage(plan);
  return plan;
};

const update = async (req, id, data) => {
  const plan = await repo.findById(req.schoolId, id);
  if (!plan) { const e = new Error("Lesson plan not found"); e.status = 404; throw e; }
  await assertTeacherCanModify(req, plan);
  await repo.update(id, data);
  const fresh = await repo.findById(req.schoolId, id);
  if (fresh.status !== "draft") await repo.writeCoverage(fresh);
  return fresh;
};

const remove = async (req, id) => {
  const plan = await repo.findById(req.schoolId, id);
  if (!plan) return;
  await assertTeacherCanModify(req, plan);
  await repo.clearCoverage(id);
  await repo.remove(id);
};

const fromTimetable = async (req, timetableEntryId) => {
  const te = await repo.findTimetableEntry(req.schoolId, timetableEntryId);
  if (!te) { const e = new Error("Timetable entry not found"); e.status = 404; throw e; }
  const scope = await resolveTeacherScope(req);
  const teacherId = te.teacher_id || scope;
  if (!teacherId) { const e = new Error("Lesson has no teacher assigned"); e.status = 400; throw e; }
  if (scope && teacherId !== scope) {
    const e = new Error("Lesson not assigned to you"); e.status = 403; throw e;
  }
  const roster = await repo.rosterForStream(req.schoolId, te.stream_id);
  const today = new Date();
  const payload = {
    school_id: req.schoolId,
    academic_year_id: te.academic_year_id || req.session?.academicYearId || null,
    term_id: te.term_id || req.session?.termId || null,
    subject_id: te.subject_id,
    grade_id: te.grade_id,
    stream_id: te.stream_id,
    teacher_id: teacherId,
    timetable_entry_id: te.id,
    lesson_date: today.toISOString().slice(0, 10),
    start_time: te.start_time,
    end_time: te.end_time,
    boys: roster.boys, girls: roster.girls,
    roll: roster.total, total_learners: roster.total,
    status: "draft",
  };
  const id = await repo.create(payload);
  return repo.findById(req.schoolId, id);
};

const duplicate = async (req, id, { lesson_date } = {}) => {
  const src = await get(req, id);
  const { id: _, created_at, updated_at, published_at, delivered_at, ...rest } = src;
  const payload = {
    ...rest,
    lesson_date: lesson_date || new Date().toISOString().slice(0, 10),
    status: "draft",
    timetable_entry_id: null,
  };
  // Strip joined columns
  for (const k of ["subject_name", "subject_code", "grade_name", "stream_name",
                   "teacher_name", "tsc_number", "teacher_gender",
                   "strand_name", "sub_strand_name", "term_name", "academic_year_name"]) {
    delete payload[k];
  }
  const newId = await repo.create(payload);
  return repo.findById(req.schoolId, newId);
};

const setStatus = async (req, id, status) => {
  const plan = await get(req, id);
  await assertTeacherCanModify(req, plan);
  const upd = { status };
  if (status === "published") upd.published_at = new Date();
  if (status === "delivered") upd.delivered_at = new Date();
  await repo.update(id, upd);
  const fresh = await repo.findById(req.schoolId, id);
  if (status === "draft") await repo.clearCoverage(id);
  else await repo.writeCoverage(fresh);
  return fresh;
};

// Coverage / dashboard
const coverage = (req, filters) => coverageRepo.overview(req.schoolId, filters);
const dashboard = async (req) => {
  const scope = await resolveTeacherScope(req);
  return coverageRepo.dashboard(req.schoolId, {
    teacher_id: scope || undefined,
    term_id: req.session?.termId,
  });
};

// Templates
const listTemplates = (req, q) => tplRepo.list(req.schoolId, q);
const createTemplate = (req, body) =>
  tplRepo.create({ ...body, school_id: req.schoolId, created_by: req.user?.id });
const updateTemplate = (req, id, body) => tplRepo.update(id, body);
const removeTemplate = (req, id) => tplRepo.remove(id);

// Sub-strands
const listSubStrands = (req, q) => subStrandRepo.list(req.schoolId, q);
const createSubStrand = (req, body) =>
  subStrandRepo.create({ ...body, school_id: req.schoolId });
const updateSubStrand = (req, id, body) => subStrandRepo.update(id, body);
const removeSubStrand = (req, id) => subStrandRepo.remove(id);

module.exports = {
  list, get, create, update, remove, fromTimetable, duplicate, setStatus,
  coverage, dashboard,
  listTemplates, createTemplate, updateTemplate, removeTemplate,
  listSubStrands, createSubStrand, updateSubStrand, removeSubStrand,
};
