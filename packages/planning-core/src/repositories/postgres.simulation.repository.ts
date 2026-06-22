/**
 * planning-core / postgres.simulation.repository.ts
 *
 * Persists simulation runs in PostgreSQL (JSONB payload).
 */

import pg from 'pg';
import type { SimulationRun, SimRunId } from '../types/canonical.types.js';
import type { ISimulationRepository } from '../interfaces/repository.interface.js';

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS pcp_simulation_runs (
  id UUID PRIMARY KEY,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pcp_simulation_runs_created
  ON pcp_simulation_runs (created_at DESC);
`;

interface StoredPayload {
  id: string;
  name: string;
  description?: string;
  triggeredBy: string;
  startedAt: string;
  finishedAt?: string;
  status: SimulationRun['status'];
  orderIds: SimulationRun['orderIds'];
  results: SimulationRun['results'];
  auditTrail: SimulationRun['auditTrail'];
  metadata: SimulationRun['metadata'];
}

function reviveRun(raw: StoredPayload): SimulationRun {
  const { finishedAt, startedAt, ...rest } = raw;
  return {
    ...rest,
    id: rest.id as SimulationRun['id'],
    startedAt: new Date(startedAt),
    ...(finishedAt ? { finishedAt: new Date(finishedAt) } : {}),
  };
}

export class PostgresSimulationRepository implements ISimulationRepository {
  private readonly pool: pg.Pool;
  private initialized = false;

  constructor(connectionString: string) {
    this.pool = new pg.Pool({ connectionString });
  }

  private async ensureSchema(): Promise<void> {
    if (this.initialized) return;
    await this.pool.query(CREATE_TABLE_SQL);
    this.initialized = true;
  }

  async findById(id: SimRunId): Promise<SimulationRun | null> {
    await this.ensureSchema();
    const result = await this.pool.query<{ payload: StoredPayload }>(
      'SELECT payload FROM pcp_simulation_runs WHERE id = $1',
      [id],
    );
    const row = result.rows[0];
    return row ? reviveRun(row.payload) : null;
  }

  async findAll(): Promise<SimulationRun[]> {
    await this.ensureSchema();
    const result = await this.pool.query<{ payload: StoredPayload }>(
      'SELECT payload FROM pcp_simulation_runs ORDER BY created_at DESC',
    );
    return result.rows.map((row) => reviveRun(row.payload));
  }

  async save(run: SimulationRun): Promise<SimulationRun> {
    await this.ensureSchema();
    await this.pool.query(
      `INSERT INTO pcp_simulation_runs (id, payload)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload`,
      [run.id, JSON.stringify(run)],
    );
    return run;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
