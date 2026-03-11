const repo = require('./classes.repository');

const listGrades = async (schoolId) => repo.findAllGrades(schoolId);
const listStreams = async (schoolId, gradeId) => repo.findAllStreams(schoolId, gradeId);
const createGrade = async (data) => repo.createGrade(data);
const createStream = async (data) => repo.createStream(data);
const listSubjects = async (schoolId) => repo.findAllSubjects(schoolId);
const createSubject = async (data) => repo.createSubject(data);
const listStaff = async (schoolId) => repo.findAllStaff(schoolId);
const listDepartments = async (schoolId) => repo.findAllDepartments(schoolId);
const createDepartment = async (data) => repo.createDepartment(data);
const listDesignations = async (schoolId) => repo.findAllDesignations(schoolId);

module.exports = {
  listGrades, listStreams, createGrade, createStream,
  listSubjects, createSubject,
  listStaff, listDepartments, createDepartment, listDesignations
};
