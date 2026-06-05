const repo = require("./attendance.repository");

const getClassAttendance = (classId, schoolId, date, session) =>
  repo.findByClassAndDate(classId, schoolId, date, session);

const markAttendance = (data, session) => repo.upsert(data, session);

const bulkMarkAttendance = async (records, session) => {
  const out = [];
  for (const r of records) out.push(await repo.upsert(r, session));
  return out;
};

const getStudentAttendance = (studentId, schoolId, pagination, session) =>
  repo.getStudentAttendance(studentId, schoolId, { ...pagination, session });

const getDailyRegister = async ({ schoolId, date, gradeId, session }) => {
  if (!schoolId || !date) {
    throw new Error("schoolId and date are required.");
  }
  return repo.getAttendanceRegister(schoolId, date, gradeId, session);
};

const saveDailyAttendance = async ({
  schoolId,
  date,
  records,
  markedBy,
  session,
}) => {
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
  const affected = await repo.bulkSaveAttendance(formatted, session);
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
