const router = require("express").Router();
const ctrl = require("./ratings.controller");

router.post("/", ctrl.create);
router.get("/", ctrl.list);
router.get("/staff/:staffId", ctrl.listForStaff);
router.delete("/:id", ctrl.remove);

module.exports = router;
