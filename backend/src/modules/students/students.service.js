const studentsRepository = require('./students.repository');
const parentsRepository = require('../parents/parents.repository');
const { parsePagination } = require('../../utils/pagination');

const list = async (schoolId, queryParams) => {
  const { limit, offset, page } = parsePagination(queryParams);
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
  // Auto-create parent record if parent info provided
  if (data.parent_name && data.parent_phone) {
    try {
      const nameParts = data.parent_name.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || nameParts[0] || '';
      
      // Check if parent with this phone already exists
      const existingParent = await parentsRepository.findByPhone(schoolId, data.parent_phone);
      
      if (!existingParent) {
        await parentsRepository.create({
          school_id: schoolId,
          first_name: firstName,
          last_name: lastName,
          phone: data.parent_phone,
          email: data.parent_email || null,
        });
      }
    } catch (err) {
      console.error('Auto-create parent failed:', err.message);
      // Don't block student creation if parent creation fails
    }
  }
  
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
