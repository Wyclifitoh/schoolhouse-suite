const { query, queryOne } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

const findByDate = async (schoolId, date) =>
  query(
    `SELECT sa.*, s.first_name, s.last_name, s.employee_number, s.role, d.name AS department_name
     FROM staff_attendance sa
     JOIN staff s ON sa.staff_id = s.id
     LEFT JOIN departments d ON s.department_id = d.id
     WHERE sa.school_id = ? AND sa.date = ?
     ORDER BY s.first_name`,
    [schoolId, date]
  );

const upsert = async (data) => {
  const existing = await queryOne(
    `SELECT id FROM staff_attendance WHERE staff_id = ? AND date = ?`,
    [data.staff_id, data.date]
  );
  if (existing) {
    await query(
      `UPDATE staff_attendance
       SET status = ?, check_in = ?, check_out = ?, remarks = ?
       WHERE id = ?`,
      [data.status, data.check_in || null, data.check_out || null, data.remarks || null, existing.id]
    );
    return queryOne(`SELECT * FROM staff_attendance WHERE id = ?`, [existing.id]);
  }
  const id = uuidv4();
  await query(
    `INSERT INTO staff_attendance
       (id, school_id, staff_id, date, status, check_in, check_out, remarks)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.school_id, data.staff_id, data.date, data.status,
     data.check_in || null, data.check_out || null, data.remarks || null]
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
    [staff_id, date]
  );
  if (!existing) {
    return upsert({ school_id, staff_id, date, status: "present", check_out: time });
  }
  await query(`UPDATE staff_attendance SET check_out = ? WHERE id = ?`, [time, existing.id]);
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
    [start, end, schoolId]
  );
};

module.exports = { findByDate, upsert, bulkUpsert, checkIn, checkOut, monthlySummary };
