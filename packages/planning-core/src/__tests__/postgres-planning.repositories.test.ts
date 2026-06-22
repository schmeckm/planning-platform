/**
 * Integration tests for PostgreSQL persistence.
 * Runs when PCP_TEST_DATABASE_URL or PCP_DATABASE_URL is set and reachable.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { PostgresPlanningStore } from '../repositories/postgres.planning.repositories.js';
import { PostgresSimulationRepository } from '../repositories/postgres.simulation.repository.js';
import { asOrderId, asSimRunId } from '../types/canonical.types.js';
import type { SimulationRun } from '../types/canonical.types.js';

const dbUrl = process.env['PCP_TEST_DATABASE_URL'] ?? process.env['PCP_DATABASE_URL'];

async function canConnect(url: string): Promise<boolean> {
  const pool = new pg.Pool({ connectionString: url });
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  } finally {
    await pool.end();
  }
}

const postgresAvailable = dbUrl ? await canConnect(dbUrl) : false;

describe.skipIf(!postgresAvailable)('PostgresPlanningStore', () => {
  let store: PostgresPlanningStore;

  beforeAll(async () => {
    store = new PostgresPlanningStore(dbUrl!);
    await store.ensureSchema();
  });

  afterAll(async () => {
    await store.close();
  });

  it('persists and reloads an order with date fields', async () => {
    const orderId = asOrderId(`TEST-ORD-${Date.now()}`);
    const now = new Date('2026-06-01T08:00:00.000Z');

    await store.orderRepo.save({
      id: orderId,
      materialId: 'MAT-TEST' as never,
      quantity: 100,
      unit: 'EA',
      priority: 'NORMAL',
      status: 'RELEASED',
      earliestStart: now,
      latestFinish: new Date('2026-06-30T17:00:00.000Z'),
      durationMinutes: 480,
      operations: [],
      tags: {},
      schedulingStatus: 'UNSCHEDULED',
      metadata: {},
      createdAt: now,
      updatedAt: now,
    });

    const loaded = await store.orderRepo.findById(orderId);
    expect(loaded).not.toBeNull();
    expect(loaded!.earliestStart).toBeInstanceOf(Date);
    expect(loaded!.earliestStart.toISOString()).toBe(now.toISOString());

    await store.orderRepo.delete(orderId);
  });

  it('persists simulation runs across repository instances', async () => {
    const simRepo = new PostgresSimulationRepository(store.pool);
    const simRun: SimulationRun = {
      id: asSimRunId(randomUUID()),
      name: 'postgres-integration-test',
      triggeredBy: 'vitest',
      startedAt: new Date(),
      finishedAt: new Date(),
      status: 'COMPLETED',
      orderIds: [],
      results: [],
      auditTrail: [],
      metadata: { test: true },
    };

    await simRepo.save(simRun);
    const reloaded = await simRepo.findById(simRun.id);
    expect(reloaded?.name).toBe('postgres-integration-test');
    expect(reloaded?.startedAt).toBeInstanceOf(Date);
  });
});
