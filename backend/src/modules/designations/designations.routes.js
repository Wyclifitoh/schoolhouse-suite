const router = require("express").Router();
const designationsController = require("./designations.controller");

router.post("/", designationsController.create);
router.get("/", designationsController.list);
router.get("/:id", designationsController.getById);
router.put("/:id", designationsController.update);

module.exports = router;
