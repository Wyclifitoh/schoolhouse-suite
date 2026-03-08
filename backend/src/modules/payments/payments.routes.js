const router = require('express').Router();
const c = require('./payments.controller');

router.get('/', c.list);
router.get('/:id', c.getById);
router.post('/', c.create);
router.patch('/:id/void', c.voidPayment);

module.exports = router;
