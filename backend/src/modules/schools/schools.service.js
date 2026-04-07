const repo = require('./schools.repository');

const getSchoolsByUser = async (userId) => repo.findSchoolsByUser(userId);
const getSchool = async (id) => repo.findById(id);
const updateSchool = async (id, data) => repo.update(id, data);
const getTerms = async (schoolId) => repo.findTerms(schoolId);
const getAcademicYears = async (schoolId) => repo.findAcademicYears(schoolId);
const createAcademicYear = async (schoolId, data) => repo.createAcademicYear(schoolId, data);
const setCurrentAcademicYear = async (schoolId, id) => repo.setCurrentAcademicYear(schoolId, id);
const createTerm = async (schoolId, data) => repo.createTerm(schoolId, data);
const setCurrentTerm = async (schoolId, id) => repo.setCurrentTerm(schoolId, id);
const deleteTerm = async (schoolId, id) => repo.deleteTerm(schoolId, id);
const getDashboardStats = async (schoolId) => repo.getDashboardStats(schoolId);
const getUsers = async (schoolId) => repo.findUsers(schoolId);
const getNotificationTemplates = async (schoolId) => repo.findNotificationTemplates(schoolId);
const updateNotificationTemplate = async (id, data) => repo.updateNotificationTemplate(id, data);

module.exports = {
  getSchoolsByUser, getSchool, updateSchool, getTerms, getAcademicYears,
  createAcademicYear, setCurrentAcademicYear,
  createTerm, setCurrentTerm, deleteTerm,
  getDashboardStats, getUsers, getNotificationTemplates, updateNotificationTemplate,
};
