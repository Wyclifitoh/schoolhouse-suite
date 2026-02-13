const parentsService = require('./parents.service');
const { success, error, paginated } = require('../../utils/response');
const { parsePagination } = require('../../utils/pagination');

const list = async (req, res) => {
  try {
    const pagination = parsePagination(req.query);
    const { rows, total } = await parentsService.listParents(req.schoolId, pagination);
    return paginated(res, rows, total, pagination.page, pagination.limit);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const getById = async (req, res) => {
  try {
    const parent = await parentsService.getParent(req.params.id, req.schoolId);
    if (!parent) return error(res, 'Parent not found', 404);
    return success(res, parent);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const create = async (req, res) => {
  try {
    const parent = await parentsService.createParent({ ...req.body, school_id: req.schoolId });
    return success(res, parent, 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = { list, getById, create };
