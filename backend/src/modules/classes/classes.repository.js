const { query, queryOne } = require('../../config/database');
const { v4: uuidv4 } = require('uuid');

const mapClassRow = (grade, streams = []) => ({
  id: grade.id,
  name: grade.name,
  curriculum_type: grade.curriculum_type,
  level: grade.level,
  order_index: grade.order_index,
  sections: streams.map((stream) => stream.name),
  sections_count: streams.length,
});

const findAllClasses = async (schoolId, { limit, offset }) => {
  const grades = await query(
    'SELECT * FROM grades WHERE school_id = ? ORDER BY order_index ASC, name ASC LIMIT ? OFFSET ?',
    [schoolId, limit, offset],
  );
  const countRows = await query('SELECT COUNT(*) as count FROM grades WHERE school_id = ?', [schoolId]);
  const rows = await Promise.all(
    grades.map(async (grade) => {
      const streams = await query('SELECT id, name FROM streams WHERE school_id = ? AND grade_id = ? ORDER BY name ASC', [schoolId, grade.id]);
      return mapClassRow(grade, streams);
    }),
  );
  return { rows, total: countRows[0]?.count || 0 };
};

const findClassById = async (id, schoolId) => {
  const grade = await queryOne('SELECT * FROM grades WHERE id = ? AND school_id = ?', [id, schoolId]);
  if (!grade) return null;
  const streams = await query('SELECT id, name FROM streams WHERE school_id = ? AND grade_id = ? ORDER BY name ASC', [schoolId, grade.id]);
  return mapClassRow(grade, streams);
};

const createClass = async (data) => createGrade(data);

const findAllGrades = async (schoolId) => {
  return query('SELECT * FROM grades WHERE school_id = ? ORDER BY order_index ASC', [schoolId]);
};

const findAllStreams = async (schoolId, gradeId) => {
  let sql = 'SELECT s.*, g.name as grade_name FROM streams s LEFT JOIN grades g ON g.id = s.grade_id WHERE s.school_id = ?';
  const params = [schoolId];
  if (gradeId) { sql += ' AND s.grade_id = ?'; params.push(gradeId); }
  sql += ' ORDER BY s.name ASC';
  return query(sql, params);
};

const createGrade = async (data) => {
  const id = uuidv4();
  await query('INSERT INTO grades (id, school_id, name, level, order_index, curriculum_type) VALUES (?, ?, ?, ?, ?, ?)',
    [id, data.school_id, data.name, data.level, data.order_index || 0, data.curriculum_type || 'CBC']);
  return queryOne('SELECT * FROM grades WHERE id = ?', [id]);
};

const updateGrade = async (id, schoolId, data) => {
  const allowed = ['name', 'level', 'order_index', 'curriculum_type'];
  const entries = Object.entries(data).filter(([k]) => allowed.includes(k));
  if (entries.length === 0) return queryOne('SELECT * FROM grades WHERE id = ? AND school_id = ?', [id, schoolId]);
  const fields = entries.map(([k]) => `${k} = ?`);
  const values = entries.map(([, v]) => (v === undefined ? null : v));
  values.push(id, schoolId);
  await query(`UPDATE grades SET ${fields.join(', ')} WHERE id = ? AND school_id = ?`, values);
  return queryOne('SELECT * FROM grades WHERE id = ?', [id]);
};

const createStream = async (data) => {
  if (!data.name) throw new Error('Stream name is required');

  // Streams are standalone: name + description.
  // grade_id and academic_year_id may be attached later when the stream is added to a class.
  let academicYearId = data.academic_year_id || null;
  if (!academicYearId) {
    const currentYear = await queryOne('SELECT id FROM academic_years WHERE school_id = ? AND is_current = TRUE LIMIT 1', [data.school_id]);
    if (currentYear) academicYearId = currentYear.id;
  }

  const id = uuidv4();
  await query(
    'INSERT INTO streams (id, school_id, grade_id, academic_year_id, name, description, capacity, class_teacher_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [
      id, data.school_id,
      data.grade_id || null,
      academicYearId,
      data.name,
      data.description || null,
      data.capacity || null,
      data.class_teacher_id || null,
    ],
  );
  return queryOne('SELECT * FROM streams WHERE id = ?', [id]);
};

const updateStream = async (id, schoolId, data) => {
  const allowed = ['name', 'description', 'grade_id', 'capacity', 'class_teacher_id', 'academic_year_id'];
  const entries = Object.entries(data).filter(([key]) => allowed.includes(key));
  if (entries.length === 0) return queryOne('SELECT * FROM streams WHERE id = ?', [id]);
  const fields = entries.map(([key]) => `${key} = ?`);
  const values = entries.map(([, value]) => (value === undefined ? null : value));
  values.push(id, schoolId);
  await query(`UPDATE streams SET ${fields.join(', ')} WHERE id = ? AND school_id = ?`, values);
  return queryOne('SELECT * FROM streams WHERE id = ?', [id]);
};

const findAllSubjects = async (schoolId) => {
  return query('SELECT * FROM subjects WHERE school_id = ? ORDER BY name ASC', [schoolId]);
};

const createSubject = async (data) => {
  const id = uuidv4();
  await query('INSERT INTO subjects (id, school_id, name, code, description) VALUES (?, ?, ?, ?, ?)',
    [id, data.school_id, data.name, data.code || null, data.description || null]);
  return queryOne('SELECT * FROM subjects WHERE id = ?', [id]);
};

const updateSubject = async (id, schoolId, data) => {
  const allowed = ['name', 'code', 'description', 'is_active'];
  const entries = Object.entries(data).filter(([k]) => allowed.includes(k));
  if (entries.length === 0) return queryOne('SELECT * FROM subjects WHERE id = ?', [id]);
  const fields = entries.map(([k]) => `${k} = ?`);
  const values = entries.map(([, v]) => v);
  values.push(id, schoolId);
  await query(`UPDATE subjects SET ${fields.join(', ')} WHERE id = ? AND school_id = ?`, values);
  return queryOne('SELECT * FROM subjects WHERE id = ?', [id]);
};

const deleteSubject = async (id, schoolId) => {
  await query('DELETE FROM subjects WHERE id = ? AND school_id = ?', [id, schoolId]);
  return { deleted: true };
};

const deleteStream = async (id, schoolId) => {
  await query('DELETE FROM streams WHERE id = ? AND school_id = ?', [id, schoolId]);
  return { deleted: true };
};

const deleteGrade = async (id, schoolId) => {
  await query('DELETE FROM grades WHERE id = ? AND school_id = ?', [id, schoolId]);
  return { deleted: true };
};

const findAllStaff = async (schoolId) => {
  return query('SELECT id, first_name, last_name, employee_number, email, phone, status FROM staff WHERE school_id = ? AND status = ? ORDER BY first_name ASC', [schoolId, 'active']);
};

const findAllDepartments = async (schoolId) => {
  return query('SELECT * FROM departments WHERE school_id = ? ORDER BY name ASC', [schoolId]);
};

const createDepartment = async (data) => {
  const id = uuidv4();
  await query('INSERT INTO departments (id, school_id, name, description, head_staff_id) VALUES (?, ?, ?, ?, ?)',
    [id, data.school_id, data.name, data.description || null, data.head_staff_id || null]);
  return queryOne('SELECT * FROM departments WHERE id = ?', [id]);
};

const findAllDesignations = async (schoolId) => {
  return query('SELECT * FROM designations WHERE school_id = ? ORDER BY name ASC', [schoolId]);
};

// ============= TIMETABLE =============
const findTimetable = async (schoolId, { stream_id, teacher_id }) => {
  let sql = `SELECT t.*, s.name AS subject, g.name AS class, st.name AS section,
             CONCAT(IFNULL(stf.first_name,''),' ',IFNULL(stf.last_name,'')) AS teacher
             FROM timetable_entries t
             LEFT JOIN subjects s ON s.id = t.subject_id
             LEFT JOIN grades g ON g.id = t.grade_id
             LEFT JOIN streams st ON st.id = t.stream_id
             LEFT JOIN staff stf ON stf.id = t.teacher_id
             WHERE t.school_id = ?`;
  const params = [schoolId];
  if (stream_id) { sql += ' AND t.stream_id = ?'; params.push(stream_id); }
  if (teacher_id) { sql += ' AND t.teacher_id = ?'; params.push(teacher_id); }
  sql += ' ORDER BY FIELD(t.day,"Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"), t.period ASC';
  return query(sql, params);
};

const createTimetableEntry = async (data) => {
  const id = uuidv4();
  await query(
    `INSERT INTO timetable_entries (id, school_id, grade_id, stream_id, subject_id, teacher_id, day, period, start_time, end_time, room)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.school_id, data.grade_id, data.stream_id, data.subject_id, data.teacher_id || null,
     data.day, data.period, data.start_time || null, data.end_time || null, data.room || null]
  );
  return queryOne('SELECT * FROM timetable_entries WHERE id = ?', [id]);
};

const updateTimetableEntry = async (id, schoolId, data) => {
  const allowed = ['grade_id','stream_id','subject_id','teacher_id','day','period','start_time','end_time','room'];
  const entries = Object.entries(data).filter(([k]) => allowed.includes(k));
  if (entries.length === 0) return queryOne('SELECT * FROM timetable_entries WHERE id = ?', [id]);
  const fields = entries.map(([k]) => `${k} = ?`);
  const values = entries.map(([, v]) => v);
  values.push(id, schoolId);
  await query(`UPDATE timetable_entries SET ${fields.join(', ')} WHERE id = ? AND school_id = ?`, values);
  return queryOne('SELECT * FROM timetable_entries WHERE id = ?', [id]);
};

const deleteTimetableEntry = async (id, schoolId) => {
  await query('DELETE FROM timetable_entries WHERE id = ? AND school_id = ?', [id, schoolId]);
  return { deleted: true };
};

module.exports = {
  findAllClasses, findClassById, createClass,
  findAllGrades, findAllStreams, createGrade, updateGrade, createStream, updateStream, deleteStream, deleteGrade,
  findAllSubjects, createSubject, updateSubject, deleteSubject,
  findAllStaff, findAllDepartments, createDepartment, findAllDesignations,
  findTimetable, createTimetableEntry, updateTimetableEntry, deleteTimetableEntry,
};
