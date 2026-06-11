const router = require("express").Router();
const c = require("./students.controller");

router.get("/", c.list);
router.get("/siblings", c.getSiblings);
router.get("/summary", c.summary);
router.get("/export", c.exportCsv);
router.post("/bulk-import", c.bulkImport);
router.get("/next-admission-number", c.getNextAdmissionNumber);
router.get("/:id", c.getById);
router.post("/", c.create);
router.put("/:id", c.update);
router.patch("/:id/deactivate", c.deactivate);

module.exports = router;
