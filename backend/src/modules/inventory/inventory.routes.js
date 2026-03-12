const router = require("express").Router();
const inventoryController = require("./inventory.controller");

router.get("/", inventoryController.list);
router.get("/:id", inventoryController.getById);
router.post("/", inventoryController.create);
router.patch("/:id/stock", inventoryController.adjustStock);

module.exports = router;
