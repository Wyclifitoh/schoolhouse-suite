const inventoryService = require('./inventory.service');
const { success, error, paginated } = require('../../utils/response');
const { parsePagination } = require('../../utils/pagination');

const list = async (req, res) => {
  try {
    const pagination = parsePagination(req.query);
    const { rows, total } = await inventoryService.listItems(req.schoolId, pagination);
    return paginated(res, rows, total, pagination.page, pagination.limit);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const getById = async (req, res) => {
  try {
    const item = await inventoryService.getItem(req.params.id, req.schoolId);
    if (!item) return error(res, 'Item not found', 404);
    return success(res, item);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const create = async (req, res) => {
  try {
    const item = await inventoryService.createItem({ ...req.body, school_id: req.schoolId });
    return success(res, item, 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const adjustStock = async (req, res) => {
  try {
    const { quantity_change } = req.body;
    const item = await inventoryService.adjustStock(req.params.id, req.schoolId, quantity_change);
    if (!item) return error(res, 'Item not found', 404);
    return success(res, item);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = { list, getById, create, adjustStock };
