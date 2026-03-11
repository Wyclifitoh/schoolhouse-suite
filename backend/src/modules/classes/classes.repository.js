const { query, queryOne } = require('../../config/database');
const { v4: uuidv4 } = require('uuid');

// Grades
const findAllGrades = async (schoolId) => {
  return query('SELECT * FROM grades WHERE school_id = ? ORDER BY order_index ASC', [schoolId]);
};

// Streams
const findAllStreams = async (schoolId, gradeId) => {
  let sql = 'SELECT s.*, g.name as grade_name FROM streams s JOIN grades g ON g.id = s.grade_id WHERE s.school_id = ?';
  const params = [schoolId];
  if (gradeId) { sql += ' AND s.grade_id = ?'; params.push(gradeId); }
  sql += ' ORDER BY g.order_index ASC, s.name ASC';
  return query(sql, params);
};

const createGrade = async (data) => {
  const id = uuidv4();
  await query('INSERT INTO grades (id, school_id, name, level, order_index, curriculum_type) VALUES (?, ?, ?, ?, ?, ?)',
    [id, data.school_id, data.name, data.level, data.order_index || 0, data.curriculum_type || 'CBC']);
  return queryOne('SELECT * FROM grades WHERE id = ?', [id]);
};

const createStream = async (data) => {
  const id = uuidv4();
  await query('INSERT INTO streams (id, school_id, grade_id, academic_year_id, name, capacity, class_teacher_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, data.school_id, data.grade_id, data.academic_year_id, data.name, data.capacity || null, data.class_teacher_id || null]);
  return queryOne('SELECT * FROM streams WHERE id = ?', [id]);
};

// Subjects
const findAllSubjects = async (schoolId) => {
  return query('SELECT * FROM subjects WHERE school_id = ? ORDER BY name ASC', [schoolId]);
};

const createSubject = async (data) => {
  const id = uuidv4();
  await query('INSERT INTO subjects (id, school_id, name, code, description) VALUES (?, ?, ?, ?, ?)',
    [id, data.school_id, data.name, data.code || null, data.description || null]);
  return queryOne('SELECT * FROM subjects WHERE id = ?', [id]);
};

// Staff list (for class teachers / timetable)
const findAllStaff = async (schoolId) => {
  return query('SELECT id, first_name, last_name, employee_number, email, phone, status FROM staff WHERE school_id = ? AND status = ? ORDER BY first_name ASC', [schoolId, 'active']);
};

// Departments
const findAllDepartments = async (schoolId) => {
  return query('SELECT * FROM departments WHERE school_id = ? ORDER BY name ASC', [schoolId]);
};

const createDepartment = async (data) => {
  const id = uuidv4();
  await query('INSERT INTO departments (id, school_id, name, description, head_staff_id) VALUES (?, ?, ?, ?, ?)',
    [id, data.school_id, data.name, data.description || null, data.head_staff_id || null]);
  return queryOne('SELECT * FROM departments WHERE id = ?', [id]);
};

// Designations
const findAllDesignations = async (schoolId) => {
  return query('SELECT * FROM designations WHERE school_id = ? ORDER BY name ASC', [schoolId]);
};

module.exports = {
  findAllGrades, findAllStreams, createGrade, createStream,
  findAllSubjects, createSubject,
  findAllStaff, findAllDepartments, createDepartment, findAllDesignations
};
