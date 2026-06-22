/**
 * Verify OPP PostgreSQL persistence end-to-end (orders + simulations).
 *
 * Requires PCP_DATABASE_URL and prior db:seed.
 */

import { loadBackendEnv } from './load-backend-env.mjs';
import { PostgresPlanningStore } from '@PCP/planning-core';
import { PostgresSimulationRepository } from '@PCP/planning-core';
import { randomUUID } from 'node:crypto';
import { asSimRunId } from '@PCP/planning-core';

loadBackendEnv({ override: true });

function resolveOppDatabaseUrl(): string {
  const url = process.env['PCP_DATABASE_URL'];
  if (!url) {
    throw new Error('PCP_DATABASE_URL is required.');
  }
  return url;
}

async function main(): Promise<void> {
  const store = new PostgresPlanningStore(resolveOppDatabaseUrl());
  await store.ensureSchema();

  const orders = await store.orderRepo.findAll();
  if (orders.length === 0) {
    throw new Error('No orders in database — run db:seed first.');
  }

  const simRepo = new PostgresSimulationRepository(store.pool);
  const id = asSimRunId(randomUUID());
  await simRepo.save({
    id,
    name: 'verify-persistence',
    triggeredBy: 'verify-script',
    startedAt: new Date(),
    status: 'COMPLETED',
    orderIds: orders.slice(0, 1).map(o => o.id),
    results: [],
    auditTrail: [],
    metadata: {},
  });

  const loaded = await simRepo.findById(id);
  if (!loaded) {
    throw new Error('Simulation run was not persisted.');
  }

  console.info('[verify:persistence] OK');
  console.info(`  orders=${orders.length} simulation=${loaded.name}`);

  await store.close();
}

main().catch((err) => {
  console.error('[verify:persistence] Failed:', err);
  process.exit(1);
});
