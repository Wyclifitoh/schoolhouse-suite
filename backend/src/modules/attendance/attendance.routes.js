const router = require("express").Router();
const c = require("./attendance.controller");

router.get("/", c.getRegister);
router.get("/summary", c.getSummary);
router.get("/class/:classId", c.getByClass);
router.get("/student/:studentId", c.getByStudent);
router.post("/", c.mark);
router.post("/bulk", c.submitAttendance);
router.delete("/:id", c.removeAttendance);

module.exports = router;
