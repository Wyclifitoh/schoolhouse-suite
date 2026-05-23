const svc = require("./departments.service");
const { success, error, paginated } = require("../../utils/response");
const { parsePagination } = require("../../utils/pagination");

const create = async (req, res) => {
  try {
    // Note: We use req.schoolId if your middleware populates it, 
    // otherwise we fallback to the body as per your request.
    const schoolId = req.schoolId || req.body.school_id;
    const departmentData = {
      ...req.body,
      school_id: schoolId
    };
    
    const result = await svc.createDepartment(departmentData);
    return success(res, result, 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const list = async (req, res) => {
  try {
    const pagination = parsePagination(req.query);
    const { rows, total } = await svc.listDepartments(req.schoolId, pagination);
    return paginated(res, rows, total, pagination.page, pagination.limit);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const getById = async (req, res) => {
  try {
    const dept = await svc.getDepartment(req.params.id, req.schoolId);
    if (!dept) return error(res, "Department not found", 404);
    return success(res, dept);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = {
  create,
  list,
  getById
};