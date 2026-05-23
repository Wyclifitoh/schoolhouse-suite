const router = require("express").Router();
const departmentsController = require("./departments.controller");

router.post("/", departmentsController.create);
router.get("/", departmentsController.list);
router.get("/:id", departmentsController.getById);

module.exports = router;