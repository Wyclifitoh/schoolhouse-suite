const router = require('express').Router();
const c = require('./schools.controller');

router.get('/my-schools', c.getMySchools);
router.get('/profile', c.getSchool);
router.put('/profile', c.updateSchool);
router.get('/terms', c.getTerms);
router.post('/terms', c.createTerm);
router.put('/terms/:id/set-current', c.setCurrentTerm);
router.delete('/terms/:id', c.deleteTerm);
router.get('/academic-years', c.getAcademicYears);
router.post('/academic-years', c.createAcademicYear);
router.put('/academic-years/:id/set-current', c.setCurrentAcademicYear);
router.get('/dashboard-stats', c.getDashboardStats);
router.get('/users', c.getUsers);
router.get('/notification-templates', c.getNotificationTemplates);
router.put('/notification-templates/:id', c.updateNotificationTemplate);

module.exports = router;
