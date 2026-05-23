const { query, queryOne } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

const create = async (data) => {
  const id = uuidv4();

  const fields = [
    "id",
    "school_id",
    "employee_number",
    "first_name",
    "last_name",
    "email",
    "phone",
    "gender",
    "date_of_birth",
    "join_date",
    "department_id",
    "designation_id",
    "qualification",
    "salary",
    "address",
    "id_number",
    "kra_pin",
    "bank_name",
    "bank_account",
    "role",
  ];

  const placeholders = fields.map(() => "?").join(", ");

  const values = [
    id,
    data.school_id ?? null,
    data.employee_number ?? null,
    data.first_name ?? null,
    data.last_name ?? null,
    data.email ?? null,
    data.phone ?? null,
    data.gender ?? null,
    data.date_of_birth ?? null,
    data.join_date ?? null,
    data.department_id ?? null,
    data.designation_id ?? null,
    data.qualification ?? null,
    data.salary ?? 0,
    data.address ?? null,
    data.id_number ?? null,
    data.kra_pin ?? null,
    data.bank_name ?? null,
    data.bank_account ?? null,
    data.role ?? "teacher",
  ];

  await query(
    `INSERT INTO staff (${fields.join(", ")}) VALUES (${placeholders})`,
    values,
  );
  
  if (data.role === "teacher") {
    const teacherId = uuidv4();
    const teacherValues = [
      teacherId,
      data.school_id,
      id,
      data.tsc_number ?? null,
      data.specialization ?? null,
      data.is_class_teacher ? 1 : 0,
      data.bio ?? null,
    ];

    await query(
      `INSERT INTO teachers (id, school_id, staff_id, tsc_number, specialization, is_class_teacher, bio) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      teacherValues,
    );
  }

  return { id, ...data };
};

const findAll = async (schoolId, { limit, offset }) => {
  const rows = await query(
    `SELECT s.*, d.name as department_name, ds.name as designation_name 
     FROM staff s 
     LEFT JOIN departments d ON s.department_id = d.id 
     LEFT JOIN designations ds ON s.designation_id = ds.id 
     WHERE s.school_id = ? ORDER BY s.first_name ASC LIMIT ? OFFSET ?`,
    [schoolId, limit, offset],
  );
  const count = await query(
    "SELECT COUNT(*) as count FROM staff WHERE school_id = ?",
    [schoolId],
  );
  return { rows, total: count[0]?.count || 0 };
};

const findById = async (id, schoolId) => {
  return queryOne("SELECT * FROM staff WHERE id = ? AND school_id = ?", [
    id,
    schoolId,
  ]);
};

module.exports = { create, findAll, findById };
