const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  charset: 'utf8mb4',
});

pool.on && pool.getConnection().then(conn => {
  console.log('MySQL connected');
  conn.release();
}).catch(err => {
  console.error('MySQL connection error:', err.message);
});

const query = async (sql, params) => {
  const [rows] = await pool.execute(sql, params || []);
  return rows;
};

const queryOne = async (sql, params) => {
  const rows = await query(sql, params);
  return rows[0] || null;
};

const queryCount = async (sql, params) => {
  const rows = await query(sql, params);
  return parseInt(rows[0]?.count || rows[0]?.['COUNT(*)'] || 0, 10);
};

const getClient = () => pool.getConnection();

module.exports = { pool, query, queryOne, queryCount, getClient };
