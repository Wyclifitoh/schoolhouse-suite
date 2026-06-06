const repo = require("./inventory.repository");

const listItems = async (schoolId, params) =>
  repo.findAllItems(schoolId, params);
const getItem = async (id, schoolId) => repo.findItemById(id, schoolId);
const createItem = async (data) => repo.createItem(data);
const adjustStock = async (id, schoolId, quantityChange) =>
  repo.updateItemQuantity(id, schoolId, quantityChange);
const listCategories = async (schoolId) => repo.findAllCategories(schoolId);
const createCategory = async (data) => repo.createCategory(data);
const listTransactions = async (schoolId, params) =>
  repo.findTransactions(schoolId, params);
const createTransaction = async (data) => repo.createTransaction(data);

const listSuppliers = async (schoolId) => repo.findAllSuppliers(schoolId);
const createSupplier = async (data) => repo.createSupplier(data);

const listPOs = async (schoolId) => repo.findAllPOs(schoolId);

const createPO = async (schoolId, data) => {
  const totalAmount = data.items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0,
  );
  return repo.createPO(schoolId, { ...data, total_amount: totalAmount });
};

const getPOById = async (id, schoolId) => {
  return repo.findPOById(id, schoolId);
};

const getPOItems = async (poId) => {
  return repo.findPOItems(poId);
};

const updatePO = async (id, schoolId, data) => {
  const existing = await repo.findPOById(id, schoolId);
  if (existing.status === "delivered") {
    throw new Error(
      "Cannot edit a purchase order that has already been delivered.",
    );
  }
  return repo.editPO(id, schoolId, data);
};

const updatePOStatus = async (id, status) => {
  return repo.updatePOStatus(id, status);
};

module.exports = {
  listItems,
  getItem,
  createItem,
  adjustStock,
  listCategories,
  createCategory,
  listTransactions,
  createTransaction,
  listSuppliers,
  createSupplier,
  listPOs,
  createPO,
  getPOById,
  getPOItems,
  updatePO,
  updatePOStatus,
};
