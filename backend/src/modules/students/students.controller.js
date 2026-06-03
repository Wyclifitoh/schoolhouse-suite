const studentsService = require("./students.service");
const { success, error } = require("../../utils/response");

const list = async (req, res) => {
  try {
    const result = await studentsService.list(req.schoolId, req.query);
    return success(res, result);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const getById = async (req, res) => {
  try {
    const student = await studentsService.getById(req.params.id, req.schoolId);
    return success(res, student);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const create = async (req, res) => {
  try {
    const student = await studentsService.create(req.schoolId, req.body);
    return success(res, student, 201);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const bulkImport = async (req, res) => {
  try {
    const result = await studentsService.bulkImport(
      req.schoolId,
      req.body.students || req.body.rows || [],
    );
    return success(res, result, 201);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const update = async (req, res) => {
  try {
    const student = await studentsService.update(
      req.params.id,
      req.schoolId,
      req.body,
    );
    return success(res, student);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const deactivate = async (req, res) => {
  try {
    const student = await studentsService.deactivate(
      req.params.id,
      req.schoolId,
    );
    return success(res, student);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const getSiblings = async (req, res) => {
  try {
    const siblings = await studentsService.getSiblings(
      req.schoolId,
      req.query.parent_phone,
      req.query.exclude_id,
    );
    return success(res, siblings);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const summary = async (req, res) => {
  try {
    return success(res, await studentsService.getSummary(req.schoolId));
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const exportCsv = async (req, res) => {
  try {
    const csv = await studentsService.exportCsv(req.schoolId, req.query);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="students-${new Date().toISOString().slice(0, 10)}.csv"`,
    );
    return res.send(csv);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

module.exports = {
  list,
  getById,
  create,
  bulkImport,
  update,
  deactivate,
  getSiblings,
  summary,
  exportCsv,
};
