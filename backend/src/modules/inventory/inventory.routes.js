const router = require("express").Router();
const inventoryController = require("./inventory.controller");

router.get("/items", inventoryController.listItems);
router.post("/items", inventoryController.createItem);
router.get("/items/:id", inventoryController.getItem);
router.patch("/items/:id/stock", inventoryController.adjustStock);
router.get("/categories", inventoryController.listCategories);
router.post("/categories", inventoryController.createCategory);
router.get("/transactions", inventoryController.listTransactions);
router.post("/transactions", inventoryController.createTransaction);

router.get("/", inventoryController.listItems);
router.post("/", inventoryController.createItem);
router.get("/:id", inventoryController.getItem);
router.patch("/:id/stock", inventoryController.adjustStock);

module.exports = router;
