const attendanceService = require("./attendance.service");
const { success, error, paginated } = require("../../utils/response");
const { parsePagination } = require("../../utils/pagination");

const getByClass = async (req, res) => {
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

const mark = async (req, res) => {
  try {
    const result = await attendanceService.markAttendance(
      {
        ...req.body,
        school_id: req.schoolId,
        marked_by: req.user.id,
      },
      req.session,
    );
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
    const results = await attendanceService.bulkMarkAttendance(
      enriched,
      req.session,
    );
    return success(res, results, 201);
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
      req.params.studentId,
      req.schoolId,
      pagination,
      req.session,
    );
    return paginated(res, rows, total, pagination.page, pagination.limit);
  } catch (err) {
    return error(res, err.message, 500);
  }
};

const getRegister = async (req, res, next) => {
  try {
    const schoolId = req.schoolId;
    const date = req.query.date || new Date().toISOString().split("T")[0];
    const gradeId = req.query.grade || "all";

    const data = await attendanceService.getDailyRegister({
      schoolId,
      date,
      gradeId,
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const submitAttendance = async (req, res, next) => {
  try {
    const schoolId = req.user.school_id;
    const markedBy = req.user.id;
    const { date, records } = req.body;

    if (!date || !records) {
      return res.status(400).json({
        success: false,
        message: "Date and student records array required.",
      });
    }

    const result = await attendanceService.saveDailyAttendance({
      schoolId,
      date,
      records,
      markedBy,
    });

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getByClass,
  mark,
  bulkMark,
  getByStudent,
  getRegister,
  submitAttendance,
};
