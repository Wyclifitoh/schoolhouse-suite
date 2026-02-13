const studentsRepository = require('./students.repository');

const listStudents = async (schoolId, pagination) => {
  return studentsRepository.findAll(schoolId, pagination);
};

const getStudent = async (id, schoolId) => {
  return studentsRepository.findById(id, schoolId);
};

const createStudent = async (data) => {
  return studentsRepository.create(data);
};

const updateStudent = async (id, schoolId, data) => {
  return studentsRepository.update(id, schoolId, data);
};

module.exports = { listStudents, getStudent, createStudent, updateStudent };
