const repo = require('./reports.repository');

const getFinanceReport = (schoolId, filters) => repo.getFinanceReport(schoolId, filters);
const getPaymentsReport = (schoolId, filters) => repo.getPaymentsReport(schoolId, filters);
const getStudentReport = (schoolId, filters) => repo.getStudentReport(schoolId, filters);
const getAttendanceReport = (schoolId, filters) => repo.getAttendanceReport(schoolId, filters);
const getExamReport = (schoolId, filters) => repo.getExamReport(schoolId, filters);

module.exports = { getFinanceReport, getPaymentsReport, getStudentReport, getAttendanceReport, getExamReport };
