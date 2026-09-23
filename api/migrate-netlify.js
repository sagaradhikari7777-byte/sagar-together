import { getDatabase } from '@netlify/database';
import { readFileSync } from 'node:fs';
import { makeMigrationHandler } from '../lib/migration.js';

const access = JSON.parse(readFileSync(new URL('../lib/migration-access.json', import.meta.url), 'utf8'));
async function source() {
  const connectionString = process.env.TOGETHER_MIGRATION_DATABASE_URL;
  if (!connectionString) throw new Error('Missing source connection');
  const { pool } = getDatabase({ connectionString });
  pool.options.connectionTimeoutMillis = 10000;
  pool.options.query_timeout = 15000;
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const result = await client.query("SELECT key, value FROM together_state WHERE key LIKE 'together:house:%' AND expires_at IS NULL ORDER BY key LIMIT 101");
    await client.query('COMMIT');
    return result.rows;
  } finally {
    if (client) client.release();
    await pool.end();
  }
}
async function redis(...command) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('Missing destination connection');
  const response = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(command), signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('Destination unavailable');
  const data = await response.json();
  if (data.error) throw new Error('Destination operation failed');
  return data.result;
}

export default makeMigrationHandler({ access, source, redis });
