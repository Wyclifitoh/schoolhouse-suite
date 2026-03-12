const router = require("express").Router();
const classesController = require("./classes.controller");

router.get("/", classesController.list);
router.get("/:id", classesController.getById);
router.post("/", classesController.create);

module.exports = router;
