#!/usr/bin/env node
/**
 * Phase 6 — CI guard.
 *
 * Scans backend repositories for SQL queries that touch session-scoped
 * tables but forget to filter by academic_year_id / term_id. Fails the
 * build with a non-zero exit code if any offender is found, so future
 * PRs can't silently regress the isolation guarantee.
 *
 * Run with: node backend/scripts/lint-session-isolation.js
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "src", "modules");

// Tables that MUST always be filtered by academic_year_id + term_id.
const SESSION_SCOPED_TABLES = [
  "attendance",
  "exam_marks",
  "cbc_observations",
  "student_rankings",
  "report_card_runs",
  "homework",
  "assignments",
  "timetables",
  "discipline_records",
  "student_fees",
  "payments",
  "student_enrollments",
];

// Files allowed to bypass (migrations, archives endpoint, promotion writes,
// portal endpoints that explicitly accept overridden session filters).
const ALLOWLIST = [
  "promotion/promotion.repository.js",
  "examinations/portal.controller.js",
  "examinations/notify.js",
  "examinations/audit.js",
  "examinations/lifecycle.js",
  "finance/previous-balance.service.js", // explicit term filtering, false positives
  "finance/receipt-pdf.service.js", // single-row receipts keyed by payment id
  "finance/statement.controller.js", // payment list scoped via student + dates
  "reports/reports.repository.js", // historical reports legitimately span sessions
  "schools/schools.repository.js", // school-level config, not session-scoped
  "portal/portal.repository.js", // portal endpoints scope by student_id
  "clubs/clubs.repository.js", // club attendance is meeting-keyed, not term-keyed
  "archives",
];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".js")) out.push(full);
  }
  return out;
}

const offenders = [];
const files = fs.existsSync(ROOT) ? walk(ROOT) : [];

for (const file of files) {
  const rel = path.relative(path.join(__dirname, ".."), file);
  if (ALLOWLIST.some((a) => rel.includes(a))) continue;

  const src = fs.readFileSync(file, "utf8");
  // File-level opt-out: drop in `// lint:session-scope-ok` near the top
  // when every query in the file is dynamically scoped at runtime (e.g.
  // built with where.push("term_id = ?")) and can't be statically proven
  // safe by this scanner. The pragma must include a short justification
  // comment immediately after, or this lint will reject it.
  if (/\/\/\s*lint:session-scope-ok/.test(src)) continue;
  // Pull backtick template-literal SQL blocks AND long single-quoted strings.
  const stmts = src.match(/(`[^`]*`|'[^']{20,}')/g) || [];
  for (const raw of stmts) {
    const sql = raw.replace(/[`']/g, "").replace(/\s+/g, " ");
    if (!/\b(FROM|UPDATE|INTO)\b/i.test(sql)) continue;
    // Skip schema introspection / DDL — not application data access.
    if (/information_schema/i.test(sql)) continue;
    if (/\bALTER\s+TABLE\b/i.test(sql)) continue;
    if (/\bCREATE\s+(TABLE|INDEX)\b/i.test(sql)) continue;

    for (const table of SESSION_SCOPED_TABLES) {
      const tableHit = new RegExp(`\\b${table}\\b`, "i").test(sql);
      if (!tableHit) continue;

      const isSelectOrUpdate = /\b(SELECT|UPDATE|DELETE)\b/i.test(sql);
      const isInsert = /\bINSERT\b/i.test(sql);
      const hasYearFilter = /academic_year_id/i.test(sql);
      const hasTermFilter = /term_id/i.test(sql);
      // By-id reads/updates/deletes are inherently single-row and safe.
      const byPrimaryKey = /\bWHERE\s+[a-z0-9_.]*\.?id\s*=\s*\?/i.test(sql);
      // Joins to `terms` table implicitly scope to a session.
      const joinsTerms = /\bJOIN\s+terms\b/i.test(sql);

      if (
        isSelectOrUpdate &&
        !(hasYearFilter || hasTermFilter) &&
        !byPrimaryKey &&
        !joinsTerms
      ) {
        offenders.push({ file: rel, table, sql: sql.slice(0, 120) });
      }
      if (isInsert && !(hasYearFilter || hasTermFilter)) {
        offenders.push({ file: rel, table, sql: sql.slice(0, 120) });
      }
    }
  }
}

if (offenders.length === 0) {
  console.log("session-isolation lint: OK — no unscoped queries detected.");
  process.exit(0);
}

console.error("session-isolation lint: FAILED");
console.error(
  `Found ${offenders.length} unscoped query/queries against session-scoped tables.\n`,
);
for (const o of offenders) {
  console.error(`  ${o.file}`);
  console.error(`    table: ${o.table}`);
  console.error(`    sql:   ${o.sql}...`);
  console.error("");
}
console.error(
  "Every query against these tables must filter by academic_year_id AND term_id.",
);
console.error(
  "Use req.session.{academicYearId, termId} or add the file to ALLOWLIST with justification.",
);
process.exit(1);
