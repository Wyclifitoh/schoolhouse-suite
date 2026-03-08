const schoolsService = require('./schools.service');
const { success, error } = require('../../utils/response');

const getMySchools = async (req, res) => {
  try { return success(res, await schoolsService.getSchoolsByUser(req.user.id)); }
  catch (err) { return error(res, err.message, 500); }
};

const getTerms = async (req, res) => {
  try { return success(res, await schoolsService.getTerms(req.schoolId)); }
  catch (err) { return error(res, err.message, 500); }
};

const getAcademicYears = async (req, res) => {
  try { return success(res, await schoolsService.getAcademicYears(req.schoolId)); }
  catch (err) { return error(res, err.message, 500); }
};

const getDashboardStats = async (req, res) => {
  try { return success(res, await schoolsService.getDashboardStats(req.schoolId)); }
  catch (err) { return error(res, err.message, 500); }
};

module.exports = { getMySchools, getTerms, getAcademicYears, getDashboardStats };
