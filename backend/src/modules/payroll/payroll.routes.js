const router = require("express").Router();
const c = require("./payroll.controller");

// Periods
router.post("/periods",          c.createPeriod);
router.get ("/periods",          c.listPeriods);
router.get ("/periods/:id",      c.getPeriod);
router.post("/periods/:id/run",    c.runPeriod);
router.post("/periods/:id/approve",c.approvePeriod);
router.post("/periods/:id/pay",    c.markPaid);
router.get ("/periods/:id/runs",   c.listRuns);

// Allowances per staff
router.get ("/allowances/:staffId", c.listAllowances);
router.post("/allowances",          c.upsertAllowance);

// Deductions per staff
router.get ("/deductions/:staffId", c.listDeductions);
router.post("/deductions",          c.upsertDeduction);

module.exports = router;
