const router = require("express").Router();
const cfg = require("./config.repository");
const alloc = require("./allocations.repository");
const assess = require("./assessments.repository");
const marks = require("./marks.repository");
const { success, error } = require("../../utils/response");

const sid = (req) => req.schoolId || req.headers["x-school-id"];
const uid = (req) => req.user?.id || null;
const h = (fn) => async (req, res) => {
  try {
    return await fn(req, res);
  } catch (e) {
    console.error("[assessments]", e);
    return error(res, e.message || "Internal error", e.statusCode || 500);
  }
};

// ============== ASSESSMENT TYPES ==============
router.get(
  "/types",
  h(async (req, res) => success(res, await cfg.listTypes(sid(req)))),
);
router.post(
  "/types",
  h(async (req, res) =>
    success(
      res,
      await cfg.createType({ ...req.body, school_id: sid(req) }),
      201,
    ),
  ),
);
router.put(
  "/types/:id",
  h(async (req, res) =>
    success(res, await cfg.updateType(req.params.id, sid(req), req.body)),
  ),
);
router.delete(
  "/types/:id",
  h(async (req, res) => {
    await cfg.deleteType(req.params.id, sid(req));
    return success(res, { deleted: true });
  }),
);

// ============== PERFORMANCE BANDS ==============
router.get(
  "/bands",
  h(async (req, res) => success(res, await cfg.listBands(sid(req)))),
);
router.post(
  "/bands",
  h(async (req, res) =>
    success(res, await cfg.upsertBand({ ...req.body, school_id: sid(req) })),
  ),
);
router.put(
  "/bands/:id",
  h(async (req, res) =>
    success(res, await cfg.upsertBand({ ...req.body, school_id: sid(req) })),
  ),
);
router.delete(
  "/bands/:id",
  h(async (req, res) => {
    await cfg.deleteBand(req.params.id, sid(req));
    return success(res, { deleted: true });
  }),
);

// ============== ACHIEVEMENT LEVELS ==============
router.get(
  "/achievement-levels",
  h(async (req, res) => success(res, await cfg.listLevels(sid(req)))),
);
router.post(
  "/achievement-levels",
  h(async (req, res) =>
    success(res, await cfg.upsertLevel({ ...req.body, school_id: sid(req) })),
  ),
);
router.put(
  "/achievement-levels/:id",
  h(async (req, res) =>
    success(res, await cfg.upsertLevel({ ...req.body, school_id: sid(req) })),
  ),
);
router.delete(
  "/achievement-levels/:id",
  h(async (req, res) => {
    await cfg.deleteLevel(req.params.id, sid(req));
    return success(res, { deleted: true });
  }),
);

// ============== COMPETENCIES ==============
router.get(
  "/competencies",
  h(async (req, res) => success(res, await cfg.listCompetencies(sid(req)))),
);
router.post(
  "/competencies",
  h(async (req, res) =>
    success(
      res,
      await cfg.createCompetency({ ...req.body, school_id: sid(req) }),
      201,
    ),
  ),
);
router.put(
  "/competencies/:id",
  h(async (req, res) =>
    success(res, await cfg.updateCompetency(req.params.id, sid(req), req.body)),
  ),
);
router.delete(
  "/competencies/:id",
  h(async (req, res) => {
    await cfg.deleteCompetency(req.params.id, sid(req));
    return success(res, { deleted: true });
  }),
);

// ============== RUBRICS ==============
router.get(
  "/rubrics",
  h(async (req, res) => success(res, await cfg.listRubrics(sid(req)))),
);
router.get(
  "/rubrics/:id",
  h(async (req, res) => {
    const r = await cfg.getRubric(req.params.id, sid(req));
    if (!r) return error(res, "Rubric not found", 404);
    return success(res, r);
  }),
);
router.post(
  "/rubrics",
  h(async (req, res) =>
    success(
      res,
      await cfg.createRubric({ ...req.body, school_id: sid(req) }),
      201,
    ),
  ),
);
router.delete(
  "/rubrics/:id",
  h(async (req, res) => {
    await cfg.deleteRubric(req.params.id, sid(req));
    return success(res, { deleted: true });
  }),
);

// ============== SUBJECT ALLOCATIONS ==============
router.get(
  "/subject-allocations",
  h(async (req, res) =>
    success(
      res,
      await alloc.listSubjectAllocations(sid(req), req.query.grade_id),
    ),
  ),
);
router.post(
  "/subject-allocations",
  h(async (req, res) =>
    success(
      res,
      await alloc.allocateSubjects({ ...req.body, school_id: sid(req) }),
    ),
  ),
);
router.delete(
  "/subject-allocations/:id",
  h(async (req, res) => {
    await alloc.removeSubjectAllocation(req.params.id, sid(req));
    return success(res, { deleted: true });
  }),
);
router.get(
  "/subject-allocations/by-grade/:gradeId",
  h(async (req, res) =>
    success(res, await alloc.subjectsForGrade(sid(req), req.params.gradeId)),
  ),
);

// ============== TEACHER ALLOCATIONS ==============
router.get(
  "/teacher-allocations",
  h(async (req, res) =>
    success(res, await alloc.listTeacherAllocations(sid(req), req.query)),
  ),
);
router.post(
  "/teacher-allocations",
  h(async (req, res) =>
    success(
      res,
      await alloc.createTeacherAllocation({
        ...req.body,
        school_id: sid(req),
      }),
      201,
    ),
  ),
);
router.delete(
  "/teacher-allocations/:id",
  h(async (req, res) => {
    await alloc.deleteTeacherAllocation(req.params.id, sid(req));
    return success(res, { deleted: true });
  }),
);

// ============== ASSESSMENTS (CRUD + lifecycle) ==============
router.get(
  "/",
  h(async (req, res) => success(res, await assess.list(sid(req), req.query))),
);
router.get(
  "/:id",
  h(async (req, res) => {
    const a = await assess.get(req.params.id, sid(req));
    if (!a) return error(res, "Assessment not found", 404);
    return success(res, a);
  }),
);
router.post(
  "/",
  h(async (req, res) =>
    success(
      res,
      await assess.create({
        ...req.body,
        school_id: sid(req),
        created_by: uid(req),
      }),
      201,
    ),
  ),
);
router.put(
  "/:id",
  h(async (req, res) =>
    success(res, await assess.update(req.params.id, sid(req), req.body)),
  ),
);
router.delete(
  "/:id",
  h(async (req, res) => {
    await assess.remove(req.params.id, sid(req));
    return success(res, { deleted: true });
  }),
);
router.post(
  "/:id/publish",
  h(async (req, res) =>
    success(res, await assess.publish(req.params.id, sid(req))),
  ),
);
router.post(
  "/:id/status",
  h(async (req, res) =>
    success(
      res,
      await assess.setStatus(req.params.id, sid(req), req.body.status),
    ),
  ),
);

// ============== TASKS ==============
router.get(
  "/tasks/list",
  h(async (req, res) =>
    success(res, await assess.listTasks(sid(req), req.query, req.user)),
  ),
);
router.post(
  "/tasks/:id/reassign",
  h(async (req, res) => {
    await assess.reassignTask(req.params.id, req.body.teacher_id);
    return success(res, { ok: true });
  }),
);
router.post(
  "/tasks/:id/status",
  h(async (req, res) => {
    await assess.setTaskStatus(req.params.id, req.body.status);
    return success(res, { ok: true });
  }),
);
router.get(
  "/tasks/:id/roster",
  h(async (req, res) =>
    success(res, await marks.roster(sid(req), req.params.id)),
  ),
);
router.post(
  "/tasks/:id/submit",
  h(async (req, res) =>
    success(res, await marks.submitTask(sid(req), req.params.id)),
  ),
);

// ============== MARKS ==============
router.get(
  "/marks",
  h(async (req, res) => success(res, await marks.list(sid(req), req.query))),
);
router.post(
  "/marks/bulk",
  h(async (req, res) =>
    success(
      res,
      await marks.bulkSave(sid(req), { ...req.body, recorded_by: uid(req) }),
    ),
  ),
);

module.exports = router;
