const router = require("express").Router();
const inventoryController = require("./inventory.controller");

router.get("/items", inventoryController.listItems);
router.post("/items", inventoryController.createItem);
router.get("/items/:id", inventoryController.getItem);
router.put("/items/:id", inventoryController.updateItem);
router.delete("/items/:id", inventoryController.deleteItem);
router.patch("/items/:id/stock", inventoryController.adjustStock);
router.get("/categories", inventoryController.listCategories);
router.post("/categories", inventoryController.createCategory);
router.get("/transactions", inventoryController.listTransactions);
router.post("/transactions", inventoryController.createTransaction);

router.get("/suppliers", inventoryController.listSuppliers);
router.post("/suppliers", inventoryController.createSupplier);
router.put("/suppliers/:id", inventoryController.updateSupplier);
router.delete("/suppliers/:id", inventoryController.deleteSupplier);

// Purchase Orders
router.get("/purchase-orders", inventoryController.listPOs);
router.post("/purchase-orders", inventoryController.createPO);
router.put("/purchase-orders/:id/status", inventoryController.updatePOStatus);

router.get("/purchase-orders/:id", inventoryController.getPOById);
router.get("/purchase-orders/:id/items", inventoryController.getPOItems);
router.put("/purchase-orders/:id", inventoryController.updatePO);

router.get("/", inventoryController.listItems);
router.post("/", inventoryController.createItem);
router.get("/:id", inventoryController.getItem);
router.patch("/:id/stock", inventoryController.adjustStock);

module.exports = router;
