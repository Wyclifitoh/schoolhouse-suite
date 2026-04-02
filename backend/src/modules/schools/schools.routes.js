const router = require('express').Router();
const c = require('./schools.controller');

router.get('/my-schools', c.getMySchools);
router.get('/profile', c.getSchool);
router.put('/profile', c.updateSchool);
router.get('/terms', c.getTerms);
router.get('/academic-years', c.getAcademicYears);
router.get('/dashboard-stats', c.getDashboardStats);
router.get('/users', c.getUsers);
router.get('/notification-templates', c.getNotificationTemplates);
router.put('/notification-templates/:id', c.updateNotificationTemplate);

module.exports = router;
