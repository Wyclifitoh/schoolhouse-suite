const svc = require("./staff.service");
const { success, error, paginated } = require("../../utils/response");
const { parsePagination } = require("../../utils/pagination");

const schoolOf = (req) => req.schoolId || req.headers["x-school-id"];

const create = async (req, res) => {
  try {
    const result = await svc.createStaff({
      ...req.body,
      school_id: schoolOf(req),
    });
    return success(res, result, 201);
  } catch (err) {
    return error(res, err.message, 400);
  }
};

const list = async (req, res) => {
  try {
    const pagination = parsePagination(req.query);
    const { rows, total } = await svc.listStaff(schoolOf(req), pagination);
    return paginated(res, rows, total, pagination.page, pagination.limit);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const getById = async (req, res) => {
  try {
    const member = await svc.getStaffMember(req.params.id, schoolOf(req));
    if (!member) return error(res, "Staff not found", 404);
    return success(res, member);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const update = async (req, res) => {
  try {
    const member = await svc.updateStaff(
      req.params.id,
      schoolOf(req),
      req.body,
    );
    return success(res, member);
  } catch (err) {
    return error(res, err.message, 400);
  }
};

const remove = async (req, res) => {
  try {
    const result = await svc.removeStaff(req.params.id, schoolOf(req));
    return success(res, result);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ============== TEACHERS ==============

const listTeachers = async (req, res) => {
  try {
    const pagination = parsePagination(req.query);
    const { rows, total } = await svc.listTeachers(schoolOf(req), pagination);
    return paginated(res, rows, total, pagination.page, pagination.limit);
  } catch (err) {
    console.error("Error listing teachers:", err);
    return error(res, err.message, 500);
  }
};

module.exports = { create, list, getById, update, remove, listTeachers };
