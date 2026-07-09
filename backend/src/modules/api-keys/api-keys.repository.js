const crypto = require("crypto");
const { query, queryOne } = require("../../config/database");
const { v4: uuidv4 } = require("uuid");

const hashKey = (key) => crypto.createHash("sha256").update(key).digest("hex");
const generateKey = () =>
  "lvk_" + crypto.randomBytes(24).toString("base64url");

const list = (schoolId) =>
  query(
    `SELECT id, school_id, label, key_prefix, scopes, is_active,
            last_used_at, created_at, revoked_at
       FROM api_keys
      WHERE school_id = ?
      ORDER BY created_at DESC`,
    [schoolId],
  );

const create = async ({ schoolId, label, scopes, createdBy }) => {
  const plain = generateKey();
  const id = uuidv4();
  const prefix = plain.slice(0, 12);
  await query(
    `INSERT INTO api_keys (id, school_id, label, key_prefix, key_hash, scopes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, schoolId, label, prefix, hashKey(plain), scopes || "payments:write", createdBy || null],
  );
  return { id, label, key_prefix: prefix, scopes, api_key: plain };
};

const revoke = async (id, schoolId) => {
  await query(
    `UPDATE api_keys SET is_active=0, revoked_at=NOW() WHERE id=? AND school_id=?`,
    [id, schoolId],
  );
  return { id };
};

const findByKey = async (plainKey) => {
  if (!plainKey) return null;
  return queryOne(
    `SELECT * FROM api_keys WHERE key_hash = ? AND is_active = 1 LIMIT 1`,
    [hashKey(plainKey)],
  );
};

const touch = (id) =>
  query(`UPDATE api_keys SET last_used_at=NOW() WHERE id=?`, [id]).catch(() => {});

const logRequest = async ({
  apiKeyId, schoolId, method, path, idempotencyKey,
  requestBody, responseStatus, responseBody, ipAddress, durationMs,
}) => {
  try {
    await query(
      `INSERT INTO api_key_logs
        (id, api_key_id, school_id, method, path, idempotency_key,
         request_body, response_status, response_body, ip_address, duration_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), apiKeyId || null, schoolId || null, method, path,
       idempotencyKey || null,
       requestBody ? JSON.stringify(requestBody).slice(0, 8000) : null,
       responseStatus || null,
       responseBody ? JSON.stringify(responseBody).slice(0, 8000) : null,
       ipAddress || null, durationMs || null],
    );
  } catch (e) { /* non-fatal */ }
};

const listLogs = (schoolId, { limit = 100 } = {}) =>
  query(
    `SELECT l.*, k.label AS key_label
       FROM api_key_logs l
       LEFT JOIN api_keys k ON k.id = l.api_key_id
      WHERE l.school_id = ?
      ORDER BY l.created_at DESC
      LIMIT ?`,
    [schoolId, Number(limit) || 100],
  );

module.exports = { list, create, revoke, findByKey, touch, logRequest, listLogs };