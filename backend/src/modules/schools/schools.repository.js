const { query, queryOne } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

const findSchoolsByUser = async (userId) => {
  return query(
    `SELECT DISTINCT s.id, s.name, s.code, s.email, s.phone, s.logo_url, s.address, s.curriculum_type, s.paybill_number
     FROM schools s JOIN user_roles ur ON ur.school_id = s.id
     WHERE ur.user_id = ? AND ur.is_active = TRUE`,
    [userId],
  );
};

const findTerms = async (schoolId) => {
  return query(
    "SELECT * FROM terms WHERE school_id = ? ORDER BY start_date DESC",
    [schoolId],
  );
};

const findById = async (schoolId) => {
  return queryOne(
    "SELECT id, name, code, email, phone, logo_url, address, curriculum_type, paybill_number FROM schools WHERE id = ?",
    [schoolId],
  );
};

const update = async (schoolId, data) => {
  const allowed = [
    "name",
    "code",
    "email",
    "phone",
    "logo_url",
    "address",
    "curriculum_type",
    "paybill_number",
  ];
  const entries = Object.entries(data).filter(([key]) => allowed.includes(key));
  if (entries.length === 0) return findById(schoolId);
  const fields = entries.map(([key]) => `${key} = ?`);
  const values = entries.map(([, value]) => value);
  values.push(schoolId);
  await query(`UPDATE schools SET ${fields.join(", ")} WHERE id = ?`, values);
  return findById(schoolId);
};

const findAcademicYears = async (schoolId) => {
  return query(
    "SELECT * FROM academic_years WHERE school_id = ? ORDER BY start_date DESC",
    [schoolId],
  );
};

const createAcademicYear = async (schoolId, data) => {
  const id = uuidv4();
  await query(
    "INSERT INTO academic_years (id, school_id, name, start_date, end_date) VALUES (?, ?, ?, ?, ?)",
    [id, schoolId, data.name, data.start_date, data.end_date],
  );
  return queryOne("SELECT * FROM academic_years WHERE id = ?", [id]);
};

const setCurrentAcademicYear = async (schoolId, id) => {
  await query(
    "UPDATE academic_years SET is_current = FALSE WHERE school_id = ?",
    [schoolId],
  );
  await query(
    "UPDATE academic_years SET is_current = TRUE WHERE id = ? AND school_id = ?",
    [id, schoolId],
  );
  return queryOne("SELECT * FROM academic_years WHERE id = ?", [id]);
};

const createTerm = async (schoolId, data) => {
  const id = uuidv4();
  await query(
    "INSERT INTO terms (id, school_id, academic_year_id, name, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)",
    [
      id,
      schoolId,
      data.academic_year_id,
      data.name,
      data.start_date,
      data.end_date,
    ],
  );
  return queryOne("SELECT * FROM terms WHERE id = ?", [id]);
};

const setCurrentTerm = async (schoolId, id) => {
  await query("UPDATE terms SET is_current = FALSE WHERE school_id = ?", [
    schoolId,
  ]);
  await query(
    "UPDATE terms SET is_current = TRUE WHERE id = ? AND school_id = ?",
    [id, schoolId],
  );
  return queryOne("SELECT * FROM terms WHERE id = ?", [id]);
};

const deleteTerm = async (schoolId, id) => {
  await query("DELETE FROM terms WHERE id = ? AND school_id = ?", [
    id,
    schoolId,
  ]);
  return { deleted: true };
};

const getDashboardStats = async (schoolId) => {
  const [students, parents, staff, payments, fees, expenses] =
    await Promise.all([
      query("SELECT id, status FROM students WHERE school_id = ?", [schoolId]),
      query("SELECT COUNT(*) as count FROM parents WHERE school_id = ?", [
        schoolId,
      ]),
      query(
        "SELECT COUNT(*) as count FROM staff WHERE school_id = ? AND status = ?",
        [schoolId, "active"],
      ),
      query(
        `SELECT p.id, p.amount, p.payment_method, p.reference_number, p.received_at, p.status, s.full_name as student_name
       FROM payments p LEFT JOIN students s ON s.id = p.student_id
       WHERE p.school_id = ? AND p.status = ? ORDER BY p.received_at DESC LIMIT 10`,
        [schoolId, "completed"],
      ),
      query(
        `SELECT amount_due, amount_paid, (amount_due - amount_paid) as balance, status FROM student_fees
       WHERE school_id = ? AND status NOT IN ('cancelled','waived')`,
        [schoolId],
      ),
      query("SELECT amount FROM expenses WHERE school_id = ? AND status = ?", [
        schoolId,
        "paid",
      ]),
    ]);

  const activeStudents = students.filter((s) => s.status === "active").length;
  const totalDue = fees.reduce((s, f) => s + Number(f.amount_due || 0), 0);
  const totalPaid = fees.reduce((s, f) => s + Number(f.amount_paid || 0), 0);
  const totalOutstanding = fees.reduce((s, f) => s + Number(f.balance || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  return {
    totalStudents: students.length,
    activeStudents,
    totalParents: parents[0]?.count || 0,
    totalStaff: staff[0]?.count || 0,
    totalRevenue: totalPaid,
    totalExpenses,
    totalOutstanding,
    collectionRate: totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0,
    attendanceRate: 95,
    recentPayments: payments.map((p) => ({
      id: p.id,
      student_name: p.student_name || "Unknown",
      amount: p.amount,
      payment_method: p.payment_method,
      reference_number: p.reference_number,
      received_at: p.received_at,
      status: p.status,
    })),
  };
};

const findUsers = async (schoolId) => {
  return query(
    `SELECT u.id, u.email, u.full_name, u.phone, u.is_active, u.last_login_at,
            GROUP_CONCAT(ur.role ORDER BY ur.role SEPARATOR ', ') as roles
     FROM users u JOIN user_roles ur ON ur.user_id = u.id
     WHERE ur.school_id = ? AND ur.is_active = TRUE
     GROUP BY u.id, u.email, u.full_name, u.phone, u.is_active, u.last_login_at
     ORDER BY u.full_name ASC`,
    [schoolId],
  );
};

// Replace a user's role for this school. If role = 'teacher', auto-create teacher record.
const updateUserRole = async (schoolId, userId, role) => {
  const { v4: uuidv4 } = require("uuid");
  // Remove all existing roles for this user+school
  await query("DELETE FROM user_roles WHERE user_id = ? AND school_id = ?", [
    userId,
    schoolId,
  ]);
  // Insert new role
  await query(
    "INSERT INTO user_roles (id, user_id, school_id, role, is_active) VALUES (?, ?, ?, ?, TRUE)",
    [uuidv4(), userId, schoolId, role],
  );

  // If promoting to teacher, make sure they exist in teachers/staff
  if (role === "teacher") {
    try {
      const user = await queryOne(
        "SELECT id, email, full_name, phone FROM users WHERE id = ?",
        [userId],
      );
      if (user) {
        // staff record
        const staff = await queryOne(
          "SELECT id FROM staff WHERE user_id = ? AND school_id = ?",
          [userId, schoolId],
        );
        if (!staff) {
          const parts = (user.full_name || user.email || "Staff").split(" ");
          await query(
            `INSERT INTO staff (id, school_id, user_id, first_name, last_name, email, phone, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
            [
              uuidv4(),
              schoolId,
              userId,
              parts[0] || "Staff",
              parts.slice(1).join(" ") || "Member",
              user.email,
              user.phone || null,
            ],
          );
        }
        // teachers table (if it exists)
        try {
          const t = await queryOne(
            "SELECT id FROM teachers WHERE user_id = ? AND school_id = ?",
            [userId, schoolId],
          );
          if (!t) {
            await query(
              `INSERT INTO teachers (id, school_id, user_id, first_name, last_name, email, phone, status)
               VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
              [
                uuidv4(),
                schoolId,
                userId,
                (user.full_name || "Staff").split(" ")[0],
                (user.full_name || "Member").split(" ").slice(1).join(" ") ||
                  "Member",
                user.email,
                user.phone || null,
              ],
            );
          }
        } catch (_) {
          /* teachers table may not exist */
        }
      }
    } catch (e) {
      console.warn("[updateUserRole] teacher sync warning:", e.message);
    }
  }

  return { user_id: userId, school_id: schoolId, role };
};

const findNotificationTemplates = async (schoolId) => {
  return query(
    `SELECT id, name, event_type, channel, subject, body, is_active
     FROM notification_templates WHERE school_id = ? OR school_id IS NULL ORDER BY created_at DESC`,
    [schoolId],
  );
};

const updateNotificationTemplate = async (id, data) => {
  const allowed = [
    "name",
    "event_type",
    "channel",
    "subject",
    "body",
    "is_active",
  ];
  const entries = Object.entries(data).filter(([key]) => allowed.includes(key));
  if (entries.length === 0)
    return queryOne("SELECT * FROM notification_templates WHERE id = ?", [id]);
  const fields = entries.map(([key]) => `${key} = ?`);
  const values = entries.map(([, value]) => value);
  values.push(id);
  await query(
    `UPDATE notification_templates SET ${fields.join(", ")} WHERE id = ?`,
    values,
  );
  return queryOne("SELECT * FROM notification_templates WHERE id = ?", [id]);
};

module.exports = {
  findSchoolsByUser,
  findById,
  update,
  findTerms,
  findAcademicYears,
  createAcademicYear,
  setCurrentAcademicYear,
  createTerm,
  setCurrentTerm,
  deleteTerm,
  getDashboardStats,
  findUsers,
  updateUserRole,
  findNotificationTemplates,
  updateNotificationTemplate,
};
