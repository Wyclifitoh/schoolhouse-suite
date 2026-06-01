const svc = require("./homework.service");
const { success, error } = require("../../utils/response");

const list = async (req, res) => {
  try {
    return success(res, await svc.list(req.schoolId, req.query));
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const getById = async (req, res) => {
  try {
    const row = await svc.getById(req.params.id, req.schoolId);
    if (!row) return error(res, "Homework not found", 404);
    return success(res, row);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const create = async (req, res) => {
  try {
    const row = await svc.create({
      ...req.body,
      school_id: req.schoolId,
      assigned_by: req.user?.id || null,
    });
    return success(res, row, 201);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const update = async (req, res) => {
  try {
    return success(res, await svc.update(req.params.id, req.schoolId, req.body));
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const remove = async (req, res) => {
  try {
    return success(res, await svc.remove(req.params.id, req.schoolId));
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const listSubmissions = async (req, res) => {
  try {
    return success(res, await svc.listSubmissions(req.params.id, req.schoolId));
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const createSubmission = async (req, res) => {
  try {
    return success(res, await svc.createSubmission(req.params.id, req.schoolId, req.body), 201);
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

const updateSubmission = async (req, res) => {
  try {
    return success(
      res,
      await svc.updateSubmission(req.params.submissionId, req.schoolId, {
        ...req.body,
        evaluated_by: req.user?.id || null,
      }),
    );
  } catch (err) {
    return error(res, err.message, err.statusCode || 500);
  }
};

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  listSubmissions,
  createSubmission,
  updateSubmission,
};