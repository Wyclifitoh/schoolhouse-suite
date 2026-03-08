const studentsRepository = require('./students.repository');
const { paginate } = require('../../utils/pagination');

const list = async (schoolId, queryParams) => {
  const { limit, offset, page } = paginate(queryParams);
  const { rows, total } = await studentsRepository.findAll(schoolId, {
    limit, offset,
    search: queryParams.search,
    status: queryParams.status,
    gradeId: queryParams.grade_id,
  });
  return { data: rows, total, page, limit };
};

const getById = async (id, schoolId) => {
  const student = await studentsRepository.findById(id, schoolId);
  if (!student) throw Object.assign(new Error('Student not found'), { statusCode: 404 });
  return student;
};

const create = async (schoolId, data) => {
  return studentsRepository.create({ ...data, school_id: schoolId });
};

const update = async (id, schoolId, data) => {
  const existing = await studentsRepository.findById(id, schoolId);
  if (!existing) throw Object.assign(new Error('Student not found'), { statusCode: 404 });
  return studentsRepository.update(id, schoolId, data);
};

const deactivate = async (id, schoolId) => {
  return studentsRepository.update(id, schoolId, { status: 'inactive' });
};

const getSiblings = async (schoolId, parentPhone, excludeId) => {
  if (!parentPhone) return [];
  return studentsRepository.findByParentPhone(schoolId, parentPhone, excludeId);
};

module.exports = { list, getById, create, update, deactivate, getSiblings };
