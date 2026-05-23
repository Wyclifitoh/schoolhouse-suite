const router = require("express").Router();
const c = require("./communication.controller");

router.post("/recipients/preview", c.previewRecipients);
router.post("/sms", c.sendSms);
router.post("/email", c.sendEmail);
router.get("/sms", c.listSms);
router.get("/email", c.listEmail);

module.exports = router;
