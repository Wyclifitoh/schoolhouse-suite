const { query, queryOne } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const { STAFF_ROLES, ROLES } = require("../../config/constants");
const { generateTempPassword } = require("../../utils/credentials");
const { sendStaffCredentials } = require("../../utils/notifier");

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function findUserByEmail(email) {
  return queryOne("SELECT id, email FROM users WHERE email = ?", [email]);
}

async function createUserForStaff({ email, fullName, phone, password }) {
  const id = uuidv4();
  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  await query(
    `INSERT INTO users (id, email, password_hash, full_name, phone, must_change_password, is_active)
     VALUES (?, ?, ?, ?, ?, 1, 1)`,
    [id, email, hash, fullName, phone || null],
  );
  // Profile (legacy table, kept for compatibility)
  await query(
    `INSERT IGNORE INTO profiles (id, email, first_name, last_name)
     VALUES (?, ?, ?, ?)`,
    [
      id,
      email,
      (fullName || "").split(" ")[0] || "",
      (fullName || "").split(" ").slice(1).join(" ") || "",
    ],
  );
  return id;
}

async function assignUserRole({ userId, schoolId, role }) {
  await query(
    `INSERT IGNORE INTO user_roles (id, user_id, school_id, role, is_active)
     VALUES (?, ?, ?, ?, 1)`,
    [uuidv4(), userId, schoolId, role],
  );
}

async function createTeacherRecord({ schoolId, staffId, extras }) {
  const id = uuidv4();
  await query(
    `INSERT INTO teachers (id, school_id, staff_id, tsc_number, specialization, is_class_teacher, bio)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      schoolId,
      staffId,
      extras?.tsc_number ?? null,
      extras?.specialization ?? null,
      extras?.is_class_teacher ? 1 : 0,
      extras?.bio ?? null,
    ],
  );
  return id;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a staff member end-to-end:
 *  - validate role is in the canonical 7-role set
 *  - create/find linked user account (auto-generates temp password)
 *  - assign user_role for the school
 *  - insert staff row with user_id link
 *  - if role=teacher, create teachers row
 *  - send credentials via email+SMS (fail-soft)
 */
async function create(data) {
  if (!data.email && !data.phone) {
    throw new Error(
      "Staff must have either email or phone to receive login credentials",
    );
  }
  const role = data.role || ROLES.TEACHER;
  if (!STAFF_ROLES.includes(role)) {
    throw new Error(
      `Invalid role "${role}". Allowed: ${STAFF_ROLES.join(", ")}`,
    );
  }

  const staffId = uuidv4();
  const fullName = `${data.first_name || ""} ${data.last_name || ""}`.trim();
  let userId = null;
  let tempPassword = null;
  let deliveryStatus = null;

  // 1. Reuse existing user if email is already registered (same person re-onboarded)
  if (data.email) {
    const existing = await findUserByEmail(data.email);
    if (existing) userId = existing.id;
  }

  // 2. Otherwise create a fresh user account
  if (!userId && data.email) {
    tempPassword = generateTempPassword();
    userId = await createUserForStaff({
      email: data.email,
      fullName,
      phone: data.phone,
      password: tempPassword,
    });
  }

  // 3. Assign role for this school (idempotent)
  if (userId) {
    await assignUserRole({ userId, schoolId: data.school_id, role });
  }

  // 4. Insert staff row
  const staffFields = [
    "id",
    "school_id",
    "user_id",
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
    "nhif_number",
    "nssf_number",
    "bank_name",
    "bank_account",
    "role",
    "status",
  ];
  const staffValues = [
    staffId,
    data.school_id,
    userId,
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
    data.nhif_number ?? null,
    data.nssf_number ?? null,
    data.bank_name ?? null,
    data.bank_account ?? null,
    role,
    data.status ?? "active",
  ];
  await query(
    `INSERT INTO staff (${staffFields.join(", ")}) VALUES (${staffFields.map(() => "?").join(", ")})`,
    staffValues,
  );

  // 5. Teacher extension row — ONLY when role=teacher
  let teacherId = null;
  if (role === ROLES.TEACHER) {
    teacherId = await createTeacherRecord({
      schoolId: data.school_id,
      staffId,
      extras: {
        tsc_number: data.tsc_number,
        specialization: data.specialization,
        is_class_teacher: data.is_class_teacher,
        bio: data.bio,
      },
    });
  }

  // 6. Deliver credentials (fail-soft) — only when we generated a fresh password
  if (tempPassword) {
    deliveryStatus = await sendStaffCredentials({
      name: fullName,
      email: data.email,
      phone: data.phone,
      password: tempPassword,
      schoolName: data.school_name,
      loginUrl: process.env.LOGIN_URL || process.env.CORS_ORIGIN,
    });
  }

  return {
    id: staffId,
    user_id: userId,
    teacher_id: teacherId,
    role,
    credentials_sent: deliveryStatus,
    // tempPassword intentionally NOT returned in production responses;
    // surface only when explicitly debugging.
    ...(process.env.RETURN_TEMP_PASSWORD === "1"
      ? { temp_password: tempPassword }
      : {}),
  };
}

async function findAllV1(schoolId, { limit, offset }) {
  const rows = await query(
    `SELECT s.*, d.name AS department_name, ds.name AS designation_name,
            t.id AS teacher_id, t.tsc_number, t.specialization, t.is_class_teacher,
            u.must_change_password
       FROM staff s
       LEFT JOIN departments  d ON s.department_id  = d.id
       LEFT JOIN designations ds ON s.designation_id = ds.id
       LEFT JOIN teachers     t ON t.staff_id = s.id
       LEFT JOIN users        u ON u.id = s.user_id
      WHERE s.school_id = ?
      ORDER BY s.first_name ASC
      LIMIT ? OFFSET ?`,
    [schoolId, limit, offset],
  );
  const count = await query(
    "SELECT COUNT(*) AS count FROM staff WHERE school_id = ?",
    [schoolId],
  );
  return { rows, total: count[0]?.count || 0 };
}

async function findAll(schoolId, { limit, offset }) {
  // Parse as integers
  const numLimit = parseInt(limit, 10);
  const numOffset = parseInt(offset, 10);

  const rows = await query(
    `SELECT s.*, d.name AS department_name, ds.name AS designation_name,
            t.id AS teacher_id, t.tsc_number, t.specialization, t.is_class_teacher,
            u.must_change_password
       FROM staff s
       LEFT JOIN departments  d ON s.department_id  = d.id
       LEFT JOIN designations ds ON s.designation_id = ds.id
       LEFT JOIN teachers     t ON t.staff_id = s.id
       LEFT JOIN users        u ON u.id = s.user_id
      WHERE s.school_id = ?
      ORDER BY s.first_name ASC
      LIMIT ${numLimit} OFFSET ${numOffset}`,
    [schoolId],
  );

  const count = await query(
    "SELECT COUNT(*) AS count FROM staff WHERE school_id = ?",
    [schoolId],
  );

  return { rows, total: count[0]?.count || 0 };
}

async function findById(id, schoolId) {
  return queryOne(
    `SELECT s.*, d.name AS department_name, ds.name AS designation_name,
            t.id AS teacher_id, t.tsc_number, t.specialization, t.is_class_teacher, t.bio,
            u.must_change_password
       FROM staff s
       LEFT JOIN departments  d ON s.department_id  = d.id
       LEFT JOIN designations ds ON s.designation_id = ds.id
       LEFT JOIN teachers     t ON t.staff_id = s.id
       LEFT JOIN users        u ON u.id = s.user_id
      WHERE s.id = ? AND s.school_id = ?`,
    [id, schoolId],
  );
}

async function update(id, schoolId, data) {
  const allowed = [
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
    "nhif_number",
    "nssf_number",
    "bank_name",
    "bank_account",
    "status",
  ];
  const entries = Object.entries(data).filter(([k]) => allowed.includes(k));
  if (entries.length === 0) return findById(id, schoolId);

  const fields = entries.map(([k]) => `${k} = ?`).join(", ");
  const values = entries.map(([, v]) => v);
  values.push(id, schoolId);
  await query(
    `UPDATE staff SET ${fields} WHERE id = ? AND school_id = ?`,
    values,
  );

  // If role changed to teacher, ensure teacher row exists; never auto-delete the teacher row.
  if (data.role && STAFF_ROLES.includes(data.role)) {
    await query(`UPDATE staff SET role = ? WHERE id = ? AND school_id = ?`, [
      data.role,
      id,
      schoolId,
    ]);
    if (data.role === ROLES.TEACHER) {
      const existing = await queryOne(
        "SELECT id FROM teachers WHERE staff_id = ?",
        [id],
      );
      if (!existing) {
        await createTeacherRecord({ schoolId, staffId: id, extras: {} });
      }
    }
  }

  return findById(id, schoolId);
}

async function remove(id, schoolId) {
  await query("DELETE FROM staff WHERE id = ? AND school_id = ?", [
    id,
    schoolId,
  ]);
  return { deleted: true };
}

async function findTeachers(schoolId, { limit = 100, offset = 0 } = {}) {
  const numLimit = parseInt(limit, 10);
  const numOffset = parseInt(offset, 10);

  // Validate numbers
  const validLimit = isNaN(numLimit)
    ? 100
    : Math.min(500, Math.max(1, numLimit));
  const validOffset = isNaN(numOffset) ? 0 : Math.max(0, numOffset);

  const rows = await query(
    `SELECT 
        t.id as teacher_id,
        t.tsc_number,
        t.specialization,
        t.is_class_teacher,
        s.id as staff_id,
        s.first_name,
        s.last_name,
        s.email,
        s.phone,
        s.employee_number,
        s.status
      FROM teachers t
      INNER JOIN staff s ON s.id = t.staff_id
      WHERE s.school_id = ? AND s.status = 'active'
      ORDER BY s.first_name, s.last_name
      LIMIT ${validLimit} OFFSET ${validOffset}`,
    [schoolId],
  );

  console.log("findTeachers rows:", rows);

  const count = await query(
    `SELECT COUNT(*) as total
     FROM teachers t
     INNER JOIN staff s ON s.id = t.staff_id
     WHERE s.school_id = ? AND s.status = 'active'`,
    [schoolId],
  );

  console.log("findTeachers count result:", count);
  console.log("findTeachers count value:", count[0]?.total);

  return { rows, total: count[0]?.total || 0 };
}

module.exports = { create, findAll, findById, update, remove, findTeachers };
