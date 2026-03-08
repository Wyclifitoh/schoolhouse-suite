const router = require('express').Router();
const authController = require('./auth.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/me', authenticate, authController.me);

module.exports = router;
