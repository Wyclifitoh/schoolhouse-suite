const router = require('express').Router();
const c = require('./students.controller');

router.get('/', c.list);
router.get('/siblings', c.getSiblings);
router.get('/:id', c.getById);
router.post('/', c.create);
router.put('/:id', c.update);
router.patch('/:id/deactivate', c.deactivate);

module.exports = router;
