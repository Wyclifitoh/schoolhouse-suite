const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  charset: "utf8mb4",
  dateStrings: ["DATE"],
});

pool.on &&
  pool
    .getConnection()
    .then((conn) => {
      console.log("MySQL connected");
      conn.release();
    })
    .catch((err) => {
      console.error("MySQL connection error:", err.message);
    });

const query = async (sql, params) => {
  const rawParams = params || [];
  // pool.query (unprepared) escapes numbers without quotes — pass through
  // as-is so `LIMIT ? OFFSET ?` produces `LIMIT 20 OFFSET 0` rather than
  // the quoted form that triggered "near ''20' OFFSET '0'" errors.
  const [rows] = await pool.query(sql, rawParams);
  return rows;
};

const queryOne = async (sql, params) => {
  const rows = await query(sql, params);
  return rows[0] || null;
};

const execute = async (sql, params) => {
  const [result] = await pool.execute(sql, params);
  return result;
};

const queryCount = async (sql, params) => {
  const rows = await query(sql, params);
  return parseInt(rows[0]?.count || rows[0]?.["COUNT(*)"] || 0, 10);
};

const getClient = () => pool.getConnection();

const cleanValues = (arr) => arr.map((v) => (v === undefined ? null : v));

module.exports = {
  pool,
  query,
  queryOne,
  queryCount,
  getClient,
  execute,
  cleanValues,
};
