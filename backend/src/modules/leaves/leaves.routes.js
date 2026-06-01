const router = require("express").Router();
const c = require("./leaves.controller");

router.get("/types", c.listTypes);
router.post("/types", c.createType);

router.get("/applications", c.listApplications);
router.post("/applications", c.apply);
router.put("/applications/:id/status", c.updateStatus);

router.get("/balances", c.listBalances);
router.post("/balances", c.setBalance);

module.exports = router;
