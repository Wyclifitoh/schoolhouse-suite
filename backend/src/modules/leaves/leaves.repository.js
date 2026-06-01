const { query, queryOne } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

// ---------- Leave Types ----------
const findAllTypes = (schoolId) =>
  query(
    "SELECT * FROM leave_types WHERE school_id = ? AND is_active = 1 ORDER BY name",
    [schoolId],
  );

const createType = async (data) => {
  const id = uuidv4();
  await query(
    "INSERT INTO leave_types (id, school_id, name, code, max_days, is_paid) VALUES (?, ?, ?, ?, ?, ?)",
    [
      id,
      data.school_id,
      data.name,
      data.code,
      data.max_days,
      data.is_paid ? 1 : 0,
    ],
  );
  return { id, ...data };
};

// ---------- Applications ----------
const findAllApplications = async (schoolId, { limit, offset, status }) => {
  const params = [schoolId];
  let where = "la.school_id = ?";
  if (status && status !== "all") {
    where += " AND la.status = ?";
    params.push(status);
  }
  const rows = await query(
    `SELECT la.*, s.first_name, s.last_name, lt.name as leave_type_name, lt.max_days
     FROM leave_applications la
     JOIN staff s ON la.staff_id = s.id
     JOIN leave_types lt ON la.leave_type_id = lt.id
     WHERE ${where}
     ORDER BY la.created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );
  const count = await query(
    `SELECT COUNT(*) as count FROM leave_applications la WHERE ${where}`,
    params,
  );
  return { rows, total: count[0]?.count || 0 };
};

const findApplicationById = (id) =>
  queryOne("SELECT * FROM leave_applications WHERE id = ?", [id]);

const createApplication = async (data) => {
  const id = uuidv4();
  await query(
    `INSERT INTO leave_applications
    (id, school_id, staff_id, leave_type_id, start_date, end_date, total_days, reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.school_id,
      data.staff_id,
      data.leave_type_id,
      data.start_date,
      data.end_date,
      data.total_days,
      data.reason,
    ],
  );
  return { id, ...data };
};

const updateApplicationStatus = async (id, data) => {
  const approvedAt = data.status === "approved" ? new Date() : null;
  await query(
    `UPDATE leave_applications
     SET status = ?, approved_by = ?, rejection_reason = ?, approved_at = ?
     WHERE id = ?`,
    [data.status, data.approved_by, data.rejection_reason, approvedAt, id],
  );
  return { id, ...data };
};

// ---------- Balances ----------
const findBalances = (schoolId, staffId, year) => {
  const params = [schoolId];
  let where = "lb.school_id = ?";
  if (staffId) {
    where += " AND lb.staff_id = ?";
    params.push(staffId);
  }
  if (year) {
    where += " AND lb.year = ?";
    params.push(year);
  }
  return query(
    `SELECT lb.*, lt.name as leave_type_name, lt.code,
            (lb.allocated_days - lb.used_days) AS remaining_days,
            CONCAT(s.first_name,' ',s.last_name) AS staff_name
     FROM leave_balances lb
     JOIN leave_types lt ON lb.leave_type_id = lt.id
     JOIN staff s       ON lb.staff_id = s.id
     WHERE ${where}
     ORDER BY staff_name, lt.name`,
    params,
  );
};

const upsertBalance = async (data) => {
  const existing = await queryOne(
    "SELECT id FROM leave_balances WHERE staff_id = ? AND leave_type_id = ? AND year = ?",
    [data.staff_id, data.leave_type_id, data.year],
  );
  if (existing) {
    await query("UPDATE leave_balances SET allocated_days = ? WHERE id = ?", [
      data.allocated_days,
      existing.id,
    ]);
    return { id: existing.id, ...data };
  }
  const id = uuidv4();
  await query(
    `INSERT INTO leave_balances (id, school_id, staff_id, leave_type_id, year, allocated_days, used_days)
     VALUES (?, ?, ?, ?, ?, ?, 0)`,
    [
      id,
      data.school_id,
      data.staff_id,
      data.leave_type_id,
      data.year,
      data.allocated_days,
    ],
  );
  return { id, ...data };
};

const adjustUsedDays = async (staffId, leaveTypeId, year, delta) => {
  // Auto-create balance row if missing using leave_types.max_days
  const existing = await queryOne(
    "SELECT id FROM leave_balances WHERE staff_id = ? AND leave_type_id = ? AND year = ?",
    [staffId, leaveTypeId, year],
  );
  if (!existing) {
    const lt = await queryOne(
      "SELECT school_id, max_days FROM leave_types WHERE id = ?",
      [leaveTypeId],
    );
    if (!lt) return;
    const id = uuidv4();
    await query(
      `INSERT INTO leave_balances (id, school_id, staff_id, leave_type_id, year, allocated_days, used_days)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        lt.school_id,
        staffId,
        leaveTypeId,
        year,
        lt.max_days || 0,
        Math.max(0, delta),
      ],
    );
    return;
  }
  await query(
    "UPDATE leave_balances SET used_days = GREATEST(0, used_days + ?) WHERE id = ?",
    [delta, existing.id],
  );
};

const getRemainingDays = async (staffId, leaveTypeId, year) => {
  const row = await queryOne(
    `SELECT (allocated_days - used_days) AS remaining
     FROM leave_balances
     WHERE staff_id = ? AND leave_type_id = ? AND year = ?`,
    [staffId, leaveTypeId, year],
  );
  if (row) return Number(row.remaining);
  const lt = await queryOne("SELECT max_days FROM leave_types WHERE id = ?", [
    leaveTypeId,
  ]);
  return lt ? Number(lt.max_days || 0) : 0;
};

module.exports = {
  findAllTypes,
  createType,
  findAllApplications,
  findApplicationById,
  createApplication,
  updateApplicationStatus,
  findBalances,
  upsertBalance,
  adjustUsedDays,
  getRemainingDays,
};
