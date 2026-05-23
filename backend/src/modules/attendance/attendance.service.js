const attendanceRepository = require("./attendance.repository");
const repo = require("./attendance.repository");

const getClassAttendance = (classId, schoolId, date, session) =>
  repo.findByClassAndDate(classId, schoolId, date, session);

const markAttendance = (data, session) => repo.upsert(data, session);

const bulkMarkAttendance = async (records, session) => {
  const out = [];
  for (const r of records) out.push(await repo.upsert(r, session));
  return out;
};

const getStudentAttendance = async (studentId, schoolId, pagination) => {
  return attendanceRepository.getStudentAttendance(
    studentId,
    schoolId,
    pagination,
  );
};

const getDailyRegister = async ({ schoolId, date, gradeId }) => {
  if (!schoolId || !date) {
    throw new Error(
      "Missing structural payload: schoolId and date are required.",
    );
  }
  return await attendanceRepository.getAttendanceRegister(
    schoolId,
    date,
    gradeId,
  );
};

const saveDailyAttendance = async ({ schoolId, date, records, markedBy }) => {
  if (!schoolId || !date || !Array.isArray(records) || records.length === 0) {
    throw new Error("Invalid payload processing structural bulk save.");
  }

  const formattedRecords = records.map((record) => ({
    school_id: schoolId,
    student_id: record.student_id,
    date: date,
    status: record.status ?? "present",
    remarks: record.remarks ?? null,
    marked_by: markedBy ?? null,
  }));

  const rowsInserted =
    await attendanceRepository.bulkSaveAttendance(formattedRecords);

  return {
    success: true,
    message: `Successfully registered attendance context for ${rowsInserted} students.`,
    count: rowsInserted,
  };
};

// const getStudentAttendance = (studentId, schoolId, pagination, session) =>
//   repo.getStudentAttendance(studentId, schoolId, pagination, session);

module.exports = {
  getClassAttendance,
  markAttendance,
  bulkMarkAttendance,
  getStudentAttendance,
  getDailyRegister,
  saveDailyAttendance,
};
