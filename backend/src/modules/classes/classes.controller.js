const svc = require("./classes.service");
const { success, error, paginated } = require("../../utils/response");
const { parsePagination } = require("../../utils/pagination");

const list = async (req, res) => {
  try {
    const pagination = parsePagination(req.query);
    const { rows, total } = await svc.listClasses(req.schoolId, pagination);
    return paginated(res, rows, total, pagination.page, pagination.limit);
  } catch (err) { return error(res, err.message, 500); }
};

const getById = async (req, res) => {
  try {
    const cls = await svc.getClass(req.params.id, req.schoolId);
    if (!cls) return error(res, "Class not found", 404);
    return success(res, cls);
  } catch (err) { return error(res, err.message, 500); }
};

const create = async (req, res) => {
  try { return success(res, await svc.createClass({ ...req.body, school_id: req.schoolId }), 201); }
  catch (err) { return error(res, err.message, 500); }
};

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
  catch (err) { return error(res, err.message, /required/i.test(err.message) ? 400 : 500); }
};

const updateStream = async (req, res) => {
  try { return success(res, await svc.updateStream(req.params.id, req.schoolId, req.body)); }
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
  list, getById, create, listGrades, listStreams, createGrade, createStream, updateStream,
  listSubjects, createSubject, listStaff, listDepartments, createDepartment, listDesignations,
};
