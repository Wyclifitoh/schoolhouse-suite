const router = require("express").Router();
const c = require("./communication.controller");
const x = require("./extras.controller");

router.post("/recipients/preview", c.previewRecipients);
router.post("/sms", c.sendSms);
router.post("/email", c.sendEmail);
router.get("/sms", c.listSms);
router.get("/email", c.listEmail);

// SMS templates (full CRUD)
router.get("/templates", x.listTemplates);
router.post("/templates", x.createTemplate);
router.put("/templates/:id", x.updateTemplate);
router.delete("/templates/:id", x.deleteTemplate);

// Noticeboard
router.get("/notices", x.listNotices);
router.get("/notices/:id", x.getNotice);
router.post("/notices", x.createNotice);
router.put("/notices/:id", x.updateNotice);
router.delete("/notices/:id", x.deleteNotice);

module.exports = router;
