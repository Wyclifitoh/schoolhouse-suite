const repo = require("./notifications.repository");
const { success, error, paginated } = require("../../utils/response");
const { parsePagination } = require("../../utils/pagination");

const schoolOf = (req) => req.schoolId || req.headers["x-school-id"];
const rolesOf = (req) =>
  (req.user?.roles || [])
    .filter((r) => !r.school_id || r.school_id === schoolOf(req))
    .map((r) => r.role);

const list = async (req, res) => {
  try {
    const pg = parsePagination(req.query);
    const { rows, total } = await repo.list(schoolOf(req), req.user.id, rolesOf(req), {
      limit: pg.limit,
      offset: pg.offset,
      unreadOnly: req.query.unread === "true",
    });
    return paginated(res, rows, total, pg.page, pg.limit);
  } catch (e) { return error(res, e.message, 500); }
};

const unreadCount = async (req, res) => {
  try {
    const count = await repo.unreadCount(schoolOf(req), req.user.id, rolesOf(req));
    return success(res, { count });
  } catch (e) { return error(res, e.message, 500); }
};

const markRead = async (req, res) => {
  try { return success(res, await repo.markRead(req.user.id, req.params.id)); }
  catch (e) { return error(res, e.message, 500); }
};

const markAllRead = async (req, res) => {
  try { return success(res, await repo.markAllRead(schoolOf(req), req.user.id, rolesOf(req))); }
  catch (e) { return error(res, e.message, 500); }
};

const remove = async (req, res) => {
  try { await repo.remove(req.params.id, schoolOf(req)); return success(res, { id: req.params.id }); }
  catch (e) { return error(res, e.message, 500); }
};

module.exports = { list, unreadCount, markRead, markAllRead, remove };
