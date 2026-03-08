const router = require('express').Router();
const c = require('./finance.controller');

router.get('/fee-templates', c.getFeeTemplates);
router.get('/fee-categories', c.getFeeCategories);
router.get('/fee-structures', c.getFeeStructures);
router.get('/fee-discounts', c.getFeeDiscounts);
router.get('/carry-forwards', c.getCarryForwards);
router.get('/student-fees-list', c.getStudentFeesList);
router.get('/student-fees/:studentId', c.getStudentFees);
router.get('/student-balance/:studentId', c.getStudentBalance);
router.post('/student-fees', c.createStudentFee);
router.get('/expenses', c.getExpenses);
router.get('/expense-categories', c.getExpenseCategories);

module.exports = router;
