const { query, queryOne } = require('../../config/database');
const { v4: uuidv4 } = require('uuid');

const findAllTypes = (schoolId) => 
  query('SELECT * FROM leave_types WHERE school_id = ? AND is_active = 1', [schoolId]);

const createType = async (data) => {
  const id = uuidv4();
  await query(
    'INSERT INTO leave_types (id, school_id, name, code, max_days, is_paid) VALUES (?, ?, ?, ?, ?, ?)',
    [id, data.school_id, data.name, data.code, data.max_days, data.is_paid]
  );
  return { id, ...data };
};

const findAllApplications = async (schoolId, { limit, offset }) => {
  const rows = await query(
    `SELECT la.*, s.first_name, s.last_name, lt.name as leave_type_name
     FROM leave_applications la
     JOIN staff s ON la.staff_id = s.id
     JOIN leave_types lt ON la.leave_type_id = lt.id
     WHERE la.school_id = ?
     ORDER BY la.created_at DESC LIMIT ? OFFSET ?`,
    [schoolId, limit, offset]
  );
  const count = await query('SELECT COUNT(*) as count FROM leave_applications WHERE school_id = ?', [schoolId]);
  return { rows, total: count[0]?.count || 0 };
};

const createApplication = async (data) => {
  const id = uuidv4();
  await query(
    `INSERT INTO leave_applications 
    (id, school_id, staff_id, leave_type_id, start_date, end_date, total_days, reason) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.school_id, data.staff_id, data.leave_type_id, data.start_date, data.end_date, data.total_days, data.reason]
  );
  return { id, ...data };
};

const updateApplicationStatus = async (id, data) => {
  const approvedAt = data.status === 'approved' ? new Date() : null;
  await query(
    `UPDATE leave_applications 
     SET status = ?, approved_by = ?, rejection_reason = ?, approved_at = ? 
     WHERE id = ?`,
    [data.status, data.approved_by, data.rejection_reason, approvedAt, id]
  );
  return { id, ...data };
};

module.exports = { 
  findAllTypes, createType, findAllApplications, createApplication, updateApplicationStatus 
};