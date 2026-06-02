const repo = require("./staff.repository");

const createStaff = (data) => repo.create(data);
const listStaff = (schoolId, pagination) => repo.findAll(schoolId, pagination);
const getStaffMember = (id, schoolId) => repo.findById(id, schoolId);
const updateStaff = (id, schoolId, data) => repo.update(id, schoolId, data);
const removeStaff = (id, schoolId) => repo.remove(id, schoolId);
const listTeachers = (schoolId, pagination) =>
  repo.findTeachers(schoolId, pagination);

/**
 * Bulk import staff. Each row -> repo.create() which auto-handles user account,
 * role assignment, optional teachers row, and credential delivery.
 */
const bulkImportStaff = async (schoolId, rows, { schoolName } = {}) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw Object.assign(new Error("staff array is required"), {
      statusCode: 400,
    });
  }
  if (rows.length > 500) {
    throw Object.assign(new Error("Maximum 500 staff per import"), {
      statusCode: 400,
    });
  }

  const created = [];
  const failed = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || {};
    const fullName = String(row.full_name || row.name || "").trim();
    const parts = fullName.split(/\s+/).filter(Boolean);
    const payload = {
      school_id: schoolId,
      school_name: schoolName,
      first_name: row.first_name || parts[0] || "",
      last_name:
        row.last_name || (parts.length > 1 ? parts.slice(1).join(" ") : ""),
      employee_number: row.employee_number || row.employee_id || null,
      email: row.email || null,
      phone: row.phone || null,
      gender: row.gender || null,
      date_of_birth: row.date_of_birth || row.dob || null,
      join_date: row.join_date || row.date_of_joining || null,
      department_id: row.department_id || null,
      designation_id: row.designation_id || null,
      qualification: row.qualification || null,
      salary: row.salary || 0,
      role: row.role || "teacher",
      tsc_number: row.tsc_number || null,
      specialization: row.specialization || null,
      is_class_teacher: row.is_class_teacher === "true" || row.is_class_teacher === true,
    };

    if (!payload.first_name || !payload.last_name) {
      failed.push({ row: i + 1, message: "full_name (first + last) is required" });
      continue;
    }
    if (!payload.email && !payload.phone) {
      failed.push({
        row: i + 1,
        message: "email or phone is required to deliver credentials",
      });
      continue;
    }

    try {
      const result = await repo.create(payload);
      created.push({
        id: result.id,
        user_id: result.user_id,
        teacher_id: result.teacher_id,
        role: result.role,
        credentials_sent: result.credentials_sent,
      });
    } catch (err) {
      failed.push({ row: i + 1, message: err.message });
    }
  }

  return { created, failed, total: rows.length };
};

module.exports = {
  createStaff,
  listStaff,
  getStaffMember,
  updateStaff,
  removeStaff,
  listTeachers,
  bulkImportStaff,
};
