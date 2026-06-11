const repo = require("./extras.repository");
const { success, error, paginated } = require("../../utils/response");
const { parsePagination } = require("../../utils/pagination");

const schoolOf = (req) => req.schoolId || req.headers["x-school-id"];

/* SMS TEMPLATES */
const listTemplates = async (req, res) => {
  try {
    return success(res, await repo.listTemplates(schoolOf(req), req.query));
  } catch (e) {
    return error(res, e.message, 500);
  }
};
const createTemplate = async (req, res) => {
  try {
    if (!req.body?.name || !req.body?.body)
      return error(res, "name and body are required", 400);
    const row = await repo.createTemplate(
      schoolOf(req),
      req.body,
      req.user?.id,
    );
    return success(res, row, 201);
  } catch (e) {
    return error(res, e.message, 500);
  }
};
const updateTemplate = async (req, res) => {
  try {
    return success(
      res,
      await repo.updateTemplate(
        schoolOf(req),
        req.params.id,
        req.body,
        req.user?.id,
      ),
    );
  } catch (e) {
    return error(res, e.message, 500);
  }
};
const deleteTemplate = async (req, res) => {
  try {
    await repo.deleteTemplate(schoolOf(req), req.params.id);
    return success(res, { id: req.params.id });
  } catch (e) {
    return error(res, e.message, 500);
  }
};

/* NOTICES */
const listNotices = async (req, res) => {
  try {
    const pg = parsePagination(req.query);
    const { rows, total } = await repo.listNotices(schoolOf(req), {
      ...pg,
      status: req.query.status,
      audience: req.query.audience,
      search: req.query.search,
    });
    return paginated(res, rows, total, pg.page, pg.limit);
  } catch (e) {
    return error(res, e.message, 500);
  }
};
const getNotice = async (req, res) => {
  try {
    const n = await repo.getNotice(schoolOf(req), req.params.id);
    if (!n) return error(res, "Notice not found", 404);
    return success(res, n);
  } catch (e) {
    return error(res, e.message, 500);
  }
};
const createNotice = async (req, res) => {
  try {
    if (!req.body?.title || !req.body?.message)
      return error(res, "title and message are required", 400);
    const row = await repo.createNotice(schoolOf(req), req.body, req.user?.id);
    return success(res, row, 201);
  } catch (e) {
    return error(res, e.message, 500);
  }
};
const updateNotice = async (req, res) => {
  try {
    return success(
      res,
      await repo.updateNotice(
        schoolOf(req),
        req.params.id,
        req.body,
        req.user?.id,
      ),
    );
  } catch (e) {
    return error(res, e.message, 500);
  }
};
const deleteNotice = async (req, res) => {
  try {
    await repo.deleteNotice(schoolOf(req), req.params.id);
    return success(res, { id: req.params.id });
  } catch (e) {
    return error(res, e.message, 500);
  }
};

module.exports = {
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  listNotices,
  getNotice,
  createNotice,
  updateNotice,
  deleteNotice,
};
