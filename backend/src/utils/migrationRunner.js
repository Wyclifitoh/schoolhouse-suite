// MySQL error codes that indicate a statement is effectively a no-op
// because the schema is already in the desired state. Treated as
// warnings so additive migrations stay idempotent.
const IDEMPOTENT_ERRNOS = new Set([
  1050, // ER_TABLE_EXISTS_ERROR
  1060, // ER_DUP_FIELDNAME
  1061, // ER_DUP_KEYNAME
  1062, // ER_DUP_ENTRY  (seed rows)
  1091, // ER_CANT_DROP_FIELD_OR_KEY (drop-if-exists style)
  1826, // ER_FK_DUP_NAME
]);
/**
 * Lightweight SQL migration runner.
 *
 * - Reads `*.sql` files from `backend/migrations/` in sorted (lexicographic) order.
 * - Tracks applied filenames in `schema_migrations`.
 * - Splits each file by ";" and executes statements sequentially.
 * - Skips inline comments and empty statements.
 * - Safe to run at every boot — applied files are skipped.
 *
 * Migration files must therefore be idempotent or use `IF NOT EXISTS`
 * / `INSERT IGNORE` where applicable.  Never edit a file once it has
 * been applied in production — create a new timestamped migration
 * instead.
 */
const fs = require("fs");
const path = require("path");
const { query } = require("../config/database");

const MIGRATIONS_DIR = path.resolve(__dirname, "..", "..", "migrations");

async function ensureMigrationsTable() {
  await query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       filename VARCHAR(255) NOT NULL PRIMARY KEY,
       applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  );
}

function listMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.toLowerCase().endsWith(".sql"))
    .sort();
}

async function appliedSet() {
  const rows = await query(`SELECT filename FROM schema_migrations`);
  return new Set(rows.map((r) => r.filename));
}

/**
 * Naively split a SQL file on `;` boundaries.  Strips single-line `--`
 * comments and blank lines.  We deliberately keep this simple — our
 * migrations don't use stored procedures or `DELIMITER`.
 */
function splitStatements(sql) {
  const cleaned = sql
    .split("\n")
    .filter((line) => !/^\s*--/.test(line))
    .join("\n");
  return cleaned
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function runMigrations() {
  await ensureMigrationsTable();
  const files = listMigrationFiles();
  if (!files.length) return { applied: [], skipped: [] };

  const done = await appliedSet();
  const applied = [];
  const skipped = [];

  for (const file of files) {
    if (done.has(file)) {
      skipped.push(file);
      continue;
    }
    const full = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(full, "utf8");
    const statements = splitStatements(sql);
    try {
      for (const stmt of statements) {
        try {
          await query(stmt);
        } catch (e) {
          if (IDEMPOTENT_ERRNOS.has(e.errno)) {
            console.warn(
              `[migrations] ${file}: skipping idempotent statement (${e.code})`,
            );
            continue;
          }
          throw e;
        }
      }
      await query(`INSERT INTO schema_migrations (filename) VALUES (?)`, [
        file,
      ]);
      applied.push(file);
      console.log(`[migrations] applied ${file}`);
    } catch (e) {
      console.error(`[migrations] FAILED ${file}: ${e.message}`);
      throw e;
    }
  }

  if (applied.length) {
    console.log(
      `[migrations] done: applied ${applied.length}, skipped ${skipped.length}`,
    );
  }
  return { applied, skipped };
}

module.exports = { runMigrations };
