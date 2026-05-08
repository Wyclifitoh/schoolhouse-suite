const router = require('express').Router();
const c = require('./finance.controller');

router.get('/fee-templates', c.getFeeTemplates);
router.get('/fee-categories', c.getFeeCategories);
router.post('/fee-categories', c.createFeeCategory);
router.get('/fee-structures', c.getFeeStructures);
router.post('/fee-structures', c.createFeeStructure);
router.put('/fee-structures/:id', c.updateFeeStructure);
router.delete('/fee-structures/:id', c.deleteFeeStructure);
router.get('/fee-discounts', c.getFeeDiscounts);
router.post('/fee-discounts', c.createFeeDiscount);
router.get('/carry-forwards', c.getCarryForwards);
router.get('/student-fees-list', c.getStudentFeesList);
router.get('/student-fees/:studentId', c.getStudentFees);
router.get('/student-balance/:studentId', c.getStudentBalance);
router.post('/student-fees', c.createStudentFee);
router.get('/fee-assignments', c.getFeeAssignments);
router.post('/fee-assignments/bulk', c.bulkAssignFee);
router.post('/fee-assignments/bulk-unassign', c.bulkUnassignFee);
router.get('/expenses', c.getExpenses);
router.get('/expense-categories', c.getExpenseCategories);
router.get('/audit-logs', c.getAuditLogs);

module.exports = router;
