const svc = require("./leaves.service");
const { success, error, paginated } = require("../../utils/response");
const { parsePagination } = require("../../utils/pagination");

const listTypes = async (req, res) => {
  try {
    return success(res, await svc.listLeaveTypes(req.schoolId));
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const createType = async (req, res) => {
  try {
    return success(
      res,
      await svc.createType({ ...req.body, school_id: req.schoolId }),
      201,
    );
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const listApplications = async (req, res) => {
  try {
    const pagination = parsePagination(req.query);
    pagination.status = req.query.status;
    const { rows, total } = await svc.listApplications(
      req.schoolId,
      pagination,
    );
    return paginated(res, rows, total, pagination.page, pagination.limit);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const apply = async (req, res) => {
  try {
    const data = await svc.applyForLeave({
      ...req.body,
      school_id: req.schoolId,
    });
    return success(res, data, 201);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const updateStatus = async (req, res) => {
  try {
    const { status, rejection_reason } = req.body;
    const result = await svc.updateLeaveStatus(req.params.id, {
      status,
      rejection_reason: rejection_reason || null,
      approved_by: req.user?.id || null,
    });
    return success(res, result);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const listBalances = async (req, res) => {
  try {
    const data = await svc.listBalances(req.schoolId, {
      staff_id: req.query.staff_id,
      year: req.query.year || new Date().getFullYear(),
    });
    return success(res, data);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

const setBalance = async (req, res) => {
  try {
    const data = await svc.setBalance({ ...req.body, school_id: req.schoolId });
    return success(res, data, 201);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

module.exports = {
  listTypes,
  createType,
  listApplications,
  apply,
  updateStatus,
  listBalances,
  setBalance,
};
