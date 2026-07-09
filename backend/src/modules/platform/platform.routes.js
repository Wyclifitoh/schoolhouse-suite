const router = require("express").Router();
const c = require("./platform.controller");
const { requirePlatformAuth, requirePlatformRole } = require("../../middlewares/platform.middleware");

// Public — platform login
router.post("/auth/login", c.login);

// All routes below require a platform JWT
router.use(requirePlatformAuth);
router.get("/auth/me", c.me);

// Overview / dashboards
router.get("/overview", c.overview);

// Schools
router.get("/schools", c.listSchools);
router.post("/schools", requirePlatformRole("platform_admin"), c.createSchool);
router.get("/schools/:id", c.schoolDetail);
router.post("/schools/:id/extend-trial", c.extendTrial);
router.post("/schools/:id/terminate-trial", c.terminateTrial);
router.post("/schools/:id/status", c.setStatus);
router.post("/schools/:id/active", c.setSchoolActive);
router.post("/schools/:id/activate-subscription", c.activateSubscription);
router.post("/schools/:id/invoices", c.createInvoice);

// Assessment billing (per-exam billing management)
router.get("/schools/:id/assessment-billing", c.listAssessmentBilling);
router.post("/schools/:id/assessment-billing/mark-paid", c.markAssessmentBillingPaid);
router.get("/schools/:id/billing-status", c.getBillingStatus);

// Billing
router.get("/subscriptions", c.listSubscriptions);
router.get("/invoices", c.listInvoices);
router.get("/revenue/monthly", c.revenueByMonth);
router.post("/invoices/:invoiceId/confirm", c.confirmInvoice);
router.post("/invoices/:invoiceId/void", c.voidInvoice);

// Plans (admin only)
router.get("/plans", c.listPlans);
router.post("/plans", requirePlatformRole("platform_admin"), c.createPlan);
router.put("/plans/:id", requirePlatformRole("platform_admin"), c.updatePlan);
router.delete("/plans/:id", requirePlatformRole("platform_admin"), c.deletePlan);

// Users (cross-school)
router.get("/users", c.searchUsers);
router.post("/users/:id/active", c.setUserActive);
router.post("/users/:id/reset-password", c.resetUserPassword);

// Platform staff management (admin only)
router.get("/staff", requirePlatformRole("platform_admin"), c.listStaff);
router.post("/staff", requirePlatformRole("platform_admin"), c.createStaff);
router.post("/staff/:id/active", requirePlatformRole("platform_admin"), c.setStaffActive);

// Audit
router.get("/audit", c.audit);

module.exports = router;