const repo = require('./schools.repository');

const getSchoolsByUser = async (userId) => repo.findSchoolsByUser(userId);
const getSchool = async (id) => repo.findById(id);
const updateSchool = async (id, data) => repo.update(id, data);
const getTerms = async (schoolId) => repo.findTerms(schoolId);
const getAcademicYears = async (schoolId) => repo.findAcademicYears(schoolId);
const getDashboardStats = async (schoolId) => repo.getDashboardStats(schoolId);
const getUsers = async (schoolId) => repo.findUsers(schoolId);
const getNotificationTemplates = async (schoolId) => repo.findNotificationTemplates(schoolId);
const updateNotificationTemplate = async (id, data) => repo.updateNotificationTemplate(id, data);

module.exports = { getSchoolsByUser, getSchool, updateSchool, getTerms, getAcademicYears, getDashboardStats, getUsers, getNotificationTemplates, updateNotificationTemplate };
