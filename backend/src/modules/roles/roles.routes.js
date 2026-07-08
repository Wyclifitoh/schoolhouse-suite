const router = require("express").Router();
const c = require("./roles.controller");

router.get("/", c.listRoles);
router.get("/me/permissions", c.getMyPermissions);
router.get("/permissions", c.listPermissions);
router.get("/:role/permissions", c.getRolePermissions);
router.put("/:role/permissions", c.setRolePermissions);
router.post("/custom", c.createCustomRole);
router.delete("/custom/:id", c.deleteCustomRole);

module.exports = router;
