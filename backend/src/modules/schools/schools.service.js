const schoolsRepository = require('./schools.repository');

const getSchoolsByUser = async (userId) => schoolsRepository.findSchoolsByUser(userId);
const getTerms = async (schoolId) => schoolsRepository.findTerms(schoolId);
const getAcademicYears = async (schoolId) => schoolsRepository.findAcademicYears(schoolId);
const getDashboardStats = async (schoolId) => schoolsRepository.getDashboardStats(schoolId);

module.exports = { getSchoolsByUser, getTerms, getAcademicYears, getDashboardStats };
