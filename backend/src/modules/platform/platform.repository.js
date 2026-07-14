const { query, queryOne } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

/* ---------- Platform users ---------- */
const findUserByEmail = (email) =>
  queryOne("SELECT * FROM platform_users WHERE email = ? AND is_active = 1", [email]);

const findUserById = (id) =>
  queryOne("SELECT id, email, full_name, role, is_active FROM platform_users WHERE id = ?", [id]);

const touchLastLogin = (id) =>
  query("UPDATE platform_users SET last_login_at = NOW() WHERE id = ?", [id]);

const listPlatformUsers = () =>
  query("SELECT id, email, full_name, role, is_active, last_login_at, created_at FROM platform_users ORDER BY created_at DESC");

const createPlatformUser = async ({ email, password_hash, full_name, role }) => {
  const id = uuidv4();
  await query(
    `INSERT INTO platform_users (id, email, password_hash, full_name, role) VALUES (?,?,?,?,?)`,
    [id, email, password_hash, full_name, role || "platform_support"],
  );
  return findUserById(id);
};

const setPlatformUserActive = (id, active) =>
  query("UPDATE platform_users SET is_active = ? WHERE id = ?", [active ? 1 : 0, id]);

/* ---------- Audit ---------- */
const writeAudit = ({ actor_id, actor_email, action, target_school_id = null, payload = null, ip = null }) =>
  query(
    `INSERT INTO platform_audit_log (id, actor_id, actor_email, action, target_school_id, payload, ip)
     VALUES (?,?,?,?,?,?,?)`,
    [uuidv4(), actor_id, actor_email, action, target_school_id, payload ? JSON.stringify(payload) : null, ip],
  );

const listAudit = (limit = 200) =>
  query("SELECT * FROM platform_audit_log ORDER BY created_at DESC LIMIT ?", [Number(limit)]);

/* ---------- Global stats ---------- */
async function overviewStats() {
  const totals = await queryOne(`SELECT
    (SELECT COUNT(*) FROM schools)                              AS total_schools,
    (SELECT COUNT(*) FROM schools WHERE is_active = 1)          AS active_schools,
    (SELECT COUNT(*) FROM students WHERE status='active')       AS total_students,
    (SELECT COUNT(*) FROM users WHERE is_active = 1)            AS total_users
  `);
  const subs = await query(`SELECT status, COUNT(*) AS c FROM school_subscriptions GROUP BY status`);
  const subMap = subs.reduce((a, r) => ((a[r.status] = Number(r.c)), a), {});
  const revenue = await queryOne(`SELECT
    COALESCE(SUM(CASE WHEN status='paid' THEN amount END),0)    AS revenue_collected,
    COALESCE(SUM(CASE WHEN status='pending' THEN amount END),0) AS revenue_pending
    FROM subscription_invoices`);
  const thisMonth = await queryOne(`SELECT
    COALESCE(SUM(CASE WHEN status='paid' THEN amount END),0)    AS mtd_paid,
    COALESCE(SUM(CASE WHEN status='pending' THEN amount END),0) AS mtd_pending
    FROM subscription_invoices
    WHERE YEAR(created_at)=YEAR(NOW()) AND MONTH(created_at)=MONTH(NOW())`);
  const trialEnding = await query(`SELECT s.id, s.name, ss.trial_ends_at
    FROM school_subscriptions ss JOIN schools s ON s.id COLLATE utf8mb4_unicode_ci = ss.school_id COLLATE utf8mb4_unicode_ci
    WHERE ss.status='trial' AND ss.trial_ends_at BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
    ORDER BY ss.trial_ends_at ASC`);
  const newSignups30d = await query(`SELECT DATE(created_at) AS d, COUNT(*) AS c
    FROM schools WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY DATE(created_at) ORDER BY d`);
  return {
    totals: {
      total_schools: Number(totals.total_schools || 0),
      active_schools: Number(totals.active_schools || 0),
      total_students: Number(totals.total_students || 0),
      total_users: Number(totals.total_users || 0),
    },
    subscriptions: subMap,
    revenue: {
      collected: Number(revenue.revenue_collected || 0),
      pending: Number(revenue.revenue_pending || 0),
      mtd_paid: Number(thisMonth.mtd_paid || 0),
      mtd_pending: Number(thisMonth.mtd_pending || 0),
    },
    trialsEndingSoon: trialEnding,
    signups30d: newSignups30d,
  };
}

/* ---------- Schools list with derived stats ---------- */
async function listSchoolsWithStats({ search = "", status = "" } = {}) {
  const params = [];
  let where = "WHERE 1=1";
  if (search) { where += " AND (s.name LIKE ? OR s.email LIKE ? OR s.code LIKE ?)"; const s = `%${search}%`; params.push(s,s,s); }
  if (status) { where += " AND COALESCE(ss.status,'no_sub') = ?"; params.push(status); }
  return query(`
    SELECT s.id, s.name, s.code, s.email, s.phone, s.is_active, s.created_at,
      ss.status AS sub_status, ss.billing_mode, ss.cycle, ss.trial_ends_at, ss.current_period_end, ss.price_per_student,
      sp.name AS plan_name, sp.code AS plan_code,
      (SELECT COUNT(*) FROM students st WHERE st.school_id = s.id AND st.status='active') AS active_students,
      (SELECT COUNT(*) FROM staff sf WHERE sf.school_id = s.id) AS staff_count,
      (SELECT COUNT(*) FROM user_roles ur WHERE ur.school_id = s.id AND ur.is_active = 1) AS user_count,
      (SELECT COALESCE(SUM(amount),0) FROM subscription_invoices i WHERE i.school_id = s.id AND i.status='paid') AS lifetime_paid,
      (SELECT COALESCE(SUM(amount),0) FROM subscription_invoices i WHERE i.school_id = s.id AND i.status='pending') AS pending_amount
    FROM schools s
    LEFT JOIN school_subscriptions ss ON ss.school_id COLLATE utf8mb4_unicode_ci = s.id COLLATE utf8mb4_unicode_ci
    LEFT JOIN subscription_plans sp ON sp.id COLLATE utf8mb4_unicode_ci = ss.plan_id COLLATE utf8mb4_unicode_ci
    ${where}
    ORDER BY s.created_at DESC
  `, params);
}

async function schoolDetail(schoolId) {
  const school = await queryOne("SELECT * FROM schools WHERE id = ?", [schoolId]);
  if (!school) return null;
  const sub = await queryOne(`SELECT ss.*, sp.name AS plan_name, sp.code AS plan_code
    FROM school_subscriptions ss LEFT JOIN subscription_plans sp ON sp.id COLLATE utf8mb4_unicode_ci = ss.plan_id COLLATE utf8mb4_unicode_ci
    WHERE ss.school_id = ?`, [schoolId]);
  const invoices = await query("SELECT * FROM subscription_invoices WHERE school_id = ? ORDER BY created_at DESC", [schoolId]);
  const users = await query(`
    SELECT u.id, u.email, u.full_name, u.phone, u.is_active, u.last_login_at,
      GROUP_CONCAT(ur.role) AS roles
    FROM user_roles ur JOIN users u ON u.id = ur.user_id
    WHERE ur.school_id = ? GROUP BY u.id ORDER BY u.created_at DESC LIMIT 200`, [schoolId]);
  const counts = await queryOne(`SELECT
    (SELECT COUNT(*) FROM students WHERE school_id = ? AND status='active') AS active_students,
    (SELECT COUNT(*) FROM students WHERE school_id = ?)                     AS total_students,
    (SELECT COUNT(*) FROM staff WHERE school_id = ?)                        AS staff_count,
    (SELECT COUNT(*) FROM parents WHERE school_id = ?)                      AS parent_count,
    (SELECT COUNT(*) FROM grades WHERE school_id = ?)                      AS class_count
  `, [schoolId, schoolId, schoolId, schoolId, schoolId]);
  return { school, subscription: sub, invoices, users, counts };
}

/* ---------- Billing aggregates ---------- */
const listAllSubscriptions = ({ status = "" } = {}) => {
  const params = []; let where = "";
  if (status) { where = "WHERE ss.status = ?"; params.push(status); }
  return query(`SELECT ss.*, s.name AS school_name, sp.name AS plan_name, sp.code AS plan_code
    FROM school_subscriptions ss JOIN schools s ON s.id COLLATE utf8mb4_unicode_ci = ss.school_id COLLATE utf8mb4_unicode_ci
    LEFT JOIN subscription_plans sp ON sp.id COLLATE utf8mb4_unicode_ci = ss.plan_id COLLATE utf8mb4_unicode_ci ${where}
    ORDER BY ss.updated_at DESC`, params);
};

const listAllInvoices = ({ status = "" } = {}) => {
  const params = []; let where = "";
  if (status) { where = "WHERE i.status = ?"; params.push(status); }
  return query(`SELECT i.*, s.name AS school_name FROM subscription_invoices i
    JOIN schools s ON s.id COLLATE utf8mb4_unicode_ci = i.school_id COLLATE utf8mb4_unicode_ci ${where}
    ORDER BY i.created_at DESC LIMIT 500`, params);
};

const revenueByMonth = () => query(`
  SELECT DATE_FORMAT(created_at,'%Y-%m') AS month,
    COALESCE(SUM(CASE WHEN status='paid' THEN amount END),0) AS paid,
    COALESCE(SUM(CASE WHEN status='pending' THEN amount END),0) AS pending,
    COUNT(*) AS invoices
  FROM subscription_invoices
  WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
  GROUP BY month ORDER BY month`);

/* ---------- Mutations ---------- */
const extendTrial = (schoolId, days) =>
  query(`UPDATE school_subscriptions
    SET status='trial',
        trial_ends_at = DATE_ADD(COALESCE(trial_ends_at, NOW()), INTERVAL ? DAY),
        current_period_end = DATE_ADD(COALESCE(current_period_end, NOW()), INTERVAL ? DAY)
    WHERE school_id = ?`, [days, days, schoolId]);

const setSubscriptionStatus = (schoolId, status) =>
  query("UPDATE school_subscriptions SET status = ? WHERE school_id = ?", [status, schoolId]);

const setSchoolActive = (schoolId, active) =>
  query("UPDATE schools SET is_active = ? WHERE id = ?", [active ? 1 : 0, schoolId]);

const createInvoice = async ({ school_id, subscription_id, amount, period_start, period_end, student_count, status = "pending", mpesa_reference = null }) => {
  const id = uuidv4();
  await query(`INSERT INTO subscription_invoices
      (id, school_id, subscription_id, amount, currency, status, period_start, period_end, student_count, mpesa_reference, paid_at)
      VALUES (?,?,?,?, 'KES', ?, ?, ?, ?, ?, ${status === "paid" ? "NOW()" : "NULL"})`,
    [id, school_id, subscription_id, amount, status, period_start, period_end, student_count, mpesa_reference]);
  return queryOne("SELECT * FROM subscription_invoices WHERE id = ?", [id]);
};

const findInvoice = (id) => queryOne("SELECT * FROM subscription_invoices WHERE id = ?", [id]);

const updateInvoice = async (id, fields) => {
  const allowed = ["status","mpesa_reference","amount","period_start","period_end"];
  const entries = Object.entries(fields).filter(([k]) => allowed.includes(k));
  if (!entries.length) return findInvoice(id);
  const sql = entries.map(([k]) => `${k} = ?`).join(", ");
  const vals = entries.map(([,v]) => v);
  vals.push(id);
  await query(`UPDATE subscription_invoices SET ${sql}${fields.status === "paid" ? ", paid_at = NOW()" : ""} WHERE id = ?`, vals);
  return findInvoice(id);
};

const activateSubscription = (schoolId, { plan_id, billing_mode, cycle, price_per_student, period_start, period_end, modules }) => {
  return query(`UPDATE school_subscriptions
    SET status='active', plan_id = ?, billing_mode = ?, cycle = ?, price_per_student = ?,
        current_period_start = ?, current_period_end = ?,
        modules = CAST(? AS JSON)
    WHERE school_id = ?`,
    [plan_id, billing_mode, cycle, price_per_student, period_start, period_end, JSON.stringify(modules || ["assessments","finance","inventory","hr","communication","portal"]), schoolId]);
};

/* ---------- Plans CRUD ---------- */
const listPlans = () => query("SELECT * FROM subscription_plans ORDER BY billing_mode, base_price, price_per_student");
const createPlan = async (p) => {
  const id = uuidv4();
  await query(`INSERT INTO subscription_plans
    (id, code, name, billing_mode, cycle, price_per_student, base_price, module_code, description, min_students, max_students, is_active)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,1)`,
    [id, p.code, p.name, p.billing_mode, p.cycle, p.price_per_student||0, p.base_price||0, p.module_code||null, p.description||null, p.min_students||null, p.max_students||null]);
  return queryOne("SELECT * FROM subscription_plans WHERE id=?", [id]);
};
const updatePlan = async (id, p) => {
  const allowed = ["name","price_per_student","base_price","description","cycle","billing_mode","module_code","min_students","max_students","is_active"];
  const entries = Object.entries(p).filter(([k]) => allowed.includes(k));
  if (!entries.length) return queryOne("SELECT * FROM subscription_plans WHERE id=?", [id]);
  const sql = entries.map(([k]) => `${k} = ?`).join(", ");
  const vals = entries.map(([,v]) => v); vals.push(id);
  await query(`UPDATE subscription_plans SET ${sql} WHERE id = ?`, vals);
  return queryOne("SELECT * FROM subscription_plans WHERE id=?", [id]);
};
const deletePlan = (id) => query("DELETE FROM subscription_plans WHERE id = ?", [id]);

/* ---------- Global users (across all schools) ---------- */
const searchAllUsers = (q = "") => {
  const s = `%${q}%`;
  return query(`
    SELECT u.id, u.email, u.full_name, u.phone, u.is_active, u.last_login_at, u.created_at,
      GROUP_CONCAT(DISTINCT CONCAT(s.name,':',ur.role) SEPARATOR '|') AS memberships
    FROM users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id AND ur.is_active = 1
    LEFT JOIN schools s ON s.id = ur.school_id
    WHERE u.email LIKE ? OR u.full_name LIKE ? OR u.phone LIKE ?
    GROUP BY u.id ORDER BY u.created_at DESC LIMIT 200
  `, [s, s, s]);
};

const setUserActive = (id, active) =>
  query("UPDATE users SET is_active = ? WHERE id = ?", [active ? 1 : 0, id]);

const setUserPassword = (id, hash) =>
  query("UPDATE users SET password_hash = ? WHERE id = ?", [hash, id]);

module.exports = {
  findUserByEmail, findUserById, touchLastLogin, listPlatformUsers, createPlatformUser, setPlatformUserActive,
  writeAudit, listAudit,
  overviewStats, listSchoolsWithStats, schoolDetail,
  listAllSubscriptions, listAllInvoices, revenueByMonth,
  extendTrial, setSubscriptionStatus, setSchoolActive,
  createInvoice, findInvoice, updateInvoice, activateSubscription,
  listPlans, createPlan, updatePlan, deletePlan,
  searchAllUsers, setUserActive, setUserPassword,
};