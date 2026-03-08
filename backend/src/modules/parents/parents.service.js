const parentsRepository = require('./parents.repository');
const { paginate } = require('../../utils/pagination');

const list = async (schoolId, queryParams) => {
  const { limit, offset, page } = paginate(queryParams);
  const { rows, total } = await parentsRepository.findAll(schoolId, { limit, offset, search: queryParams.search });
  return { data: rows, total, page, limit };
};

const getById = async (id, schoolId) => {
  const parent = await parentsRepository.findById(id, schoolId);
  if (!parent) throw Object.assign(new Error('Parent not found'), { statusCode: 404 });
  const children = await parentsRepository.findChildren(id);
  return { ...parent, children };
};

const create = async (schoolId, data) => {
  return parentsRepository.create({ ...data, school_id: schoolId });
};

const update = async (id, schoolId, data) => {
  return parentsRepository.update(id, schoolId, data);
};

module.exports = { list, getById, create, update };
