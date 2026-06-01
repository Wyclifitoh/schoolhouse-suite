const router = require("express").Router();
const c = require("./timetable.controller");

// Period setup
router.get("/periods", c.listPeriods);
router.post("/periods", c.createPeriod);
router.put("/periods/:id", c.updatePeriod);
router.delete("/periods/:id", c.deletePeriod);

// Lesson requirements (per grade × subject)
router.get("/requirements", c.listRequirements);
router.post("/requirements", c.upsertRequirement);
router.post("/requirements/bulk", c.bulkUpsertRequirements);
router.delete("/requirements/:id", c.deleteRequirement);

// Entries (alias of /classes/timetable with extra filters)
router.get("/entries", c.listEntries);
router.post("/entries/clear", c.clearEntries);
router.get("/clashes", c.detectClashes);

// Auto-generate
router.post("/generate", c.generate);

module.exports = router;
