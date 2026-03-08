const router = require('express').Router();
const c = require('./schools.controller');

router.get('/my-schools', c.getMySchools);
router.get('/terms', c.getTerms);
router.get('/academic-years', c.getAcademicYears);
router.get('/dashboard-stats', c.getDashboardStats);

module.exports = router;
