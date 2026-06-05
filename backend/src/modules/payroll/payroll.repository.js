// Payroll module — periods, allowances/deductions, run generation, payslips.
// Designed for production-grade Kenyan payroll context (PAYE/NSSF/SHIF/Housing).
// Heavy statutory math is intentionally simple here; refine in a dedicated
// calculator service if required.

const { query, queryOne, getClient } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

// -- Periods ----------------------------------------------------------------
const createPeriod = async (data) => {
  const id = uuidv4();
  await query(
    `INSERT INTO payroll_periods
      (id, school_id, name, year, month, start_date, end_date, payment_date, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
    [
      id, data.school_id, data.name, data.year, data.month,
      data.start_date, data.end_date, data.payment_date ?? null,
    ],
  );
  return queryOne("SELECT * FROM payroll_periods WHERE id = ?", [id]);
};

const listPeriods = (schoolId) =>
  query(
    "SELECT * FROM payroll_periods WHERE school_id = ? ORDER BY year DESC, month DESC",
    [schoolId],
  );

const getPeriod = (id, schoolId) =>
  queryOne("SELECT * FROM payroll_periods WHERE id = ? AND school_id = ?", [id, schoolId]);

// -- Allowances / deductions ------------------------------------------------
const upsertAllowance = async (data) => {
  const id = data.id || uuidv4();
  if (data.id) {
    await query(
      "UPDATE payroll_allowances SET name=?, amount=?, is_taxable=?, is_active=? WHERE id=? AND school_id=?",
      [data.name, data.amount, data.is_taxable ? 1 : 0, data.is_active ? 1 : 0, id, data.school_id],
    );
  } else {
    await query(
      `INSERT INTO payroll_allowances (id, school_id, staff_id, name, amount, is_taxable)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, data.school_id, data.staff_id, data.name, data.amount, data.is_taxable ? 1 : 0],
    );
  }
  return queryOne("SELECT * FROM payroll_allowances WHERE id = ?", [id]);
};

const listAllowances = (schoolId, staffId) =>
  query(
    "SELECT * FROM payroll_allowances WHERE school_id = ? AND staff_id = ? AND is_active = 1",
    [schoolId, staffId],
  );

const upsertDeduction = async (data) => {
  const id = data.id || uuidv4();
  if (data.id) {
    await query(
      "UPDATE payroll_deductions SET name=?, amount=?, is_active=? WHERE id=? AND school_id=?",
      [data.name, data.amount, data.is_active ? 1 : 0, id, data.school_id],
    );
  } else {
    await query(
      "INSERT INTO payroll_deductions (id, school_id, staff_id, name, amount) VALUES (?, ?, ?, ?, ?)",
      [id, data.school_id, data.staff_id, data.name, data.amount],
    );
  }
  return queryOne("SELECT * FROM payroll_deductions WHERE id = ?", [id]);
};

const listDeductions = (schoolId, staffId) =>
  query(
    "SELECT * FROM payroll_deductions WHERE school_id = ? AND staff_id = ? AND is_active = 1",
    [schoolId, staffId],
  );

// -- Statutory math (simplified Kenya 2024 brackets) ------------------------
const calcPAYE = (taxable) => {
  // Monthly bands (KES): 0-24000 10%, 24001-32333 25%, 32334-500000 30%, 500001-800000 32.5%, >800000 35%
  let tax = 0, t = taxable;
  const bands = [
    [24000, 0.10],
    [32333 - 24000, 0.25],
    [500000 - 32333, 0.30],
    [800000 - 500000, 0.325],
    [Infinity, 0.35],
  ];
  for (const [span, rate] of bands) {
    const portion = Math.min(t, span);
    if (portion <= 0) break;
    tax += portion * rate;
    t -= portion;
  }
  const personalRelief = 2400;
  return Math.max(0, tax - personalRelief);
};

const calcStatutory = (basic, allowances) => {
  const gross = basic + allowances;
  const nssf = Math.min(gross * 0.06, 4320);   // Tier I+II cap
  const shif = gross * 0.0275;                  // SHIF 2.75%
  const housing = gross * 0.015;                // Housing levy 1.5%
  const taxable = Math.max(0, gross - nssf);    // NSSF deducted before PAYE
  const paye = calcPAYE(taxable);
  return { gross, nssf, shif, housing, taxable, paye };
};

// -- Run generation ---------------------------------------------------------
const runPeriod = async (periodId, schoolId) => {
  const period = await getPeriod(periodId, schoolId);
  if (!period) throw new Error("Period not found");
  if (period.status !== "draft") throw new Error("Period is not in draft state");

  const staffList = await query(
    "SELECT id, salary FROM staff WHERE school_id = ? AND status = 'active'",
    [schoolId],
  );

  const conn = await getClient();
  try {
    await conn.beginTransaction();
    // Clear any prior runs for this period (idempotent re-run while draft)
    await conn.query("DELETE FROM payroll_runs WHERE payroll_period_id = ?", [periodId]);

    for (const s of staffList) {
      const basic = Number(s.salary || 0);
      const [allowanceRows] = await conn.query(
        "SELECT amount FROM payroll_allowances WHERE staff_id=? AND is_active=1",
        [s.id],
      );
      const [deductionRows] = await conn.query(
        "SELECT amount FROM payroll_deductions WHERE staff_id=? AND is_active=1",
        [s.id],
      );
      const totalAllowances = allowanceRows.reduce((a, r) => a + Number(r.amount), 0);
      const otherDeductions = deductionRows.reduce((a, r) => a + Number(r.amount), 0);

      const { gross, nssf, shif, housing, taxable, paye } = calcStatutory(basic, totalAllowances);
      const totalDeductions = nssf + shif + housing + paye + otherDeductions;
      const net = gross - totalDeductions;

      const runId = uuidv4();
      await conn.query(
        `INSERT INTO payroll_runs
          (id, payroll_period_id, school_id, staff_id, basic_salary, gross_salary,
           total_allowances, total_deductions, taxable_income,
           paye_amount, nssf_amount, shif_amount, housing_levy_amount, net_salary, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
        [
          runId, periodId, schoolId, s.id,
          basic, gross, totalAllowances, totalDeductions, taxable,
          paye, nssf, shif, housing, net,
        ],
      );
      // Auto-issue payslip stub
      await conn.query(
        `INSERT INTO payslips (id, school_id, payroll_run_id, staff_id, payslip_number)
         VALUES (?, ?, ?, ?, ?)`,
        [uuidv4(), schoolId, runId, s.id, `PS-${period.year}${String(period.month).padStart(2,'0')}-${s.id.slice(0,6)}`],
      );
    }
    await conn.query("UPDATE payroll_periods SET status='processing' WHERE id=?", [periodId]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  return getPeriod(periodId, schoolId);
};

const listRuns = (periodId, schoolId) =>
  query(
    `SELECT pr.*, s.first_name, s.last_name, s.employee_number, ps.payslip_number
       FROM payroll_runs pr
       JOIN staff s ON s.id = pr.staff_id
       LEFT JOIN payslips ps ON ps.payroll_run_id = pr.id
      WHERE pr.payroll_period_id = ? AND pr.school_id = ?
      ORDER BY s.first_name ASC`,
    [periodId, schoolId],
  );

const approvePeriod = async (periodId, schoolId, userId) => {
  await query(
    `UPDATE payroll_periods SET status='approved', locked_at=CURRENT_TIMESTAMP, locked_by=?
      WHERE id=? AND school_id=?`,
    [userId, periodId, schoolId],
  );
  await query(
    "UPDATE payroll_runs SET status='approved' WHERE payroll_period_id=? AND school_id=?",
    [periodId, schoolId],
  );
  return getPeriod(periodId, schoolId);
};

const markPaid = async (periodId, schoolId) => {
  await query("UPDATE payroll_periods SET status='paid' WHERE id=? AND school_id=?", [periodId, schoolId]);
  await query(
    "UPDATE payroll_runs SET status='paid', processed_at=CURRENT_TIMESTAMP WHERE payroll_period_id=? AND school_id=?",
    [periodId, schoolId],
  );
  return getPeriod(periodId, schoolId);
};

module.exports = {
  createPeriod, listPeriods, getPeriod,
  upsertAllowance, listAllowances,
  upsertDeduction, listDeductions,
  runPeriod, listRuns, approvePeriod, markPaid,
};
