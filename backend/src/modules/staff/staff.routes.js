const router = require('express').Router();
const { query, queryOne } = require('../../config/database');
const { v4: uuidv4 } = require('uuid');
const { success, error } = require('../../utils/response');

// ===== Departments =====
router.get('/departments', async (req, res) => {
  try {
    const rows = await query(
      'SELECT * FROM departments WHERE school_id = ? ORDER BY name ASC',
      [req.schoolId]
    );
    return success(res, rows);
  } catch (e) { return error(res, e.message, 500); }
});

router.post('/departments', async (req, res) => {
  try {
    const id = uuidv4();
    const { name, description, head_staff_id } = req.body || {};
    if (!name) return error(res, 'name is required', 400);
    await query(
      'INSERT INTO departments (id, school_id, name, description, head_staff_id) VALUES (?, ?, ?, ?, ?)',
      [id, req.schoolId, name, description || null, head_staff_id || null]
    );
    const row = await queryOne('SELECT * FROM departments WHERE id = ?', [id]);
    return success(res, row, 201);
  } catch (e) { return error(res, e.message, 500); }
});

router.put('/departments/:id', async (req, res) => {
  try {
    const allowed = ['name', 'description', 'head_staff_id', 'is_active'];
    const entries = Object.entries(req.body || {}).filter(([k]) => allowed.includes(k));
    if (entries.length === 0) {
      const row = await queryOne('SELECT * FROM departments WHERE id = ? AND school_id = ?', [req.params.id, req.schoolId]);
      return success(res, row);
    }
    const fields = entries.map(([k]) => `${k} = ?`);
    const values = entries.map(([, v]) => v);
    values.push(req.params.id, req.schoolId);
    await query(`UPDATE departments SET ${fields.join(', ')} WHERE id = ? AND school_id = ?`, values);
    const row = await queryOne('SELECT * FROM departments WHERE id = ?', [req.params.id]);
    return success(res, row);
  } catch (e) { return error(res, e.message, 500); }
});

router.delete('/departments/:id', async (req, res) => {
  try {
    await query('DELETE FROM departments WHERE id = ? AND school_id = ?', [req.params.id, req.schoolId]);
    return success(res, { deleted: true });
  } catch (e) { return error(res, e.message, 500); }
});

// ===== Designations =====
router.get('/designations', async (req, res) => {
  try {
    const rows = await query(
      'SELECT * FROM designations WHERE school_id = ? ORDER BY name ASC',
      [req.schoolId]
    );
    return success(res, rows);
  } catch (e) { return error(res, e.message, 500); }
});

router.post('/designations', async (req, res) => {
  try {
    const id = uuidv4();
    const { name, description } = req.body || {};
    if (!name) return error(res, 'name is required', 400);
    await query(
      'INSERT INTO designations (id, school_id, name, description) VALUES (?, ?, ?, ?)',
      [id, req.schoolId, name, description || null]
    );
    const row = await queryOne('SELECT * FROM designations WHERE id = ?', [id]);
    return success(res, row, 201);
  } catch (e) { return error(res, e.message, 500); }
});

router.put('/designations/:id', async (req, res) => {
  try {
    const allowed = ['name', 'description', 'is_active'];
    const entries = Object.entries(req.body || {}).filter(([k]) => allowed.includes(k));
    if (entries.length === 0) {
      const row = await queryOne('SELECT * FROM designations WHERE id = ? AND school_id = ?', [req.params.id, req.schoolId]);
      return success(res, row);
    }
    const fields = entries.map(([k]) => `${k} = ?`);
    const values = entries.map(([, v]) => v);
    values.push(req.params.id, req.schoolId);
    await query(`UPDATE designations SET ${fields.join(', ')} WHERE id = ? AND school_id = ?`, values);
    const row = await queryOne('SELECT * FROM designations WHERE id = ?', [req.params.id]);
    return success(res, row);
  } catch (e) { return error(res, e.message, 500); }
});

router.delete('/designations/:id', async (req, res) => {
  try {
    await query('DELETE FROM designations WHERE id = ? AND school_id = ?', [req.params.id, req.schoolId]);
    return success(res, { deleted: true });
  } catch (e) { return error(res, e.message, 500); }
});

module.exports = router;