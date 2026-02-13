const router = require('express').Router();
const paymentsController = require('./payments.controller');

// Protected routes (applied via parent router)
router.get('/', paymentsController.list);
router.get('/:id', paymentsController.getById);
router.post('/', paymentsController.create);

module.exports = router;
