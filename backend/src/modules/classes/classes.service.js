const classesRepository = require('./classes.repository');

const listClasses = async (schoolId, pagination) => {
  return classesRepository.findAll(schoolId, pagination);
};

const getClass = async (id, schoolId) => {
  return classesRepository.findById(id, schoolId);
};

const createClass = async (data) => {
  return classesRepository.create(data);
};

module.exports = { listClasses, getClass, createClass };
