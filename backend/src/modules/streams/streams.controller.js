const repo = require("./streams.repository");
const { success, error } = require("../../utils/response");

exports.list = async (req, res) => {
  try {
    return success(res, await repo.listIndependent(req.schoolId));
  } catch (e) {
    return error(res, e.message, 500);
  }
};

exports.create = async (req, res) => {
  try {
    const { name, description, capacity } = req.body || {};
    if (!name) return error(res, "Stream name is required", 400);
    return success(
      res,
      await repo.createIndependent(req.schoolId, {
        name,
        description,
        capacity,
      }),
      201,
    );
  } catch (e) {
    return error(res, e.message, 500);
  }
};

exports.update = async (req, res) => {
  try {
    return success(
      res,
      await repo.updateIndependent(req.schoolId, req.params.id, req.body || {}),
    );
  } catch (e) {
    return error(res, e.message, 500);
  }
};

exports.remove = async (req, res) => {
  try {
    return success(
      res,
      await repo.deleteIndependent(req.schoolId, req.params.id),
    );
  } catch (e) {
    return error(
      res,
      e.message,
      /linked|reference/i.test(e.message) ? 409 : 500,
    );
  }
};

exports.attachGrade = async (req, res) => {
  try {
    return success(
      res,
      await repo.attachToGrade(req.schoolId, req.params.id, req.params.gradeId),
    );
  } catch (e) {
    return error(res, e.message, 500);
  }
};

exports.detachGrade = async (req, res) => {
  try {
    return success(
      res,
      await repo.detachFromGrade(
        req.schoolId,
        req.params.id,
        req.params.gradeId,
      ),
    );
  } catch (e) {
    return error(
      res,
      e.message,
      /linked|reference/i.test(e.message) ? 409 : 500,
    );
  }
};
