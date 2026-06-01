const repo = require("./staff-attendance.repository");
const { success, error } = require("../../utils/response");

const LATE_AFTER = process.env.STAFF_LATE_AFTER || "08:15:00";

const listByDate = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    return success(res, await repo.findByDate(req.schoolId, date));
  } catch (err) { return error(res, err.message, 500); }
};

const bulkSave = async (req, res) => {
  try {
    const { date, records } = req.body;
    if (!date || !Array.isArray(records)) {
      return error(res, "date and records[] are required", 400);
    }
    const enriched = records.map((r) => ({
      ...r,
      school_id: req.schoolId,
      date,
    }));
    return success(res, await repo.bulkUpsert(enriched), 201);
  } catch (err) { return error(res, err.message, 500); }
};

const checkIn = async (req, res) => {
  try {
    const time = req.body.time || new Date().toTimeString().slice(0, 8);
    const data = await repo.checkIn({
      school_id: req.schoolId,
      staff_id: req.body.staff_id,
      time,
      late_after: LATE_AFTER,
    });
    return success(res, data, 201);
  } catch (err) { return error(res, err.message, 500); }
};

const checkOut = async (req, res) => {
  try {
    const time = req.body.time || new Date().toTimeString().slice(0, 8);
    const data = await repo.checkOut({
      school_id: req.schoolId,
      staff_id: req.body.staff_id,
      time,
    });
    return success(res, data);
  } catch (err) { return error(res, err.message, 500); }
};

const summary = async (req, res) => {
  try {
    const now = new Date();
    const year = Number(req.query.year) || now.getFullYear();
    const month = Number(req.query.month) || now.getMonth() + 1;
    return success(res, await repo.monthlySummary(req.schoolId, year, month));
  } catch (err) { return error(res, err.message, 500); }
};

module.exports = { listByDate, bulkSave, checkIn, checkOut, summary };
