const svc = require('./classes.service');
const { success, error } = require('../../utils/response');

const listGrades = async (req, res) => {
  try { return success(res, await svc.listGrades(req.schoolId)); }
  catch (err) { return error(res, err.message, 500); }
};

const listStreams = async (req, res) => {
  try { return success(res, await svc.listStreams(req.schoolId, req.query.grade_id)); }
  catch (err) { return error(res, err.message, 500); }
};

const createGrade = async (req, res) => {
  try { return success(res, await svc.createGrade({ ...req.body, school_id: req.schoolId }), 201); }
  catch (err) { return error(res, err.message, 500); }
};

const createStream = async (req, res) => {
  try { return success(res, await svc.createStream({ ...req.body, school_id: req.schoolId }), 201); }
  catch (err) { return error(res, err.message, 500); }
};

const listSubjects = async (req, res) => {
  try { return success(res, await svc.listSubjects(req.schoolId)); }
  catch (err) { return error(res, err.message, 500); }
};

const createSubject = async (req, res) => {
  try { return success(res, await svc.createSubject({ ...req.body, school_id: req.schoolId }), 201); }
  catch (err) { return error(res, err.message, 500); }
};

const listStaff = async (req, res) => {
  try { return success(res, await svc.listStaff(req.schoolId)); }
  catch (err) { return error(res, err.message, 500); }
};

const listDepartments = async (req, res) => {
  try { return success(res, await svc.listDepartments(req.schoolId)); }
  catch (err) { return error(res, err.message, 500); }
};

const createDepartment = async (req, res) => {
  try { return success(res, await svc.createDepartment({ ...req.body, school_id: req.schoolId }), 201); }
  catch (err) { return error(res, err.message, 500); }
};

const listDesignations = async (req, res) => {
  try { return success(res, await svc.listDesignations(req.schoolId)); }
  catch (err) { return error(res, err.message, 500); }
};

module.exports = {
  listGrades, listStreams, createGrade, createStream,
  listSubjects, createSubject,
  listStaff, listDepartments, createDepartment, listDesignations
};
