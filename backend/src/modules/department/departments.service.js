const repo = require("./departments.repository");

const createDepartment = async (data) => {
  // Logic/Validation can go here
  return repo.create(data);
};

const listDepartments = async (schoolId, pagination) => {
  return repo.findAll(schoolId, pagination);
};

const getDepartment = async (id, schoolId) => {
  return repo.findById(id, schoolId);
};

module.exports = {
  createDepartment,
  listDepartments,
  getDepartment
};