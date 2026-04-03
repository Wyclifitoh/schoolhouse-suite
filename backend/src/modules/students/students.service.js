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
  // Auto-create BOTH parent records (father + mother) if info provided
  const parentCreations = [
    { name: data.father_name, phone: data.father_phone, email: data.father_email, occupation: data.father_occupation, id_number: data.father_id_number, type: 'father' },
    { name: data.mother_name, phone: data.mother_phone, email: data.mother_email, occupation: data.mother_occupation, id_number: null, type: 'mother' },
  ];

  for (const p of parentCreations) {
    if (p.name && p.phone) {
      try {
        const nameParts = p.name.trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || nameParts[0] || '';
        const existing = await parentsRepository.findByPhone(schoolId, p.phone);
        if (!existing) {
          await parentsRepository.create({
            school_id: schoolId,
            first_name: firstName,
            last_name: lastName,
            phone: p.phone,
            email: p.email || null,
            occupation: p.occupation || null,
            id_number: p.id_number || null,
          });
        }
      } catch (err) {
        console.error(`Auto-create ${p.type} parent failed:`, err.message);
      }
    }
  }

  // Set primary parent info based on guardian selection
  const isPrimaryFather = data.primary_guardian !== 'mother';
  const parentName = isPrimaryFather ? data.father_name : data.mother_name;
  const parentPhone = isPrimaryFather ? data.father_phone : data.mother_phone;
  const parentEmail = isPrimaryFather ? (data.father_email || data.mother_email) : (data.mother_email || data.father_email);

  // Clean up data - remove extra fields before insert
  const studentData = { ...data, school_id: schoolId };
  studentData.parent_name = parentName || data.parent_name || null;
  studentData.parent_phone = parentPhone || data.parent_phone || null;
  
  // Remove non-column fields
  const extraFields = ['father_name','father_phone','father_email','father_occupation','father_id_number',
    'mother_name','mother_phone','mother_email','mother_occupation','primary_guardian',
    'parent_email','emergency_name','emergency_relation','emergency_phone',
    'birth_cert','prev_notes','year_leaving','tc_no','previous_class','allergies','medical_info_text'];
  for (const f of extraFields) delete studentData[f];

  return studentsRepository.create(studentData);
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
