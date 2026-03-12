const svc = require("./inventory.service");
const { success, error, paginated } = require("../../utils/response");
const { parsePagination } = require("../../utils/pagination");

const list = async (req, res) => {
  try {
    const pagination = parsePagination(req.query);
    const { rows, total } = await svc.listItems(req.schoolId, pagination);
    return paginated(res, rows, total, pagination.page, pagination.limit);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const getById = async (req, res) => {
  try {
    const item = await svc.getItem(req.params.id, req.schoolId);
    if (!item) return error(res, "Item not found", 404);
    return success(res, item);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const create = async (req, res) => {
  try {
    const item = await svc.createItem({
      ...req.body,
      school_id: req.schoolId,
    });
    return success(res, item, 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const listItems = async (req, res) => {
  try {
    const p = parsePagination(req.query);
    const { rows, total } = await svc.listItems(req.schoolId, {
      ...p,
      search: req.query.search,
      categoryId: req.query.category_id,
    });
    return paginated(res, rows, total, p.page, p.limit);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const getItem = async (req, res) => {
  try {
    const item = await svc.getItem(req.params.id, req.schoolId);
    if (!item) return error(res, "Item not found", 404);
    return success(res, item);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const createItem = async (req, res) => {
  try {
    return success(
      res,
      await svc.createItem({ ...req.body, school_id: req.schoolId }),
      201,
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const adjustStock = async (req, res) => {
  try {
    const item = await svc.adjustStock(
      req.params.id,
      req.schoolId,
      req.body.quantity_change,
    );
    if (!item) return error(res, "Item not found", 404);
    return success(res, item);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const listCategories = async (req, res) => {
  try {
    return success(res, await svc.listCategories(req.schoolId));
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const createCategory = async (req, res) => {
  try {
    return success(
      res,
      await svc.createCategory({ ...req.body, school_id: req.schoolId }),
      201,
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const listTransactions = async (req, res) => {
  try {
    const p = parsePagination(req.query);
    const rows = await svc.listTransactions(req.schoolId, {
      ...p,
      type: req.query.type,
    });
    return success(res, rows);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const createTransaction = async (req, res) => {
  try {
    return success(
      res,
      await svc.createTransaction({
        ...req.body,
        school_id: req.schoolId,
        recorded_by: req.user?.id,
      }),
      201,
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = {
  list,
  getById,
  create,
  listItems,
  getItem,
  createItem,
  adjustStock,
  listCategories,
  createCategory,
  listTransactions,
  createTransaction,
};
