const parentsService = require('./parents.service');
const { success, error } = require('../../utils/response');

const list = async (req, res) => {
  try {
    const result = await parentsService.list(req.schoolId, req.query);
    return success(res, result);
  } catch (err) { return error(res, err.message, err.statusCode || 500); }
};

const getById = async (req, res) => {
  try {
    const parent = await parentsService.getById(req.params.id, req.schoolId);
    return success(res, parent);
  } catch (err) { return error(res, err.message, err.statusCode || 500); }
};

const create = async (req, res) => {
  try {
    const parent = await parentsService.create(req.schoolId, req.body);
    return success(res, parent, 201);
  } catch (err) { return error(res, err.message, err.statusCode || 500); }
};

const update = async (req, res) => {
  try {
    const parent = await parentsService.update(req.params.id, req.schoolId, req.body);
    return success(res, parent);
  } catch (err) { return error(res, err.message, err.statusCode || 500); }
};

const lookup = async (req, res) => {
  try {
    const repo = require('./parents.repository');
    const parent = await repo.findByPhone(req.schoolId, req.query.phone);
    if (!parent) return success(res, null);
    return success(res, parent);
  } catch (err) { return error(res, err.message, err.statusCode || 500); }
};

module.exports = { list, getById, create, update, lookup };
