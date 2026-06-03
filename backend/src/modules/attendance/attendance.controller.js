const attendanceService = require("./attendance.service");
const { success, error, paginated } = require("../../utils/response");
const { parsePagination } = require("../../utils/pagination");

const getByClassV1 = async (req, res) => {
  try {
    const { classId } = req.params;
    // const date = req.query.date || new Date().toISOString().split("T")[0];
    // const records = await attendanceService.getClassAttendance(
    //   classId,
    //   req.schoolId,
    //   date,
    // );
    const date = req.query.date || new Date().toISOString().split("T")[0];
    const records = await attendanceService.getClassAttendance(
      classId,
      req.schoolId,
      date,
      req.session,
    );
    return success(res, records);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const getByClass = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split("T")[0];
    const records = await attendanceService.getClassAttendance(
      req.params.classId,
      req.schoolId,
      date,
    );
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
      marked_by: req.user?.id,
    });
    return success(res, result, 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const getByStudent = async (req, res) => {
  try {
    const pagination = parsePagination(req.query);
    const { rows, total } = await attendanceService.getStudentAttendance(
      req.params.studentId,
      req.schoolId,
      pagination,
    );
    return paginated(res, rows, total, pagination.page, pagination.limit);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const getRegister = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split("T")[0];
    const gradeId = req.query.grade || "all";
    const data = await attendanceService.getDailyRegister({
      schoolId: req.schoolId,
      date,
      gradeId,
    });
    return success(res, data);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const submitAttendance = async (req, res) => {
  try {
    const schoolId = req.schoolId || req.user?.school_id;
    const markedBy = req.user?.id || null;
    const { date, records } = req.body;
    if (!schoolId) return error(res, "School context missing.", 400);
    if (!date || !Array.isArray(records)) {
      return error(res, "date and records[] are required.", 400);
    }
    const result = await attendanceService.saveDailyAttendance({
      schoolId,
      date,
      records,
      markedBy,
    });
    return res.status(201).json(result);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const getSummary = async (req, res) => {
  try {
    const now = new Date();
    const year = Number(req.query.year) || now.getFullYear();
    const month = Number(req.query.month) || now.getMonth() + 1;
    const gradeId = req.query.grade || "all";
    const data = await attendanceService.getMonthlySummary({
      schoolId: req.schoolId,
      year,
      month,
      gradeId,
    });
    return success(res, data);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const removeAttendance = async (req, res) => {
  try {
    await attendanceService.deleteAttendance(req.params.id, req.schoolId);
    return success(res, { deleted: true });
  } catch (err) {
    return error(res, err.message, 500);
  }
};

module.exports = {
  getByClass,
  mark,
  getByStudent,
  getRegister,
  submitAttendance,
  getSummary,
  removeAttendance,
};
