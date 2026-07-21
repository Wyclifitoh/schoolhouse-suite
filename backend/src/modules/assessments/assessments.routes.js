const router = require("express").Router();
const archiverLib = require("archiver");
// Normalise across CJS/ESM builds — some environments expose the function
// on `.default` instead of the module root.
const archiver =
  typeof archiverLib === "function"
    ? archiverLib
    : typeof archiverLib?.default === "function"
      ? archiverLib.default
      : typeof archiverLib?.create === "function"
        ? (fmt, opts) => archiverLib.create(fmt, opts)
        : null;
const cfg = require("./config.repository");
const alloc = require("./allocations.repository");
const assess = require("./assessments.repository");
const marks = require("./marks.repository");
const results = require("./results.repository");
const analytics = require("./analytics.repository");
const reportCards = require("./report_cards.repository");
const comparison = require("./comparison.repository");
const pdfSvc = require("./pdf.service");
const { queryOne } = require("../../config/database");
const { success, error } = require("../../utils/response");
const billing = require("../billing/billing.repository");

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

async function loadSchool(schoolId) {
  const s = await queryOne("SELECT * FROM schools WHERE id=?", [schoolId]);
  const st = await queryOne("SELECT * FROM school_settings WHERE school_id=?", [
    schoolId,
  ]).catch(() => null);
  return { ...s, settings: st || {} };
}

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

// ============== SUBJECT REMARK BANDS (auto-fill remarks) ==============
router.use("/remark-bands", require("./remark-bands.routes"));

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

// ============== MARKS (list) — must come BEFORE /:id to avoid wildcard capture ==============
// GET /assessments/marks?assessment_id=...&grade_id=...&stream_id=...
// This is a dedicated preview endpoint for the Marks Preview tab in Results.
// It uses its own isolated function so it won't affect marks entry or task roster.
router.get(
  "/marks",
  h(async (req, res) =>
    success(res, await marks.listForPreview(sid(req), req.query)),
  ),
);

// ============== ASSESSMENTS (CRUD + lifecycle) ==============
router.get(
  "/",
  h(async (req, res) =>
    success(res, await assess.list(sid(req), req.query, req.user)),
  ),
);
router.get(
  "/:id",
  h(async (req, res) => {
    const a = await assess.get(req.params.id, sid(req));
    if (!a) return error(res, "Assessment not found", 404);

    const userRoles = (req.user?.roles || []).map((r) => {
      if (typeof r === "object" && r.role) return r.role;
      if (typeof r === "string") return r;
      return r;
    });
    const isTeacher = userRoles.some((role) => role === "teacher");
    const isAdmin = userRoles.some((role) =>
      [
        "super_admin",
        "school_admin",
        "admin",
        "manager",
        "deputy_admin",
      ].includes(role),
    );

    if (isTeacher && !isAdmin && a.status === "draft") {
      return error(res, "Assessment not found", 404);
    }

    return success(res, a);
  }),
);
router.post(
  "/",
  h(async (req, res) => {
    const schoolId = sid(req);

    // ── SaaS billing gate ────────────────────────────────────────────────────
    // Allow creation during trial or when subscription is active.
    // Block if trial expired AND there are unpaid assessment bills.
    const gate = await billing.checkAssessmentAllowed(schoolId);
    if (!gate.allowed) {
      return error(
        res,
        gate.reason || "Assessment creation blocked: subscription required.",
        402,
      );
    }
    // ─────────────────────────────────────────────────────────────────────────

    const newAssessment = await assess.create({
      ...req.body,
      school_id: schoolId,
      created_by: uid(req),
    });

    // If trial has expired but subscription is active, record billing
    if (!gate.trialActive && gate.sub?.status === "active") {
      try {
        const studentCount = await billing.countActiveStudents(schoolId);
        const pricePerStudent = gate.sub?.assessment_price_per_student || 10;
        await billing.recordAssessmentBilling(
          schoolId,
          newAssessment.id,
          studentCount,
          pricePerStudent,
        );
      } catch (e) {
        console.warn(
          "[billing] Failed to record assessment billing:",
          e.message,
        );
      }
    }

    return success(res, newAssessment, 201);
  }),
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
router.post(
  "/:id/resync-subjects",
  h(async (req, res) =>
    success(res, await assess.resyncSubjects(req.params.id, sid(req))),
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

// ============== MARKS (bulk save) ==============
// NOTE: GET /marks is declared earlier (before /:id) to avoid Express wildcard capture.
router.post(
  "/marks/bulk",
  h(async (req, res) =>
    success(
      res,
      await marks.bulkSave(sid(req), { ...req.body, recorded_by: uid(req) }),
    ),
  ),
);

// ============== RESULTS ==============
router.get(
  "/:id/results",
  h(async (req, res) =>
    success(
      res,
      await results.list(sid(req), {
        ...req.query,
        assessment_id: req.params.id,
      }),
    ),
  ),
);
router.post(
  "/:id/results/compute",
  h(async (req, res) =>
    success(
      res,
      await results.compute(sid(req), req.params.id, req.body || {}),
    ),
  ),
);
router.post(
  "/:id/results/recompute-positions",
  h(async (req, res) =>
    success(res, await results.recomputePositions(sid(req), req.params.id)),
  ),
);
// Only admins / managers / academics can approve/publish/revoke results.
// Teachers may submit (move to pending_review) only.
const APPROVAL_ROLES = new Set([
  "super_admin",
  "admin",
  "school_admin",
  "deputy_admin",
  "manager",
  "academic",
]);
function userRoles(req) {
  const list = Array.isArray(req.user?.roles)
    ? req.user.roles.map((r) => r.role || r).filter(Boolean)
    : [];
  if (req.user?.role) list.push(req.user.role);
  return list;
}
router.post(
  "/:id/results/bulk-status",
  h(async (req, res) => {
    const roles = userRoles(req);
    const status = req.body?.status;
    const isApprovalAction = ["approved", "published", "revoked"].includes(
      status,
    );
    if (isApprovalAction && !roles.some((r) => APPROVAL_ROLES.has(r))) {
      return error(
        res,
        "Only admins or managers can approve, publish or revoke results.",
        403,
      );
    }
    const out = await results.bulkSetStatus(sid(req), req.params.id, {
      ...req.body,
      actor_id: uid(req),
    });
    // Auto-generate report cards when results are published
    if (status === "published") {
      try {
        await reportCards.createRun({
          school_id: sid(req),
          assessment_id: req.params.id,
          grade_id: req.body.grade_id || null,
          stream_id: req.body.stream_id || null,
          template_id: req.body.template_id || null,
          created_by: uid(req),
          academic_year_id:
            req.body.academic_year_id || req.session?.academicYearId || null,
          term_id: req.body.term_id || req.session?.termId || null,
        });
      } catch (e) {
        console.warn("[assessments] auto report card run failed:", e.message);
      }
    }
    return success(res, out);
  }),
);
router.get(
  "/:id/results/student/:studentId",
  h(async (req, res) => {
    const r = await results.studentDetail(
      sid(req),
      req.params.id,
      req.params.studentId,
    );
    if (!r) return error(res, "Not found", 404);
    return success(res, r);
  }),
);

// ============== ANALYTICS ==============
const _aFilters = (q) => ({
  grade_id: q.grade_id || undefined,
  stream_id: q.stream_id || undefined,
  subject_id: q.subject_id || undefined,
});
router.get(
  "/:id/analytics/overview",
  h(async (req, res) =>
    success(
      res,
      await analytics.overview(sid(req), req.params.id, _aFilters(req.query)),
    ),
  ),
);
router.get(
  "/:id/analytics/subjects",
  h(async (req, res) =>
    success(
      res,
      await analytics.subjectMeans(
        sid(req),
        req.params.id,
        _aFilters(req.query),
      ),
    ),
  ),
);
router.get(
  "/:id/analytics/bands",
  h(async (req, res) =>
    success(
      res,
      await analytics.bandDistribution(
        sid(req),
        req.params.id,
        _aFilters(req.query),
      ),
    ),
  ),
);
router.get(
  "/:id/analytics/levels",
  h(async (req, res) =>
    success(
      res,
      await analytics.alDistribution(
        sid(req),
        req.params.id,
        _aFilters(req.query),
      ),
    ),
  ),
);
router.get(
  "/:id/analytics/leaderboard",
  h(async (req, res) =>
    success(
      res,
      await analytics.leaderboard(
        sid(req),
        req.params.id,
        req.query.limit,
        _aFilters(req.query),
      ),
    ),
  ),
);
router.get(
  "/:id/analytics/grades",
  h(async (req, res) =>
    success(
      res,
      await analytics.gradeMeans(sid(req), req.params.id, _aFilters(req.query)),
    ),
  ),
);
router.get(
  "/:id/analytics/streams",
  h(async (req, res) =>
    success(
      res,
      await analytics.streamMeans(
        sid(req),
        req.params.id,
        _aFilters(req.query),
      ),
    ),
  ),
);

// Analytics exports — PDF & Excel (with optional grade/stream/subject filters)
function extractFilters(q) {
  return {
    grade_id: q.grade_id || undefined,
    stream_id: q.stream_id || undefined,
    subject_id: q.subject_id || undefined,
  };
}

async function gatherAnalytics(schoolId, assessmentId, filters = {}) {
  const [overview, subjects, bands, levels, leaderboard, grades, streams] =
    await Promise.all([
      analytics.overview(schoolId, assessmentId, filters),
      analytics.subjectMeans(schoolId, assessmentId, filters),
      analytics.bandDistribution(schoolId, assessmentId, filters),
      analytics.alDistribution(schoolId, assessmentId, filters),
      analytics.leaderboard(schoolId, assessmentId, 50, filters),
      analytics.gradeMeans(schoolId, assessmentId, filters),
      analytics.streamMeans(schoolId, assessmentId, filters),
    ]);
  return {
    overview,
    subjects,
    bands,
    levels,
    leaderboard,
    grades,
    streams,
    filters,
  };
}
router.get(
  "/:id/analytics/export.pdf",
  h(async (req, res) => {
    const schoolId = sid(req);
    const filters = extractFilters(req.query);
    const [school, assessment, data] = await Promise.all([
      loadSchool(schoolId),
      queryOne("SELECT * FROM assessments WHERE id=? AND school_id=?", [
        req.params.id,
        schoolId,
      ]),
      gatherAnalytics(schoolId, req.params.id, filters),
    ]);
    if (!assessment) return error(res, "Assessment not found", 404);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="analytics-${assessment.name.replace(/\W+/g, "_")}.pdf"`,
    );
    await pdfSvc.streamAnalyticsPdf({ res, school, assessment, data });
  }),
);
router.get(
  "/:id/analytics/export.xlsx",
  h(async (req, res) => {
    const schoolId = sid(req);
    const filters = extractFilters(req.query);
    const [school, assessment, data] = await Promise.all([
      loadSchool(schoolId),
      queryOne("SELECT * FROM assessments WHERE id=? AND school_id=?", [
        req.params.id,
        schoolId,
      ]),
      gatherAnalytics(schoolId, req.params.id, filters),
    ]);
    if (!assessment) return error(res, "Assessment not found", 404);
    const wb = await pdfSvc.buildAnalyticsXlsx({ school, assessment, data });
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="analytics-${assessment.name.replace(/\W+/g, "_")}.xlsx"`,
    );
    await wb.xlsx.write(res);
    res.end();
  }),
);

// ============== COMPARISON ==============
router.get(
  "/:id/comparison/previous",
  h(async (req, res) =>
    success(
      res,
      await comparison.previousAssessments(
        sid(req),
        req.params.id,
        req.query.limit,
      ),
    ),
  ),
);
router.get(
  "/:id/comparison/vs/:prevId",
  h(async (req, res) => {
    const schoolId = sid(req);
    const [overall, subjects, grades, movers] = await Promise.all([
      comparison.overall(schoolId, req.params.id, req.params.prevId),
      comparison.subjects(schoolId, req.params.id, req.params.prevId),
      comparison.grades(schoolId, req.params.id, req.params.prevId),
      comparison.movers(
        schoolId,
        req.params.id,
        req.params.prevId,
        Number(req.query.limit) || 10,
      ),
    ]);
    return success(res, { overall, subjects, grades, movers });
  }),
);

// ============== REPORT CARDS ==============
// Templates
router.get(
  "/report-cards/templates",
  h(async (req, res) =>
    success(res, await reportCards.listTemplates(sid(req))),
  ),
);
router.post(
  "/report-cards/templates",
  h(async (req, res) =>
    success(
      res,
      await reportCards.createTemplate({ ...req.body, school_id: sid(req) }),
      201,
    ),
  ),
);
router.put(
  "/report-cards/templates/:id",
  h(async (req, res) =>
    success(
      res,
      await reportCards.updateTemplate(req.params.id, sid(req), req.body),
    ),
  ),
);
router.delete(
  "/report-cards/templates/:id",
  h(async (req, res) => {
    await reportCards.deleteTemplate(req.params.id, sid(req));
    return success(res, { deleted: true });
  }),
);

// Runs (bulk generation)
router.get(
  "/report-cards/runs",
  h(async (req, res) =>
    success(res, await reportCards.listRuns(sid(req), req.query, req.session)),
  ),
);
router.post(
  "/report-cards/runs",
  h(async (req, res) =>
    success(
      res,
      await reportCards.createRun({
        ...req.body,
        school_id: sid(req),
        created_by: uid(req),
        academic_year_id:
          req.body.academic_year_id || req.session?.academicYearId || null,
        term_id: req.body.term_id || req.session?.termId || null,
      }),
      201,
    ),
  ),
);
router.post(
  "/report-cards/runs/:id/publish",
  h(async (req, res) =>
    success(res, await reportCards.publishRun(req.params.id, sid(req))),
  ),
);
router.get(
  "/report-cards/runs/:id/cards",
  h(async (req, res) =>
    success(res, await reportCards.listCards(req.params.id)),
  ),
);

// Delete a run (and its cards)
router.delete(
  "/report-cards/runs/:id",
  h(async (req, res) => {
    const schoolId = sid(req);
    const run = await queryOne(
      "SELECT id FROM report_card_runs_v2 WHERE id=? AND school_id=?",
      [req.params.id, schoolId],
    );
    if (!run) return error(res, "Run not found", 404);
    const { execute } = require("../../config/database");
    await execute("DELETE FROM report_cards_v2 WHERE run_id=?", [
      req.params.id,
    ]);
    await execute("DELETE FROM report_card_runs_v2 WHERE id=?", [
      req.params.id,
    ]);
    return success(res, { ok: true });
  }),
);

// Bulk combined PDF of all cards in a run (multi-page single PDF)
router.get(
  "/report-cards/runs/:id/download.pdf",
  h(async (req, res) => {
    const schoolId = sid(req);
    const run = await queryOne(
      "SELECT * FROM report_card_runs_v2 WHERE id=? AND school_id=?",
      [req.params.id, schoolId],
    );
    if (!run) return error(res, "Run not found", 404);
    const cards = await reportCards.listCards(req.params.id);
    const school = await loadSchool(schoolId);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="report-cards-${run.id}.pdf"`,
    );
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    await pdfSvc.streamCombinedReportCardsPdf({
      res,
      schoolId,
      school,
      cards: await Promise.all(
        cards.map(async (c) => reportCards.getCard(c.id)),
      ),
    });
  }),
);

// Single report card PDF
router.get(
  "/report-cards/cards/:cardId/pdf",

  h(async (req, res) => {
    const schoolId = sid(req);
    const card = await reportCards.getCard(req.params.cardId);
    if (!card) return error(res, "Card not found", 404);
    const school = await loadSchool(schoolId);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="report-card-${card.student_id}.pdf"`,
    );
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    await pdfSvc.streamReportCardPdf({ res, schoolId, card, school });
  }),
);

// Remarks update (teacher / class teacher / principal)
router.put(
  "/report-cards/cards/:cardId/remarks",
  h(async (req, res) => {
    await reportCards.updateRemarks(req.params.cardId, req.body || {});
    return success(res, { ok: true });
  }),
);

// Bulk ZIP of all PDFs in a run
router.get(
  "/report-cards/runs/:id/download.zip",
  h(async (req, res) => {
    const schoolId = sid(req);
    const run = await queryOne(
      "SELECT * FROM report_card_runs_v2 WHERE id=? AND school_id=?",
      [req.params.id, schoolId],
    );
    if (!run) return error(res, "Run not found", 404);
    const cards = await reportCards.listCards(req.params.id);
    const school = await loadSchool(schoolId);

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="report-cards-${run.id}.zip"`,
    );
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    const archive = archiver("zip", { zlib: { level: 6 } });
    archive.on("error", (err) => {
      throw err;
    });
    archive.pipe(res);

    for (const c of cards) {
      const fullCard = await reportCards.getCard(c.id);
      if (!fullCard) continue;
      const safeName =
        `${c.first_name || ""}_${c.last_name || ""}_${c.admission_number || c.student_id}`.replace(
          /\W+/g,
          "_",
        );
      // Buffer the PDF, then append
      const chunks = [];
      const fakeRes = {
        write: (chunk) => chunks.push(chunk),
        end: () => {},
        setHeader: () => {},
      };
      // Wrap PDFKit which expects a pipe target — use a passthrough
      const { PassThrough } = require("stream");
      const pt = new PassThrough();
      const bufPromise = new Promise((resolve, reject) => {
        const buf = [];
        pt.on("data", (d) => buf.push(d));
        pt.on("end", () => resolve(Buffer.concat(buf)));
        pt.on("error", reject);
      });
      await pdfSvc.streamReportCardPdf({
        res: pt,
        schoolId,
        card: fullCard,
        school,
      });
      const pdfBuf = await bufPromise;
      archive.append(pdfBuf, { name: `${safeName}.pdf` });
    }
    await archive.finalize();
  }),
);

// ============================================================================
// SUMMATIVE REPORTS
// ============================================================================
router.post(
  "/summative-report",
  h(async (req, res) => {
    const { assessmentIds, gradeId, streamId, title } = req.body;
    if (!assessmentIds || !assessmentIds.length) {
      return res.status(400).json({ error: "No assessments selected" });
    }

    const summativeRepo = require("./summative.repository");
    const { cards, assessments } = await summativeRepo.generateSummativeData(
      sid(req),
      assessmentIds,
      gradeId,
      streamId,
    );

    if (!cards || !cards.length) {
      return res.status(404).json({ error: "No student data found" });
    }

    const school = await require("../../config/database").queryOne(
      "SELECT * FROM schools WHERE id=?",
      [sid(req)],
    );
    const settings = await require("../../config/database").queryOne(
      "SELECT * FROM school_settings WHERE school_id=?",
      [sid(req)],
    );
    school.settings = settings || {};

    const pdfService = require("./pdf.service");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Summative_Report.pdf"`,
    );

    await pdfService.streamCombinedSummativePdf({
      res,
      school,
      cards,
      assessments,
      title: title || "Summative Report",
    });
  }),
);

module.exports = router;
