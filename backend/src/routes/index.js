const router = require("express").Router();
const { authenticate } = require("../middlewares/auth.middleware");
const { requireSchool } = require("../middlewares/tenant.middleware");
const { resolveSession } = require("../middlewares/session.middleware");

const paymentsController = require("../modules/payments/payments.controller");

// Public routes
const authRoutes = require("../modules/auth/auth.routes");
router.use("/auth", authRoutes);

// Parent / Student portal (separate auth, no school header required)
router.use("/portal", require("../modules/portal/portal.routes"));

// M-Pesa webhook (no auth)
router.post("/webhooks/mpesa/callback", paymentsController.mpesaCallback);

// Protected routes - require auth
router.use(authenticate);

// Schools route (no school header needed)
const schoolsController = require("../modules/schools/schools.controller");
router.get("/schools/my-schools", schoolsController.getMySchools);

// Protected routes that need school context
router.use(requireSchool);
router.use(resolveSession);

router.use("/schools", require("../modules/schools/schools.routes"));
router.use("/users", require("../modules/users/users.routes"));
router.use("/students", require("../modules/students/students.routes"));
router.use("/parents", require("../modules/parents/parents.routes"));
router.use("/classes", require("../modules/classes/classes.routes"));
router.use("/finance", require("../modules/finance/finance.routes"));
router.use("/payments", require("../modules/payments/payments.routes"));
router.use("/attendance", require("../modules/attendance/attendance.routes"));
router.use("/inventory", require("../modules/inventory/inventory.routes"));
router.use("/reports", require("../modules/reports/reports.routes"));
router.use(
  "/designations",
  require("../modules/designations/designations.routes"),
);
router.use("/departments", require("../modules/department/departments.routes"));
router.use("/staff", require("../modules/staff/staff.routes"));
router.use(
  "/communication",
  require("../modules/communication/communication.routes"),
);
router.use(
  "/examinations",
  require("../modules/examinations/examinations.routes"),
);
// New CBC Assessments module (Phase 1: config + allocations)
router.use(
  "/assessments",
  require("../modules/assessments/assessments.routes"),
);
router.use("/promotion", require("../modules/promotion/promotion.routes"));
router.use(
  "/notifications",
  require("../modules/notifications/notifications.routes"),
);
router.use(
  "/lesson-plans",
  require("../modules/lesson-plans/lesson-plans.routes"),
);

// HR module redesign (2026-05-31)
router.use("/leaves", require("../modules/leaves/leaves.routes"));
router.use("/ratings", require("../modules/ratings/ratings.routes"));
router.use("/payroll", require("../modules/payroll/payroll.routes"));
router.use(
  "/staff-attendance",
  require("../modules/staff-attendance/staff-attendance.routes"),
);
router.use("/timetable", require("../modules/timetable/timetable.routes"));

module.exports = router;
