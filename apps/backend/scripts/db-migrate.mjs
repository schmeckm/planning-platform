/**
 * Apply docker/postgres/init.sql to the configured database.
 *
 * Usage:
 *   PCP_DATABASE_URL=postgresql://opp:opp_dev_password@localhost:5432/opp node scripts/db-migrate.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { loadBackendEnv } from './load-backend-env.mjs';

loadBackendEnv({ override: true });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const oppRoot = path.resolve(__dirname, '../../..');

function resolveOppDatabaseUrl() {
  const url = process.env['PCP_DATABASE_URL'];
  if (!url) {
    throw new Error('PCP_DATABASE_URL is required for db:migrate.');
  }
  return url;
}

async function main() {
  const dbUrl = resolveOppDatabaseUrl();
  const initSqlPath = path.join(oppRoot, 'docker/postgres/init.sql');
  const sql = fs.readFileSync(initSqlPath, 'utf8');

  const pool = new pg.Pool({ connectionString: dbUrl });
  try {
    await pool.query(sql);
    console.info('[db:migrate] Schema applied from docker/postgres/init.sql');
    console.info(`  database: ${dbUrl.replace(/:[^:@/]+@/, ':***@')}`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[db:migrate] Failed:', err);
  process.exit(1);
});
