const repo = require("./leaves.repository");

const listLeaveTypes = (schoolId) => repo.findAllTypes(schoolId);
const createType = (data) => repo.createType(data);

const listApplications = (schoolId, pagination) => 
  repo.findAllApplications(schoolId, pagination);

const applyForLeave = async (data) => {
  // Logic: Calculate total days if not provided
  const start = new Date(data.start_date);
  const end = new Date(data.end_date);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  return repo.createApplication({ ...data, total_days: diffDays });
};

const updateLeaveStatus = (id, data) => repo.updateApplicationStatus(id, data);

module.exports = { 
  listLeaveTypes, createType, listApplications, applyForLeave, updateLeaveStatus 
};