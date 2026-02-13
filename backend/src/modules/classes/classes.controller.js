const classesService = require('./classes.service');
const { success, error, paginated } = require('../../utils/response');
const { parsePagination } = require('../../utils/pagination');

const list = async (req, res) => {
  try {
    const pagination = parsePagination(req.query);
    const { rows, total } = await classesService.listClasses(req.schoolId, pagination);
    return paginated(res, rows, total, pagination.page, pagination.limit);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const getById = async (req, res) => {
  try {
    const cls = await classesService.getClass(req.params.id, req.schoolId);
    if (!cls) return error(res, 'Class not found', 404);
    return success(res, cls);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const create = async (req, res) => {
  try {
    const cls = await classesService.createClass({ ...req.body, school_id: req.schoolId });
    return success(res, cls, 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = { list, getById, create };
