const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { requireSchool } = require('../middlewares/tenant.middleware');

const paymentsController = require('../modules/payments/payments.controller');

// Public routes
const authRoutes = require('../modules/auth/auth.routes');
router.use('/auth', authRoutes);

// M-Pesa webhook (no auth)
router.post('/webhooks/mpesa/callback', paymentsController.mpesaCallback);

// Protected routes - require auth
router.use(authenticate);

// Schools route (no school header needed)
const schoolsController = require('../modules/schools/schools.controller');
router.get('/schools/my-schools', schoolsController.getMySchools);

// Protected routes that need school context
router.use(requireSchool);

router.use('/schools', require('../modules/schools/schools.routes'));
router.use('/users', require('../modules/users/users.routes'));
router.use('/students', require('../modules/students/students.routes'));
router.use('/parents', require('../modules/parents/parents.routes'));
router.use('/classes', require('../modules/classes/classes.routes'));
router.use('/finance', require('../modules/finance/finance.routes'));
router.use('/payments', require('../modules/payments/payments.routes'));
router.use('/attendance', require('../modules/attendance/attendance.routes'));
router.use('/inventory', require('../modules/inventory/inventory.routes'));
router.use('/reports', require('../modules/reports/reports.routes'));

// Staff org chart routes (departments + designations)
// Mount the same router under both paths so existing UI works.
const staffRoutes = require('../modules/staff/staff.routes');
router.use(staffRoutes);

module.exports = router;
