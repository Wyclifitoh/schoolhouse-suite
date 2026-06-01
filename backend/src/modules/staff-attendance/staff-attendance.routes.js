const router = require("express").Router();
const c = require("./staff-attendance.controller");

router.get("/", c.listByDate);
router.post("/bulk", c.bulkSave);
router.post("/check-in", c.checkIn);
router.post("/check-out", c.checkOut);
router.get("/summary", c.summary);

module.exports = router;
