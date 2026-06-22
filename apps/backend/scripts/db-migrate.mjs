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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const oppRoot = path.resolve(__dirname, '../..');

function resolveDatabaseUrl() {
  return process.env['PCP_DATABASE_URL']
    ?? process.env['DATABASE_URL']
    ?? 'postgresql://opp:opp_dev_password@localhost:5432/opp';
}

async function main() {
  const dbUrl = resolveDatabaseUrl();
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
