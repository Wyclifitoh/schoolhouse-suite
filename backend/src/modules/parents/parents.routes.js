const router = require('express').Router();
const parentsController = require('./parents.controller');

router.get('/', parentsController.list);
router.get('/:id', parentsController.getById);
router.post('/', parentsController.create);

module.exports = router;
