const router = require("express").Router();
const c = require("./homework.controller");

router.get("/", c.list);
router.post("/", c.create);
router.get("/:id", c.getById);
router.put("/:id", c.update);
router.delete("/:id", c.remove);

router.get("/:id/submissions", c.listSubmissions);
router.post("/:id/submissions", c.createSubmission);
router.put("/submissions/:submissionId", c.updateSubmission);

module.exports = router;