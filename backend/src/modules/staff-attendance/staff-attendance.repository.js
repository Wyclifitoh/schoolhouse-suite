const { query, queryOne } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

const findByDate = async (schoolId, date) =>
  query(
    `SELECT sa.*, s.first_name, s.last_name, s.employee_number, s.role, d.name AS department_name,
            sa.clock_out_reason, sa.clock_out_type, sa.self_recorded
     FROM staff_attendance sa
     JOIN staff s ON sa.staff_id = s.id
     LEFT JOIN departments d ON s.department_id = d.id
     WHERE sa.school_id = ? AND sa.date = ?
     ORDER BY s.first_name`,
    [schoolId, date],
  );

const upsert = async (data) => {
  const existing = await queryOne(
    `SELECT id FROM staff_attendance WHERE staff_id = ? AND date = ?`,
    [data.staff_id, data.date],
  );
  if (existing) {
    await query(
      `UPDATE staff_attendance
       SET status = COALESCE(?, status),
           check_in = COALESCE(?, check_in),
           check_out = COALESCE(?, check_out),
           remarks = COALESCE(?, remarks),
           clock_out_reason = COALESCE(?, clock_out_reason),
           clock_out_type = COALESCE(?, clock_out_type),
           self_recorded = COALESCE(?, self_recorded)
       WHERE id = ?`,
      [
        data.status || null,
        data.check_in || null,
        data.check_out || null,
        data.remarks || null,
        data.clock_out_reason || null,
        data.clock_out_type || null,
        data.self_recorded == null ? null : data.self_recorded ? 1 : 0,
        existing.id,
      ],
    );
    return queryOne(`SELECT * FROM staff_attendance WHERE id = ?`, [
      existing.id,
    ]);
  }
  const id = uuidv4();
  await query(
    `INSERT INTO staff_attendance
       (id, school_id, staff_id, date, status, check_in, check_out, remarks,
        clock_out_reason, clock_out_type, self_recorded)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.school_id,
      data.staff_id,
      data.date,
      data.status || "present",
      data.check_in || null,
      data.check_out || null,
      data.remarks || null,
      data.clock_out_reason || null,
      data.clock_out_type || null,
      data.self_recorded ? 1 : 0,
    ],
  );
  return queryOne(`SELECT * FROM staff_attendance WHERE id = ?`, [id]);
};

const bulkUpsert = async (records) => {
  const out = [];
  for (const r of records) out.push(await upsert(r));
  return out;
};

const checkIn = async ({ school_id, staff_id, time, late_after }) => {
  const date = new Date().toISOString().slice(0, 10);
  const status = late_after && time > late_after ? "late" : "present";
  return upsert({ school_id, staff_id, date, status, check_in: time });
};

const checkOut = async ({ school_id, staff_id, time }) => {
  const date = new Date().toISOString().slice(0, 10);
  const existing = await queryOne(
    `SELECT * FROM staff_attendance WHERE staff_id = ? AND date = ?`,
    [staff_id, date],
  );
  if (!existing) {
    return upsert({
      school_id,
      staff_id,
      date,
      status: "present",
      check_out: time,
    });
  }
  await query(`UPDATE staff_attendance SET check_out = ? WHERE id = ?`, [
    time,
    existing.id,
  ]);
  return queryOne(`SELECT * FROM staff_attendance WHERE id = ?`, [existing.id]);
};

const monthlySummary = async (schoolId, year, month) => {
  // YYYY-MM range
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${endDate}`;
  return query(
    `SELECT s.id AS staff_id,
            CONCAT(s.first_name,' ',s.last_name) AS staff_name,
            s.employee_number, s.role,
            COUNT(sa.id) AS days_recorded,
            SUM(CASE WHEN sa.status='present'  THEN 1 ELSE 0 END) AS present_days,
            SUM(CASE WHEN sa.status='absent'   THEN 1 ELSE 0 END) AS absent_days,
            SUM(CASE WHEN sa.status='late'     THEN 1 ELSE 0 END) AS late_days,
            SUM(CASE WHEN sa.status='on_leave' THEN 1 ELSE 0 END) AS leave_days,
            SUM(CASE WHEN sa.status='half_day' THEN 1 ELSE 0 END) AS half_days
     FROM staff s
     LEFT JOIN staff_attendance sa
       ON sa.staff_id = s.id AND sa.date BETWEEN ? AND ?
     WHERE s.school_id = ? AND s.status = 'active'
     GROUP BY s.id
     ORDER BY staff_name`,
    [start, end, schoolId],
  );
};

module.exports = {
  findByDate,
  upsert,
  bulkUpsert,
  checkIn,
  checkOut,
  monthlySummary,
};

// ---------------------------------------------------------------------------
// Self-service helpers
// ---------------------------------------------------------------------------
const findStaffByUser = async (schoolId, userId) =>
  queryOne(
    `SELECT id, first_name, last_name FROM staff
      WHERE school_id = ? AND user_id = ? AND status = 'active' LIMIT 1`,
    [schoolId, userId],
  );

const todayFor = async (schoolId, staffId) => {
  const date = new Date().toISOString().slice(0, 10);
  return queryOne(
    `SELECT * FROM staff_attendance WHERE school_id=? AND staff_id=? AND date=?`,
    [schoolId, staffId, date],
  );
};

const selfClockIn = async ({ schoolId, staffId, lateAfter }) => {
  const date = new Date().toISOString().slice(0, 10);
  const time = new Date().toTimeString().slice(0, 8);
  const existing = await queryOne(
    `SELECT * FROM staff_attendance WHERE school_id=? AND staff_id=? AND date=?`,
    [schoolId, staffId, date],
  );
  if (existing && existing.check_in) {
    const err = new Error("Already clocked in today.");
    err.status = 409;
    throw err;
  }
  const status = lateAfter && time > lateAfter ? "late" : "present";
  await module.exports.upsert({
    school_id: schoolId,
    staff_id: staffId,
    date,
    status,
    check_in: time,
    self_recorded: 1,
  });
  return queryOne(
    `SELECT * FROM staff_attendance WHERE school_id=? AND staff_id=? AND date=?`,
    [schoolId, staffId, date],
  );
};

const selfClockOut = async ({ schoolId, staffId, reason }) => {
  if (!reason || !String(reason).trim()) {
    const err = new Error("A reason is required to clock out.");
    err.status = 400;
    throw err;
  }
  const date = new Date().toISOString().slice(0, 10);
  const time = new Date().toTimeString().slice(0, 8);
  const existing = await queryOne(
    `SELECT * FROM staff_attendance WHERE school_id=? AND staff_id=? AND date=?`,
    [schoolId, staffId, date],
  );
  if (!existing || !existing.check_in) {
    const err = new Error("Please clock in before clocking out.");
    err.status = 400;
    throw err;
  }
  if (existing.check_out) {
    const err = new Error("Already clocked out today.");
    err.status = 409;
    throw err;
  }
  await query(
    `UPDATE staff_attendance
        SET check_out=?, clock_out_reason=?, clock_out_type='manual', self_recorded=1
      WHERE id=?`,
    [time, String(reason).slice(0, 255), existing.id],
  );
  return queryOne(`SELECT * FROM staff_attendance WHERE id=?`, [existing.id]);
};

// Auto clock-out for anyone still checked in past cutoff time.
// Called by a lightweight interval scheduler; safe to run repeatedly.
const autoCloseOpen = async ({ cutoffTime = "18:00:00" } = {}) => {
  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 8);
  if (currentTime < cutoffTime) return { closed: 0 };
  const date = now.toISOString().slice(0, 10);
  const open = await query(
    `SELECT id FROM staff_attendance
      WHERE date=? AND check_in IS NOT NULL AND check_out IS NULL`,
    [date],
  );
  for (const row of open) {
    await query(
      `UPDATE staff_attendance
          SET check_out=?, clock_out_reason='Auto clock-out — staff did not clock out',
              clock_out_type='auto'
        WHERE id=?`,
      [cutoffTime, row.id],
    );
  }
  return { closed: open.length };
};

module.exports.findStaffByUser = findStaffByUser;
module.exports.todayFor = todayFor;
module.exports.selfClockIn = selfClockIn;
module.exports.selfClockOut = selfClockOut;
module.exports.autoCloseOpen = autoCloseOpen;
