const router = require("express").Router();
const leavesController = require("./leaves.controller");

router.get("/types", leavesController.listTypes);
router.post("/types", leavesController.createType);

router.get("/applications", leavesController.listApplications);
router.post("/applications", leavesController.apply);
router.put("/applications/:id/status", leavesController.updateStatus);

module.exports = router;