const inventoryRepository = require('./inventory.repository');

const listItems = async (schoolId, pagination) => {
  return inventoryRepository.findAll(schoolId, pagination);
};

const getItem = async (id, schoolId) => {
  return inventoryRepository.findById(id, schoolId);
};

const createItem = async (data) => {
  return inventoryRepository.create(data);
};

const adjustStock = async (id, schoolId, quantityChange) => {
  return inventoryRepository.updateQuantity(id, schoolId, quantityChange);
};

module.exports = { listItems, getItem, createItem, adjustStock };
