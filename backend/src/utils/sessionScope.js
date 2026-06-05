/**
 * Session isolation core helpers.
 *
 * The platform serves multi-tenant schools where every academic /
 * financial / operational record is scoped to a specific
 * (academic_year_id, term_id). These helpers make that contract
 * bulletproof:
 *
 *   1. `ensureSessionColumns()` — idempotently ALTERs the listed tables
 *      so they all carry `academic_year_id CHAR(36)` and `term_id
 *      CHAR(36)`. Safe to call at boot. Also indexes the new columns and
 *      back-fills historical rows from `terms.start_date / end_date`
 *      (when the table has a natural date column) or from
 *      `schools.current_term_id` as a fallback.
 *
 *   2. `sessionFilterSql(alias, session)` — returns a SQL fragment +
 *      params bag that restricts a query to the active session. Legacy
 *      NULL rows are kept visible by default so we never hide data that
 *      was inserted before the columns existed.
 *
 *   3. `stampSession(row, session)` — sets `academic_year_id` /
 *      `term_id` on an outgoing INSERT payload when the caller did not
 *      override them.
 */
const { query } = require("../config/database");

// table -> { dateCol? } — when dateCol is present we back-fill by joining
// against `terms` on its date range; otherwise we back-fill from
// schools.current_* as a best-effort.
const SESSION_TABLES = {
  payments: { dateCol: "received_at" },
  student_attendance: { dateCol: "date" },
  staff_attendance: { dateCol: "date" },
  homework: { dateCol: "assigned_date" },
  homework_submissions: { dateCol: "submission_date" },
  exam_marks: { dateCol: null },
  cbc_observations: { dateCol: "observed_at" },
  student_rankings: { dateCol: null },
  report_card_runs: { dateCol: null },
  report_card_runs_v2: { dateCol: null },
  student_fees: { dateCol: null },
  fee_structures: { dateCol: null },
  fee_carry_forwards: { dateCol: null },
  mpesa_transactions: { dateCol: "transaction_date" },
};

let _ready = null;

async function _columnExists(table, col) {
  const rows = await query(
    `SELECT COUNT(*) AS c FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, col],
  );
  return Number(rows[0]?.c || rows[0]?.C || 0) > 0;
}

async function _tableExists(table) {
  const rows = await query(
    `SELECT COUNT(*) AS c FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name = ?`,
    [table],
  );
  return Number(rows[0]?.c || rows[0]?.C || 0) > 0;
}

async function _addColumnIfMissing(table, col) {
  if (await _columnExists(table, col)) return false;
  try {
    await query(`ALTER TABLE \`${table}\` ADD COLUMN \`${col}\` CHAR(36) NULL`);
    try {
      await query(
        `CREATE INDEX \`idx_${table}_${col}\` ON \`${table}\` (\`${col}\`)`,
      );
    } catch {
      /* index may already exist */
    }
    return true;
  } catch (e) {
    // Race or duplicate — ignore.
    return false;
  }
}

async function _backfill(table, cfg) {
  // Only backfill rows where both session columns are NULL to keep the
  // statement cheap and idempotent.
  if (cfg.dateCol && (await _columnExists(table, cfg.dateCol))) {
    try {
      await query(
        `UPDATE \`${table}\` t
            JOIN terms tm
              ON tm.school_id = t.school_id
             AND DATE(t.\`${cfg.dateCol}\`) BETWEEN tm.start_date AND tm.end_date
            SET t.term_id = tm.id,
                t.academic_year_id = tm.academic_year_id
          WHERE t.term_id IS NULL`,
      );
    } catch (e) {
      /* table may lack date col or have type mismatch — non-fatal */
    }
  }
  // Fallback for rows still NULL: stamp from the school's current session.
  try {
    await query(
      `UPDATE \`${table}\` t
          JOIN schools s ON s.id = t.school_id
          SET t.term_id = COALESCE(t.term_id, s.current_term_id),
              t.academic_year_id = COALESCE(t.academic_year_id, s.current_academic_year_id)
        WHERE t.term_id IS NULL OR t.academic_year_id IS NULL`,
    );
  } catch (e) {
    /* school columns may not exist on every install */
  }
}

async function ensureSessionColumns({ backfill = true } = {}) {
  if (_ready) return _ready;
  _ready = (async () => {
    const report = { altered: [], skipped: [], errored: [] };
    for (const [table, cfg] of Object.entries(SESSION_TABLES)) {
      try {
        if (!(await _tableExists(table))) {
          report.skipped.push(`${table} (missing)`);
          continue;
        }
        const addedYear = await _addColumnIfMissing(table, "academic_year_id");
        const addedTerm = await _addColumnIfMissing(table, "term_id");
        if (addedYear || addedTerm) report.altered.push(table);
        if (backfill) await _backfill(table, cfg);
      } catch (e) {
        report.errored.push(`${table}: ${e.message}`);
      }
    }
    if (report.altered.length || report.errored.length) {
      console.log("[sessionScope] ensureSessionColumns:", report);
    }
    return report;
  })();
  return _ready;
}

/**
 * Build a SQL fragment that filters rows to the active session.
 *
 *   const { sql, params } = sessionFilterSql("p", req.session);
 *   // sql:    " AND (p.academic_year_id = ? OR p.academic_year_id IS NULL)
 *   //          AND (p.term_id = ? OR p.term_id IS NULL)"
 *   // params: ["ay-uuid", "term-uuid"]
 *
 * Pass `{ strict: true }` to drop the legacy-NULL escape hatch.
 */
function sessionFilterSql(alias, session, opts = {}) {
  const prefix = alias ? `${alias}.` : "";
  const parts = [];
  const params = [];
  if (session?.academicYearId) {
    parts.push(
      opts.strict
        ? `${prefix}academic_year_id = ?`
        : `(${prefix}academic_year_id = ? OR ${prefix}academic_year_id IS NULL)`,
    );
    params.push(session.academicYearId);
  }
  if (session?.termId) {
    parts.push(
      opts.strict
        ? `${prefix}term_id = ?`
        : `(${prefix}term_id = ? OR ${prefix}term_id IS NULL)`,
    );
    params.push(session.termId);
  }
  return {
    sql: parts.length ? ` AND ${parts.join(" AND ")}` : "",
    params,
  };
}

/**
 * Stamp an outgoing INSERT/UPDATE payload with session ids when caller
 * did not provide an explicit override. Returns a new object — never
 * mutates the input.
 */
function stampSession(row, session) {
  if (!row) return row;
  return {
    ...row,
    academic_year_id: row.academic_year_id || session?.academicYearId || null,
    term_id: row.term_id || session?.termId || null,
  };
}

/**
 * Express middleware: rejects mutating endpoints when no active session
 * has been resolved. Mount AFTER `resolveSession` on routes that write
 * session-scoped tables (assessments, exam marks, fees, payments,
 * attendance, homework, etc.).
 */
function requireActiveSession(req, res, next) {
  if (req.method === "GET" || req.method === "HEAD") return next();
  if (!req.session?.termId || !req.session?.academicYearId) {
    return res.status(409).json({
      success: false,
      error: "No active academic session — set the current term/year first.",
    });
  }
  next();
}

module.exports = {
  SESSION_TABLES,
  ensureSessionColumns,
  sessionFilterSql,
  stampSession,
  requireActiveSession,
};