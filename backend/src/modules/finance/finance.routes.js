const router = require("express").Router();
const c = require("./finance.controller");
const statementController = require("./statement.controller");

router.get("/fee-templates", c.getFeeTemplates);
router.get("/fee-categories", c.getFeeCategories);
router.post("/fee-categories", c.createFeeCategory);
router.get("/fee-structures", c.getFeeStructures);
router.post("/fee-structures", c.createFeeStructure);
router.put("/fee-structures/:id", c.updateFeeStructure);
router.delete("/fee-structures/:id", c.deleteFeeStructure);
router.get("/fee-discounts", c.getFeeDiscounts);
router.post("/fee-discounts", c.createFeeDiscount);
router.get("/carry-forwards", c.getCarryForwards);
router.get("/student-fees-list", c.getStudentFeesList);
router.get("/student-fees/:studentId", c.getStudentFees);
router.get(
  "/student-fees/:studentId/statement",
  statementController.downloadStatement,
);
router.get("/student-balance/:studentId", c.getStudentBalance);
router.post("/student-fees", c.createStudentFee);
router.get("/fee-assignments", c.getFeeAssignments);
router.post("/fee-assignments/bulk", c.bulkAssignFee);
router.post("/fee-assignments/bulk-unassign", c.bulkUnassignFee);
router.get("/expenses", c.getExpenses);
router.get("/expense-categories", c.getExpenseCategories);
router.get("/excess-credits", c.getExcessCredits);
router.get("/student-outstanding-fees/:studentId", c.getStudentOutstandingFees);
router.post("/excess-credits/:id/apply", c.applyExcessCredit);
router.get("/audit-logs", c.getAuditLogs);

// Standalone discount application (independent of bulk fee assignment)
router.get("/applied-discounts", c.listAppliedDiscounts);
router.post("/applied-discounts", c.applyDiscount);
router.delete("/applied-discounts/:id", c.revokeDiscount);

// Term close → carry-forward arrears to next term
router.post("/terms/close", c.closeTerm);

// Fee adjustments with approval workflow
router.get("/adjustments", c.listFeeAdjustments);
router.post("/adjustments", c.createFeeAdjustment);
router.post("/adjustments/:id/decision", c.decideFeeAdjustment);

// Daily reconciliation report
router.get("/reconciliation", c.getReconciliationReport);

module.exports = router;
