const repo = require("./staff.repository");

const createStaff = (data) => repo.create(data);
const listStaff = (schoolId, pagination) => repo.findAll(schoolId, pagination);
const getStaffMember = (id, schoolId) => repo.findById(id, schoolId);
const updateStaff = (id, schoolId, data) => repo.update(id, schoolId, data);
const removeStaff = (id, schoolId) => repo.remove(id, schoolId);
const listTeachers = (schoolId, pagination) =>
  repo.findTeachers(schoolId, pagination);

module.exports = {
  createStaff,
  listStaff,
  getStaffMember,
  updateStaff,
  removeStaff,
  listTeachers,
};
