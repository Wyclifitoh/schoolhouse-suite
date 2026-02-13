const router = require('express').Router();
const attendanceController = require('./attendance.controller');

router.get('/class/:classId', attendanceController.getByClass);
router.post('/', attendanceController.mark);
router.post('/bulk', attendanceController.bulkMark);
router.get('/student/:studentId', attendanceController.getByStudent);

module.exports = router;
