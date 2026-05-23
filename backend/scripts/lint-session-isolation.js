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

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'src', 'modules');

// Tables that MUST always be filtered by academic_year_id + term_id.
const SESSION_SCOPED_TABLES = [
  'attendance',
  'exam_marks',
  'homework',
  'assignments',
  'timetables',
  'discipline_records',
  'student_fees',
  'payments',
  'student_enrollments',
];

// Files allowed to bypass (migrations, archives endpoint, promotion writes).
const ALLOWLIST = [
  'promotion/promotion.repository.js',
  'archives',
];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

const offenders = [];
const files = fs.existsSync(ROOT) ? walk(ROOT) : [];

for (const file of files) {
  const rel = path.relative(path.join(__dirname, '..'), file);
  if (ALLOWLIST.some((a) => rel.includes(a))) continue;

  const src = fs.readFileSync(file, 'utf8');
  // crude SQL extraction: backtick or single-quote strings containing FROM/UPDATE/INTO
  const stmts = src.match(/(`[^`]*`|'[^']{20,}')/g) || [];
  for (const raw of stmts) {
    const sql = raw.replace(/[`']/g, '').replace(/\s+/g, ' ');
    if (!/\b(FROM|UPDATE|INTO)\b/i.test(sql)) continue;

    for (const table of SESSION_SCOPED_TABLES) {
      const tableHit = new RegExp(`\\b${table}\\b`, 'i').test(sql);
      if (!tableHit) continue;

      const isSelectOrUpdate = /\b(SELECT|UPDATE|DELETE)\b/i.test(sql);
      const isInsert = /\bINSERT\b/i.test(sql);
      const hasYearFilter = /academic_year_id/i.test(sql);
      const hasTermFilter = /term_id/i.test(sql);

      if (isSelectOrUpdate && !(hasYearFilter && hasTermFilter)) {
        offenders.push({ file: rel, table, sql: sql.slice(0, 120) });
      }
      if (isInsert && !(hasYearFilter && hasTermFilter)) {
        offenders.push({ file: rel, table, sql: sql.slice(0, 120) });
      }
    }
  }
}

if (offenders.length === 0) {
  console.log('session-isolation lint: OK — no unscoped queries detected.');
  process.exit(0);
}

console.error('session-isolation lint: FAILED');
console.error(`Found ${offenders.length} unscoped query/queries against session-scoped tables.\n`);
for (const o of offenders) {
  console.error(`  ${o.file}`);
  console.error(`    table: ${o.table}`);
  console.error(`    sql:   ${o.sql}...`);
  console.error('');
}
console.error('Every query against these tables must filter by academic_year_id AND term_id.');
console.error('Use req.session.{academicYearId, termId} or add the file to ALLOWLIST with justification.');
process.exit(1);
