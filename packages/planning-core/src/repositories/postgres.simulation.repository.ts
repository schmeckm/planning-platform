/**
 * planning-core / postgres.simulation.repository.ts
 *
 * Persists simulation runs in PostgreSQL (JSONB payload).
 */

import pg from 'pg';
import type { SimulationRun, SimRunId } from '../types/canonical.types.js';
import type { ISimulationRepository } from '../interfaces/repository.interface.js';
import { PCP_SCHEMA_SQL } from './postgres.planning.repositories.js';

const CREATE_TABLE_SQL = PCP_SCHEMA_SQL;

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

  constructor(connectionStringOrPool: string | pg.Pool) {
    this.pool = typeof connectionStringOrPool === 'string'
      ? new pg.Pool({ connectionString: connectionStringOrPool })
      : connectionStringOrPool;
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
