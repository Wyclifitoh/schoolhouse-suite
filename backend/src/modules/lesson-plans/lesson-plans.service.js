const repo = require("./lesson-plans.repository");
const coverageRepo = require("./coverage.repository");
const tplRepo = require("./templates.repository");
const subStrandRepo = require("./sub-strands.repository");

const TEACHER_ONLY_ROLES = ["teacher"];

// Resolve the staff_id for the authenticated user, if any.
const resolveOwnerStaff = async (req) => {
  if (!req.user?.id) return null;
  const s = await repo.staffFromUser(req.schoolId, req.user.id);
  return s?.id || null;
};

// Teachers should only see/modify their own plans.
const teacherScopeStaffId = async (req) => {
  if (req.user && TEACHER_ONLY_ROLES.includes(req.userRole)) {
    const sid = await resolveOwnerStaff(req);
    if (!sid) {
      const err = new Error("Staff profile not found for this user");
      err.status = 403;
      throw err;
    }
    return sid;
  }
  return null;
};

const assertCanModify = async (req, plan) => {
  const scope = await teacherScopeStaffId(req);
  if (scope && plan.staff_id && plan.staff_id !== scope) {
    const e = new Error("You can only modify your own lesson plans");
    e.status = 403;
    throw e;
  }
};

const list = async (req, filters, pagination) => {
  const scope = await teacherScopeStaffId(req);
  const f = { ...filters };
  if (scope) f.staff_id = scope;
  return repo.list(req.schoolId, f, pagination);
};

const get = async (req, id) => {
  const plan = await repo.findById(req.schoolId, id);
  if (!plan) {
    const e = new Error("Lesson plan not found");
    e.status = 404;
    throw e;
  }
  const scope = await teacherScopeStaffId(req);
  if (scope && plan.staff_id && plan.staff_id !== scope) {
    const e = new Error("Not authorized");
    e.status = 403;
    throw e;
  }
  return plan;
};

const create = async (req, data) => {
  const ownerStaff =
    (await teacherScopeStaffId(req)) ||
    data.staff_id ||
    (await resolveOwnerStaff(req));

  // Auto-fill roster snapshot whenever grade/stream provided and caller
  // didn't already supply explicit counts.
  let { boys, girls, total_learners, roll } = data;
  if (data.grade_id || data.stream_id) {
    const r = await repo.rosterFor(req.schoolId, {
      grade_id: data.grade_id,
      stream_id: data.stream_id,
    });
    if (boys == null) boys = r.boys;
    if (girls == null) girls = r.girls;
    if (total_learners == null) total_learners = r.total;
    if (roll == null) roll = r.total;
  }

  const payload = {
    ...data,
    boys,
    girls,
    total_learners,
    roll,
    school_id: req.schoolId,
    staff_id: ownerStaff,
    created_by_user_id: req.user?.id || null,
    academic_year_id:
      data.academic_year_id || req.session?.academicYearId || null,
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
  if (!plan) {
    const e = new Error("Lesson plan not found");
    e.status = 404;
    throw e;
  }
  await assertCanModify(req, plan);
  await repo.update(id, data);
  const fresh = await repo.findById(req.schoolId, id);
  if (fresh.status !== "draft") await repo.writeCoverage(fresh);
  return fresh;
};

const remove = async (req, id) => {
  const plan = await repo.findById(req.schoolId, id);
  if (!plan) return;
  await assertCanModify(req, plan);
  await repo.clearCoverage(id);
  await repo.remove(id);
};

const fromTimetable = async (req, timetableEntryId) => {
  const te = await repo.findTimetableEntry(req.schoolId, timetableEntryId);
  if (!te) {
    const e = new Error("Timetable entry not found");
    e.status = 404;
    throw e;
  }
  const ownerStaff =
    (await teacherScopeStaffId(req)) || (await resolveOwnerStaff(req));
  const roster = await repo.rosterFor(req.schoolId, {
    grade_id: te.grade_id,
    stream_id: te.stream_id,
  });
  const today = new Date();
  const payload = {
    school_id: req.schoolId,
    academic_year_id:
      te.academic_year_id || req.session?.academicYearId || null,
    term_id: te.term_id || req.session?.termId || null,
    subject_id: te.subject_id,
    grade_id: te.grade_id,
    stream_id: te.stream_id,
    staff_id: ownerStaff,
    created_by_user_id: req.user?.id || null,
    timetable_entry_id: te.id,
    lesson_date: today.toISOString().slice(0, 10),
    start_time: te.start_time,
    end_time: te.end_time,
    boys: roster.boys,
    girls: roster.girls,
    roll: roster.total,
    total_learners: roster.total,
    status: "draft",
  };
  const id = await repo.create(payload);
  return repo.findById(req.schoolId, id);
};

const duplicate = async (req, id, { lesson_date } = {}) => {
  const src = await get(req, id);
  const {
    id: _,
    created_at,
    updated_at,
    published_at,
    delivered_at,
    ...rest
  } = src;
  const payload = {
    ...rest,
    lesson_date: lesson_date || new Date().toISOString().slice(0, 10),
    status: "draft",
    timetable_entry_id: null,
    created_by_user_id: req.user?.id || null,
  };
  for (const k of [
    "subject_name",
    "subject_code",
    "grade_name",
    "stream_name",
    "teacher_name",
    "tsc_number",
    "teacher_gender",
    "strand_name",
    "sub_strand_name",
    "term_name",
    "academic_year_name",
  ]) {
    delete payload[k];
  }
  const newId = await repo.create(payload);
  return repo.findById(req.schoolId, newId);
};

const setStatus = async (req, id, status) => {
  const plan = await get(req, id);
  await assertCanModify(req, plan);
  const upd = { status };
  if (status === "published") upd.published_at = new Date();
  if (status === "delivered") upd.delivered_at = new Date();
  await repo.update(id, upd);
  const fresh = await repo.findById(req.schoolId, id);
  if (status === "draft") await repo.clearCoverage(id);
  else await repo.writeCoverage(fresh);
  return fresh;
};

const roster = (req, q) => repo.rosterFor(req.schoolId, q || {});

const coverage = (req, filters) => coverageRepo.overview(req.schoolId, filters);
const dashboard = async (req) => {
  const scope = await teacherScopeStaffId(req);
  return coverageRepo.dashboard(req.schoolId, {
    staff_id: scope || undefined,
    term_id: req.session?.termId,
  });
};

const listTemplates = (req, q) => tplRepo.list(req.schoolId, q);
const createTemplate = (req, body) =>
  tplRepo.create({
    ...body,
    school_id: req.schoolId,
    created_by: req.user?.id,
  });
const updateTemplate = (req, id, body) => tplRepo.update(id, body);
const removeTemplate = (req, id) => tplRepo.remove(id);

const listSubStrands = (req, q) => subStrandRepo.list(req.schoolId, q);
const createSubStrand = (req, body) =>
  subStrandRepo.create({ ...body, school_id: req.schoolId });
const updateSubStrand = (req, id, body) => subStrandRepo.update(id, body);
const removeSubStrand = (req, id) => subStrandRepo.remove(id);

module.exports = {
  list,
  get,
  create,
  update,
  remove,
  fromTimetable,
  duplicate,
  setStatus,
  roster,
  coverage,
  dashboard,
  listTemplates,
  createTemplate,
  updateTemplate,
  removeTemplate,
  listSubStrands,
  createSubStrand,
  updateSubStrand,
  removeSubStrand,
};
