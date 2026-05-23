const router = require("express").Router();
const c = require("./payments.controller");

router.get("/", c.list);
router.get("/unallocated", c.listUnallocated);
router.get("/allocations", c.allocations);
router.get("/:id", c.getById);
router.post("/", c.create);
router.post("/record", c.record);
router.post("/:id/reassign", c.reassign);
router.patch("/:id/void", c.voidPayment);

module.exports = router;
