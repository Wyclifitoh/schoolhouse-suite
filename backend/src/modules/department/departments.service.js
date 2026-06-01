const repo = require("./departments.repository");

const createDepartment = (data) => repo.create(data);
const listDepartments = (schoolId, pagination) =>
  repo.findAll(schoolId, pagination);
const getDepartment = (id, schoolId) => repo.findById(id, schoolId);
const updateDepartment = (id, schoolId, data) =>
  repo.update(id, schoolId, data);
const deleteDepartment = (id, schoolId) => repo.remove(id, schoolId);

module.exports = {
  createDepartment,
  listDepartments,
  getDepartment,
  updateDepartment,
  deleteDepartment,
};
