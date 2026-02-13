const router = require('express').Router();
const financeController = require('./finance.controller');

router.get('/fee-templates', financeController.listFeeTemplates);
router.get('/students/:studentId/fees', financeController.getStudentFees);
router.post('/fees/assign', financeController.assignFee);
router.get('/students/:studentId/balance', financeController.getStudentBalance);
router.post('/payments', financeController.recordPayment);
router.post('/carry-forward', financeController.processCarryForward);

module.exports = router;
