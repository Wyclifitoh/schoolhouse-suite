const parentsRepository = require('./parents.repository');

const listParents = async (schoolId, pagination) => {
  return parentsRepository.findAll(schoolId, pagination);
};

const getParent = async (id, schoolId) => {
  return parentsRepository.findById(id, schoolId);
};

const createParent = async (data) => {
  return parentsRepository.create(data);
};

module.exports = { listParents, getParent, createParent };
