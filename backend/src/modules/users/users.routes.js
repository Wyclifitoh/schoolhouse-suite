const router = require('express').Router();
const usersController = require('./users.controller');

router.get('/', usersController.list);
router.get('/:id', usersController.getById);

module.exports = router;
