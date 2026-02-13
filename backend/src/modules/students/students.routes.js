const router = require('express').Router();
const studentsController = require('./students.controller');

router.get('/', studentsController.list);
router.get('/:id', studentsController.getById);
router.post('/', studentsController.create);
router.put('/:id', studentsController.update);

module.exports = router;
