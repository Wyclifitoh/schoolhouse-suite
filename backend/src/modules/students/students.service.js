const studentsRepository = require("./students.repository");
const parentsRepository = require("../parents/parents.repository");
const { parsePagination } = require("../../utils/pagination");
const { query, queryOne } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const { generateTempPassword } = require("../../utils/credentials");
const { sendSms } = require("../../utils/notifier");

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;

// Fail-soft: create / reuse a parent portal account and SMS credentials.
async function provisionParentPortal({
  schoolId,
  parentId,
  phone,
  parentName,
  schoolName,
}) {
  if (!phone) return { ok: false, skipped: "no-phone" };
  try {
    // Check existing
    const existing = await queryOne(
      "SELECT id FROM portal_accounts WHERE account_type='parent' AND identifier=? LIMIT 1",
      [phone],
    ).catch(() => null);
    if (existing) return { ok: true, reused: true };

    const pwd = generateTempPassword();
    const hash = await bcrypt.hash(pwd, SALT_ROUNDS);
    await query(
      `INSERT INTO portal_accounts (id, school_id, account_type, identifier, parent_id, pin_hash, must_change_pin, is_active)
       VALUES (?, ?, 'parent', ?, ?, ?, 1, 1)`,
      [uuidv4(), schoolId, phone, parentId, hash],
    );
    await sendSms({
      to: phone,
      message: `Habari ${parentName || ""}, your ${schoolName || "school"} parent portal login: phone ${phone} password ${pwd}. Please change on first login.`,
    });
    return { ok: true };
  } catch (err) {
    console.error("[student-import] portal provisioning failed:", err.message);
    return { ok: false, error: err.message };
  }
}

// Carry forward opening balance into the current term as a student_fees row.
async function createOpeningBalanceFee({
  schoolId,
  studentId,
  termId,
  amount,
}) {
  if (!termId || !amount || Number(amount) <= 0)
    return { ok: false, skipped: true };
  try {
    await query(
      `INSERT INTO student_fees
         (id, school_id, student_id, term_id, fee_name, amount_due, amount_paid, brought_forward_amount, status, ledger_type, due_date, created_at)
       VALUES (?, ?, ?, ?, 'Opening Balance (B/F)', ?, 0, ?, 'pending', 'fees', CURDATE(), NOW())`,
      [uuidv4(), schoolId, studentId, termId, amount, amount],
    );
    return { ok: true };
  } catch (err) {
    console.error("[student-import] opening balance failed:", err.message);
    return { ok: false, error: err.message };
  }
}

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

const getSummary = async (schoolId) => {
  const rows = await query(
    `SELECT status, COUNT(*) AS count FROM students WHERE school_id = ? GROUP BY status`,
    [schoolId],
  );
  const summary = { total: 0, active: 0, inactive: 0, graduated: 0, transferred: 0 };
  for (const r of rows) {
    const s = String(r.status || "").toLowerCase();
    summary.total += Number(r.count) || 0;
    if (summary[s] !== undefined) summary[s] = Number(r.count) || 0;
  }
  return summary;
};

const exportCsv = async (schoolId, queryParams = {}) => {
  const { rows } = await studentsRepository.findAll(schoolId, {
    limit: 10000,
    offset: 0,
    search: queryParams.search,
    status: queryParams.status,
    gradeId: queryParams.grade_id,
    streamIds: queryParams.stream_ids
      ? String(queryParams.stream_ids).split(",").filter(Boolean)
      : undefined,
  });
  const headers = [
    "admission_number","first_name","middle_name","last_name","gender",
    "date_of_birth","grade","stream","parent_name","parent_phone",
    "admission_date","status",
  ];
  const esc = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const lines = [headers.join(",")];
  for (const r of rows) lines.push(headers.map((h) => esc(r[h])).join(","));
  return lines.join("\n");
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

  // Resolve school context (name + current term/year) for portal SMS + B/F.
  const school = await queryOne(
    "SELECT name, current_academic_year_id, current_term_id FROM schools WHERE id = ?",
    [schoolId],
  );

  const created = [];
  const failed = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] || {};
    const fullName = String(row.full_name || row.name || "").trim();
    const parts = fullName.split(/\s+/).filter(Boolean);

    const student = {
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
      current_grade_id: row.current_grade_id || row.grade_id || null,
      current_stream_id: row.current_stream_id || row.stream_id || null,
      current_term_id:
        row.current_term_id || row.term_id || school?.current_term_id || null,
      admission_date:
        row.admission_date || new Date().toISOString().slice(0, 10),
      parent_name: row.parent_name || null,
      parent_phone: row.parent_phone || null,
      status: row.status || "active",
    };

    // VALIDATION
    if (
      !student.admission_number ||
      !student.first_name ||
      !student.last_name
    ) {
      failed.push({
        row: i + 1,
        admission_number: student.admission_number,
        message: "admission_number and student name are required",
      });
      continue;
    }
    if (!student.parent_name || !student.parent_phone) {
      failed.push({
        row: i + 1,
        admission_number: student.admission_number,
        message: "parent_name and parent_phone are required",
      });
      continue;
    }

    try {
      // 1. Create student
      const newStudent = await studentsRepository.create({
        ...student,
        school_id: schoolId,
      });

      // 2. Create / reuse parent
      const parentName = student.parent_name.trim();
      const pParts = parentName.split(/\s+/);
      const pFirst = pParts[0] || parentName;
      const pLast = pParts.slice(1).join(" ") || pFirst;
      let parent = await parentsRepository.findByPhone(
        schoolId,
        student.parent_phone,
      );
      if (!parent) {
        parent = await parentsRepository.create({
          school_id: schoolId,
          first_name: pFirst,
          last_name: pLast,
          phone: student.parent_phone,
          email: row.parent_email || null,
        });
      }

      // 3. Link student -> parent (idempotent)
      try {
        await query(
          `INSERT IGNORE INTO student_parents (id, student_id, parent_id, relationship, is_primary_contact, is_fee_payer)
           VALUES (?, ?, ?, 'guardian', 1, 1)`,
          [uuidv4(), newStudent.id, parent.id],
        );
      } catch (e) {
        console.error("[student-import] link parent failed:", e.message);
      }

      // 4. Provision parent portal + SMS (fail-soft)
      const portal = await provisionParentPortal({
        schoolId,
        parentId: parent.id,
        phone: student.parent_phone,
        parentName,
        schoolName: school?.name,
      });

      // 5. Opening balance carry-forward into current term (fail-soft)
      const openingBalance =
        row.opening_balance || row.balance_b_f || row.arrears || 0;
      let bfStatus = null;
      if (openingBalance && Number(openingBalance) > 0) {
        bfStatus = await createOpeningBalanceFee({
          schoolId,
          studentId: newStudent.id,
          termId: student.current_term_id,
          amount: Number(openingBalance),
        });
      }

      created.push({
        id: newStudent.id,
        admission_number: newStudent.admission_number,
        parent_id: parent.id,
        portal_provisioned: portal.ok,
        opening_balance_applied: bfStatus?.ok || false,
      });
    } catch (err) {
      failed.push({
        row: i + 1,
        admission_number: student.admission_number,
        message: err.message,
      });
    }
  }

  return { created, failed, total: rows.length };
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
  getSummary,
  exportCsv,
};
