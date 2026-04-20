const repo = require("./classes.repository");

const listClasses = async (schoolId, pagination) =>
  repo.findAllClasses(schoolId, pagination);
const getClass = async (id, schoolId) => repo.findClassById(id, schoolId);
const createClass = async (data) => repo.createClass(data);
const listGrades = async (schoolId) => repo.findAllGrades(schoolId);
const listStreams = async (schoolId, gradeId) =>
  repo.findAllStreams(schoolId, gradeId);
const createGrade = async (data) => repo.createGrade(data);
const createStream = async (data) => repo.createStream(data);
const updateStream = async (id, schoolId, data) =>
  repo.updateStream(id, schoolId, data);
const deleteStream = async (id, schoolId) => repo.deleteStream(id, schoolId);
const deleteGrade = async (id, schoolId) => repo.deleteGrade(id, schoolId);
const listSubjects = async (schoolId) => repo.findAllSubjects(schoolId);
const createSubject = async (data) => repo.createSubject(data);
const updateSubject = async (id, schoolId, data) => repo.updateSubject(id, schoolId, data);
const deleteSubject = async (id, schoolId) => repo.deleteSubject(id, schoolId);
const listStaff = async (schoolId) => repo.findAllStaff(schoolId);
const listDepartments = async (schoolId) => repo.findAllDepartments(schoolId);
const createDepartment = async (data) => repo.createDepartment(data);
const listDesignations = async (schoolId) => repo.findAllDesignations(schoolId);

module.exports = {
  listClasses,
  getClass,
  createClass,
  listGrades,
  listStreams,
  createGrade,
  createStream,
  updateStream,
  deleteStream,
  deleteGrade,
  listSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  listStaff,
  listDepartments,
  createDepartment,
  listDesignations,
};
