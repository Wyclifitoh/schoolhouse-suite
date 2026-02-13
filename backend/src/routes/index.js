const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { requireSchool } = require('../middlewares/tenant.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { ROLES } = require('../config/constants');

const paymentsController = require('../modules/payments/payments.controller');

// Public routes
const authRoutes = require('../modules/auth/auth.routes');
router.use('/auth', authRoutes);

// M-Pesa webhook (no auth)
router.post('/webhooks/mpesa/callback', paymentsController.mpesaCallback);

// Protected routes - require auth + tenant
router.use(authenticate);
router.use(requireSchool);

router.use('/users', require('../modules/users/users.routes'));
router.use('/students', require('../modules/students/students.routes'));
router.use('/parents', require('../modules/parents/parents.routes'));
router.use('/classes', require('../modules/classes/classes.routes'));
router.use('/finance', require('../modules/finance/finance.routes'));
router.use('/payments', require('../modules/payments/payments.routes'));
router.use('/attendance', require('../modules/attendance/attendance.routes'));
router.use('/inventory', require('../modules/inventory/inventory.routes'));

module.exports = router;
