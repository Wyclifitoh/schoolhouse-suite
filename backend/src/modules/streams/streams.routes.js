const router = require("express").Router();
const ctrl = require("./streams.controller");

// Independent streams API. Streams are identified by NAME within a school.
// One "logical stream" can be attached to multiple classes/grades. The
// underlying `streams` table still stores one row per (name, grade_id) pair so
// existing FKs (students.current_stream_id, timetable_entries.stream_id, etc.)
// keep working — but this API hides that detail.

router.get("/", ctrl.list);
router.post("/", ctrl.create);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);

// Attach / detach to a grade
router.post("/:id/grades/:gradeId", ctrl.attachGrade);
router.delete("/:id/grades/:gradeId", ctrl.detachGrade);

module.exports = router;
