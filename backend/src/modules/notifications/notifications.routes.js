const router = require("express").Router();
const c = require("./notifications.controller");

router.get("/", c.list);
router.get("/unread-count", c.unreadCount);
router.post("/read-all", c.markAllRead);
router.post("/:id/read", c.markRead);
router.delete("/:id", c.remove);

module.exports = router;
