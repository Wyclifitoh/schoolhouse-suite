const attendanceRepository = require('./attendance.repository');

const getClassAttendance = async (classId, schoolId, date) => {
  return attendanceRepository.findByClassAndDate(classId, schoolId, date);
};

const markAttendance = async (data) => {
  return attendanceRepository.upsert(data);
};

const bulkMarkAttendance = async (records) => {
  const results = [];
  for (const record of records) {
    const result = await attendanceRepository.upsert(record);
    results.push(result);
  }
  return results;
};

const getStudentAttendance = async (studentId, schoolId, pagination) => {
  return attendanceRepository.getStudentAttendance(studentId, schoolId, pagination);
};

module.exports = { getClassAttendance, markAttendance, bulkMarkAttendance, getStudentAttendance };
