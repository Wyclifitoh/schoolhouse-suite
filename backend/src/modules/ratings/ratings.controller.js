const repo = require("./ratings.repository");
const { success, error, paginated } = require("../../utils/response");
const { parsePagination } = require("../../utils/pagination");

const schoolOf = (req) => req.schoolId || req.headers["x-school-id"];

const create = async (req, res) => {
  try {
    const row = await repo.create({
      ...req.body,
      school_id: schoolOf(req),
      rated_by: req.user.id,
    });
    return success(res, row, 201);
  } catch (err) {
    return error(res, err.message, 400);
  }
};

const list = async (req, res) => {
  try {
    const pagination = parsePagination(req.query);
    const { rows, total } = await repo.listAll(schoolOf(req), pagination);
    return paginated(res, rows, total, pagination.page, pagination.limit);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const listForStaff = async (req, res) => {
  try {
    const rows = await repo.listForStaff(schoolOf(req), req.params.staffId);
    return success(res, rows);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const remove = async (req, res) => {
  try {
    return success(res, await repo.remove(req.params.id, schoolOf(req)));
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = { create, list, listForStaff, remove };
