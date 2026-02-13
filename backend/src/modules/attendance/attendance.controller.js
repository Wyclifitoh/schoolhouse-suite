const attendanceService = require('./attendance.service');
const { success, error, paginated } = require('../../utils/response');
const { parsePagination } = require('../../utils/pagination');

const getByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const records = await attendanceService.getClassAttendance(classId, req.schoolId, date);
    return success(res, records);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const mark = async (req, res) => {
  try {
    const result = await attendanceService.markAttendance({
      ...req.body,
      school_id: req.schoolId,
      marked_by: req.user.id,
    });
    return success(res, result, 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const bulkMark = async (req, res) => {
  try {
    const { records } = req.body;
    const enriched = records.map((r) => ({
      ...r,
      school_id: req.schoolId,
      marked_by: req.user.id,
    }));
    const results = await attendanceService.bulkMarkAttendance(enriched);
    return success(res, results, 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const getByStudent = async (req, res) => {
  try {
    const pagination = parsePagination(req.query);
    const { rows, total } = await attendanceService.getStudentAttendance(req.params.studentId, req.schoolId, pagination);
    return paginated(res, rows, total, pagination.page, pagination.limit);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = { getByClass, mark, bulkMark, getByStudent };
