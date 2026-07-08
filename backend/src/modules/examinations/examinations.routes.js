const router = require("express").Router();
const c = require("./examinations.controller");
const x = require("./extras.controller");
const portal = require("./portal.controller");
const { blockArchivedWrites } = require("../../middlewares/session.middleware");
const { requireExamRole } = require("./lifecycle");

// ===== Portal (parent / student) — APPROVED + published only =====
router.get("/portal/results", portal.listPortalResults);

// ===== Exams =====
router.get("/exams", c.listExams);
router.get("/exams/:id", c.getExam);
router.post(
  "/exams",
  requireExamRole("teacher"),
  blockArchivedWrites,
  c.createExam,
);
router.put(
  "/exams/:id",
  requireExamRole("teacher"),
  blockArchivedWrites,
  c.updateExam,
);
router.delete(
  "/exams/:id",
  requireExamRole("admin"),
  blockArchivedWrites,
  c.deleteExam,
);

// ----- Lifecycle -----
router.post(
  "/exams/:id/submit",
  requireExamRole("teacher"),
  blockArchivedWrites,
  c.submitExam,
);
router.post(
  "/exams/:id/review",
  requireExamRole("hod"),
  blockArchivedWrites,
  c.reviewExam,
);
router.post(
  "/exams/:id/approve",
  requireExamRole("academic"),
  blockArchivedWrites,
  c.approveExam,
);
router.post(
  "/exams/:id/lock",
  requireExamRole("admin"),
  blockArchivedWrites,
  c.lockExam,
);
router.post(
  "/exams/:id/reopen",
  requireExamRole("admin"),
  blockArchivedWrites,
  c.reopenExam,
);
router.post("/exams/:id/archive", requireExamRole("admin"), c.archiveExam);

// ----- Exam subjects -----
router.get("/exams/:id/subjects", c.listExamSubjects);
router.post(
  "/exams/:id/subjects",
  requireExamRole("teacher"),
  blockArchivedWrites,
  c.upsertExamSubject,
);

// ----- Audit -----
router.get("/exams/:id/audit", requireExamRole("hod"), c.examAudit);
router.get("/marks/:id/audit", requireExamRole("hod"), c.markAudit);

// ----- Analytics & rankings -----
router.get("/exams/:id/analytics", x.examAnalytics);
router.post(
  "/exams/:id/rankings/recompute",
  requireExamRole("academic"),
  x.recomputeRankings,
);

// ===== Schedules =====
router.get("/schedules", c.listSchedules);
router.post(
  "/schedules",
  requireExamRole("academic"),
  blockArchivedWrites,
  c.createSchedule,
);
router.put(
  "/schedules/:id",
  requireExamRole("academic"),
  blockArchivedWrites,
  c.updateSchedule,
);
router.delete(
  "/schedules/:id",
  requireExamRole("academic"),
  blockArchivedWrites,
  c.deleteSchedule,
);

// ===== Marks =====
router.get("/marks", c.listMarks);
router.post(
  "/marks",
  requireExamRole("teacher"),
  blockArchivedWrites,
  c.recordMark,
);
router.post(
  "/marks/bulk",
  requireExamRole("teacher"),
  blockArchivedWrites,
  c.bulkMarks,
);
router.post(
  "/marks/:id/submit",
  requireExamRole("teacher"),
  blockArchivedWrites,
  c.submitMarks,
);
router.delete(
  "/marks/:id",
  requireExamRole("teacher"),
  blockArchivedWrites,
  c.deleteMark,
);

// ===== 8-4-4 paper-level marks =====
router.get("/paper-marks", c.listPaperMarks);
router.post(
  "/paper-marks",
  requireExamRole("teacher"),
  blockArchivedWrites,
  c.recordPaperMark,
);
router.post(
  "/paper-marks/bulk",
  requireExamRole("teacher"),
  blockArchivedWrites,
  c.bulkPaperMarks,
);

// ===== Configuration: assessment types =====
router.get("/assessment-types", x.listAssessmentTypes);
router.post(
  "/assessment-types",
  requireExamRole("super_admin"),
  x.createAssessmentType,
);
router.put(
  "/assessment-types/:id",
  requireExamRole("super_admin"),
  x.updateAssessmentType,
);
router.delete(
  "/assessment-types/:id",
  requireExamRole("super_admin"),
  x.deleteAssessmentType,
);

// ===== Configuration: grading scales =====
router.get("/grading-scales", x.listGradingScales);
router.get("/grading-scales/:id", x.getGradingScale);
router.post(
  "/grading-scales",
  requireExamRole("super_admin"),
  x.createGradingScale,
);
router.put(
  "/grading-scales/:id",
  requireExamRole("super_admin"),
  x.updateGradingScale,
);
router.delete(
  "/grading-scales/:id",
  requireExamRole("super_admin"),
  x.deleteGradingScale,
);

// ===== CBC competencies =====
router.get("/competencies", x.listCompetencies);
router.post("/competencies", requireExamRole("academic"), x.createCompetency);
router.put(
  "/competencies/:id",
  requireExamRole("academic"),
  x.updateCompetency,
);
router.delete(
  "/competencies/:id",
  requireExamRole("admin"),
  x.deleteCompetency,
);

// ===== CBC observations =====
router.get("/observations", x.listObservations);
router.post(
  "/observations",
  requireExamRole("teacher"),
  blockArchivedWrites,
  x.createObservation,
);
router.delete(
  "/observations/:id",
  requireExamRole("hod"),
  blockArchivedWrites,
  x.deleteObservation,
);

// ===== Report cards =====
router.get("/report-card-templates", x.listTemplates);
router.post(
  "/report-card-templates",
  requireExamRole("admin"),
  x.createTemplate,
);
router.delete(
  "/report-card-templates/:id",
  requireExamRole("admin"),
  x.deleteTemplate,
);

router.get("/report-card-runs", x.listReportRuns);
router.post(
  "/report-card-runs",
  requireExamRole("academic"),
  x.createReportRun,
);
router.post(
  "/report-card-runs/:id/publish",
  requireExamRole("academic"),
  x.publishReportRun,
);

module.exports = router;
