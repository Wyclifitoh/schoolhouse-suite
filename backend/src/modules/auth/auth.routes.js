const router = require('express').Router();
const authController = require('./auth.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { authorize } = require('../../middlewares/role.middleware');
const { ROLES } = require('../../config/constants');

router.post('/login', authController.login);
router.post(
  '/register',
  authenticate,
  authorize(ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN),
  authController.register
);

module.exports = router;
