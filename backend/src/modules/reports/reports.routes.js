const router = require('express').Router();
const ctrl = require('./reports.controller');

router.get('/finance', ctrl.financeReport);
router.get('/payments', ctrl.paymentsReport);
router.get('/students', ctrl.studentReport);
router.get('/attendance', ctrl.attendanceReport);
router.get('/exams', ctrl.examReport);

module.exports = router;
