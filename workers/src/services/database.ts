import { Pool, PoolClient } from 'pg';
import { config } from '../config';
import { logger } from '../config/logger';

const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected database pool error');
});

export const query = async <T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T[]> => {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;

  logger.debug({ query: text.slice(0, 100), duration, rows: result.rowCount }, 'Executed query');

  return result.rows as T[];
};

export const getClient = async (): Promise<PoolClient> => {
  return pool.connect();
};

export const withTransaction = async <T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const tryAdvisoryLock = async (lockKey: number): Promise<boolean> => {
  const result = await query<{ acquired: boolean }>(
    'SELECT pg_try_advisory_lock($1) as acquired',
    [lockKey]
  );
  return result[0]?.acquired ?? false;
};

export const releaseAdvisoryLock = async (lockKey: number): Promise<void> => {
  await query('SELECT pg_advisory_unlock($1)', [lockKey]);
};

export const hashStringToInt = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

export const closePool = async (): Promise<void> => {
  await pool.end();
  logger.info('Database pool closed');
};
