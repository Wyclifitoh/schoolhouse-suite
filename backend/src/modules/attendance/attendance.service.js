const repo = require("./attendance.repository");

const getClassAttendance = (classId, schoolId, date) =>
  repo.findByClassAndDate(classId, schoolId, date);

const markAttendance = (data) => repo.upsert(data);

const bulkMarkAttendance = async (records) => {
  const out = [];
  for (const r of records) out.push(await repo.upsert(r));
  return out;
};

const getStudentAttendance = (studentId, schoolId, pagination) =>
  repo.getStudentAttendance(studentId, schoolId, pagination);

const getDailyRegister = async ({ schoolId, date, gradeId }) => {
  if (!schoolId || !date) {
    throw new Error("schoolId and date are required.");
  }
  return repo.getAttendanceRegister(schoolId, date, gradeId);
};

const saveDailyAttendance = async ({ schoolId, date, records, markedBy }) => {
  if (!schoolId || !date || !Array.isArray(records)) {
    throw new Error("Invalid payload — schoolId, date and records[] required.");
  }
  if (records.length === 0) {
    return { success: true, message: "No records to save.", count: 0 };
  }
  const formatted = records.map((r) => ({
    school_id: schoolId,
    student_id: r.student_id,
    date,
    status: r.status || "present",
    remarks: r.remarks ?? null,
    marked_by: markedBy,
  }));
  const affected = await repo.bulkSaveAttendance(formatted);
  return {
    success: true,
    message: `Saved attendance for ${records.length} student(s).`,
    count: affected,
  };
};

const getMonthlySummary = ({ schoolId, year, month, gradeId }) =>
  repo.getMonthlySummary(schoolId, year, month, gradeId);

const deleteAttendance = (id, schoolId) => repo.deleteAttendance(id, schoolId);

module.exports = {
  getClassAttendance,
  markAttendance,
  bulkMarkAttendance,
  getStudentAttendance,
  getDailyRegister,
  saveDailyAttendance,
  getMonthlySummary,
  deleteAttendance,
};
