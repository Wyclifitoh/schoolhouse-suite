const repo = require("./staff.repository");

const createStaff = async (data) => repo.create(data);
const listStaff = async (schoolId, pagination) => repo.findAll(schoolId, pagination);
const getStaffMember = async (id, schoolId) => repo.findById(id, schoolId);

module.exports = { createStaff, listStaff, getStaffMember };