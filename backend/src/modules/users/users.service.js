const usersRepository = require('./users.repository');

const listUsers = async (schoolId, pagination) => {
  return usersRepository.findAll(schoolId, pagination);
};

const getUser = async (id, schoolId) => {
  return usersRepository.findById(id, schoolId);
};

module.exports = { listUsers, getUser };
