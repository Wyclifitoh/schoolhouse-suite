const studentsRepository = require("./students.repository");
const parentsRepository = require("../parents/parents.repository");
const { parsePagination } = require("../../utils/pagination");

const list = async (schoolId, queryParams) => {
  const { limit, offset, page } = parsePagination(queryParams);
  const { rows, total } = await studentsRepository.findAll(schoolId, {
    limit,
    offset,
    search: queryParams.search,
    status: queryParams.status,
    gradeId: queryParams.grade_id,
    streamIds: queryParams.stream_ids
      ? String(queryParams.stream_ids).split(",").filter(Boolean)
      : undefined,
  });
  return { data: rows, total, page, limit };
};

const getById = async (id, schoolId) => {
  const student = await studentsRepository.findById(id, schoolId);
  if (!student)
    throw Object.assign(new Error("Student not found"), { statusCode: 404 });
  return student;
};

const create = async (schoolId, data) => {
  // Auto-create BOTH parent records (father + mother) if info provided
  const parentCreations = [
    {
      name: data.father_name,
      phone: data.father_phone,
      email: data.father_email,
      occupation: data.father_occupation,
      id_number: data.father_id_number,
      type: "father",
    },
    {
      name: data.mother_name,
      phone: data.mother_phone,
      email: data.mother_email,
      occupation: data.mother_occupation,
      id_number: null,
      type: "mother",
    },
  ];

  for (const p of parentCreations) {
    if (p.name && p.phone) {
      try {
        const nameParts = p.name.trim().split(/\s+/);
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || nameParts[0] || "";
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
  const isPrimaryFather = data.primary_guardian !== "mother";
  const parentName = isPrimaryFather ? data.father_name : data.mother_name;
  const parentPhone = isPrimaryFather ? data.father_phone : data.mother_phone;
  const parentEmail = isPrimaryFather
    ? data.father_email || data.mother_email
    : data.mother_email || data.father_email;

  // Clean up data - remove extra fields before insert
  const studentData = { ...data, school_id: schoolId };
  studentData.parent_name = parentName || data.parent_name || null;
  studentData.parent_phone = parentPhone || data.parent_phone || null;

  // Remove non-column fields
  const extraFields = [
    "father_name",
    "father_phone",
    "father_email",
    "father_occupation",
    "father_id_number",
    "mother_name",
    "mother_phone",
    "mother_email",
    "mother_occupation",
    "primary_guardian",
    "parent_email",
    "emergency_name",
    "emergency_relation",
    "emergency_phone",
    "birth_cert",
    "prev_notes",
    "year_leaving",
    "tc_no",
    "previous_class",
    "allergies",
    "medical_info_text",
  ];
  for (const f of extraFields) delete studentData[f];

  return studentsRepository.create(studentData);
};

const bulkImport = async (schoolId, rows) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw Object.assign(new Error("students array is required"), {
      statusCode: 400,
    });
  }
  if (rows.length > 500) {
    throw Object.assign(new Error("Maximum 500 students per import"), {
      statusCode: 400,
    });
  }

  const students = rows.map((row) => {
    const fullName = String(row.full_name || row.name || "").trim();
    const parts = fullName.split(/\s+/).filter(Boolean);
    return {
      admission_number: row.admission_number || row.admission_no,
      first_name: row.first_name || parts[0] || "",
      middle_name:
        row.middle_name ||
        (parts.length > 2 ? parts.slice(1, -1).join(" ") : null),
      last_name:
        row.last_name ||
        (parts.length > 1 ? parts[parts.length - 1] : parts[0] || ""),
      gender: row.gender || null,
      date_of_birth: row.date_of_birth || row.dob || null,
      grade: row.grade || null,
      stream: row.stream || null,
      current_grade_id: row.current_grade_id || null,
      current_stream_id: row.current_stream_id || null,
      current_term_id: row.current_term_id || null,
      admission_date:
        row.admission_date || new Date().toISOString().slice(0, 10),
      parent_name: row.parent_name || null,
      parent_phone: row.parent_phone || null,
      status: row.status || "active",
    };
  });

  const invalid = students.findIndex(
    (s) => !s.admission_number || !s.first_name || !s.last_name,
  );
  if (invalid >= 0) {
    throw Object.assign(
      new Error(
        `Row ${invalid + 1}: admission_number and student name are required`,
      ),
      { statusCode: 400 },
    );
  }

  return studentsRepository.bulkCreate(schoolId, students);
};

const update = async (id, schoolId, data) => {
  const existing = await studentsRepository.findById(id, schoolId);
  if (!existing)
    throw Object.assign(new Error("Student not found"), { statusCode: 404 });
  return studentsRepository.update(id, schoolId, data);
};

const deactivate = async (id, schoolId) => {
  return studentsRepository.update(id, schoolId, { status: "inactive" });
};

const getSiblings = async (schoolId, parentPhone, excludeId) => {
  if (!parentPhone) return [];
  return studentsRepository.findByParentPhone(schoolId, parentPhone, excludeId);
};

module.exports = {
  list,
  getById,
  create,
  bulkImport,
  update,
  deactivate,
  getSiblings,
};
