const repo = require('./inventory.repository');

const listItems = async (schoolId, params) => repo.findAllItems(schoolId, params);
const getItem = async (id, schoolId) => repo.findItemById(id, schoolId);
const createItem = async (data) => repo.createItem(data);
const adjustStock = async (id, schoolId, quantityChange) => repo.updateItemQuantity(id, schoolId, quantityChange);
const listCategories = async (schoolId) => repo.findAllCategories(schoolId);
const createCategory = async (data) => repo.createCategory(data);
const listTransactions = async (schoolId, params) => repo.findTransactions(schoolId, params);
const createTransaction = async (data) => repo.createTransaction(data);

module.exports = { listItems, getItem, createItem, adjustStock, listCategories, createCategory, listTransactions, createTransaction };
