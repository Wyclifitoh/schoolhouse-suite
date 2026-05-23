const svc = require("./staff.service");
const { success, error, paginated } = require("../../utils/response");
const { parsePagination } = require("../../utils/pagination");

const create = async (req, res) => {
  try {
    const schoolId = req.schoolId || req.headers["x-school-id"];
    const result = await svc.createStaff({ ...req.body, school_id: schoolId });
    return success(res, result, 201);
  } catch (err) { return error(res, err.message, 500); }
};

const list = async (req, res) => {
  try {
    const schoolId = req.schoolId || req.headers["x-school-id"];
    const pagination = parsePagination(req.query);
    const { rows, total } = await svc.listStaff(schoolId, pagination);
    return paginated(res, rows, total, pagination.page, pagination.limit);
  } catch (err) { return error(res, err.message, 500); }
};

const getById = async (req, res) => {
  try {
    const schoolId = req.schoolId || req.headers["x-school-id"];
    const member = await svc.getStaffMember(req.params.id, schoolId);
    if (!member) return error(res, "Staff not found", 404);
    return success(res, member);
  } catch (err) { return error(res, err.message, 500); }
};

module.exports = { create, list, getById };