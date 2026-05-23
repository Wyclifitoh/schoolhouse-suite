const repo = require("./designations.repository");

const createDesignation = async (data) => repo.create(data);

const listDesignations = async (schoolId, pagination) => 
  repo.findAll(schoolId, pagination);

const getDesignation = async (id, schoolId) => 
  repo.findById(id, schoolId);

const updateDesignation = async (id, schoolId, data) => 
  repo.update(id, schoolId, data);

module.exports = {
  createDesignation,
  listDesignations,
  getDesignation,
  updateDesignation
};