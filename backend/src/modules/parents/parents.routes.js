const router = require('express').Router();
const c = require('./parents.controller');

router.get('/', c.list);
router.get('/:id', c.getById);
router.post('/', c.create);
router.put('/:id', c.update);

module.exports = router;
