const svc = require("./designations.service");
const { success, error, paginated } = require("../../utils/response");
const { parsePagination } = require("../../utils/pagination");

const create = async (req, res) => {
  try {
    const schoolId = req.schoolId || req.headers["x-school-id"];
    const data = { ...req.body, school_id: schoolId };
    const result = await svc.createDesignation(data);
    return success(res, result, 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const list = async (req, res) => {
  try {
    const schoolId = req.schoolId || req.headers["x-school-id"];
    const pagination = parsePagination(req.query);
    const { rows, total } = await svc.listDesignations(schoolId, pagination);
    return paginated(res, rows, total, pagination.page, pagination.limit);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const getById = async (req, res) => {
  try {
    const schoolId = req.schoolId || req.headers["x-school-id"];
    const item = await svc.getDesignation(req.params.id, schoolId);
    if (!item) return error(res, "Designation not found", 404);
    return success(res, item);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const update = async (req, res) => {
  try {
    const schoolId = req.schoolId || req.headers["x-school-id"];
    const result = await svc.updateDesignation(req.params.id, schoolId, req.body);
    return success(res, result);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = { create, list, getById, update };