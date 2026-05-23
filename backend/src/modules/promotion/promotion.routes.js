const router = require('express').Router();
const repo = require('./promotion.repository');
const { success, error } = require('../../utils/response');
const { blockArchivedWrites } = require('../../middlewares/session.middleware');

router.post('/run', blockArchivedWrites, async (req, res) => {
  try {
    return success(res, await repo.runPromotion(req.schoolId, req.body, req.user?.id), 201);
  } catch (err) { return error(res, err.message, err.statusCode || 500); }
});

router.get('/enrollments', async (req, res) => {
  try {
    return success(res, await repo.listEnrollments(req.schoolId, {
      academicYearId: req.query.academic_year_id || req.session?.academicYearId,
      termId: req.query.term_id || req.session?.termId,
      gradeId: req.query.grade_id,
    }));
  } catch (err) { return error(res, err.message, 500); }
});

module.exports = router;
