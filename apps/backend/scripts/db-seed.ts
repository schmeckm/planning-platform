/**
 * Seed canonical planning data via the mock pharma adapter.
 *
 * Usage:
 *   pnpm --filter @PCP/backend db:seed
 */

import { PostgresPlanningStore } from '@PCP/planning-core';
import { MockPharmaAdapter } from '@PCP/planning-adapters';

function resolveDatabaseUrl(): string {
  return process.env['PCP_DATABASE_URL']
    ?? process.env['DATABASE_URL']
    ?? 'postgresql://opp:opp_dev_password@localhost:5432/opp';
}

async function main(): Promise<void> {
  const dbUrl = resolveDatabaseUrl();
  const store = new PostgresPlanningStore(dbUrl);
  await store.ensureSchema();

  const adapter = new MockPharmaAdapter();
  const [orders, resources, materials, batches, inventory] = await Promise.all([
    adapter.fetchOrders(),
    adapter.fetchResources(),
    adapter.fetchMaterials(),
    adapter.fetchBatches(),
    adapter.fetchInventory(),
  ]);

  await Promise.all([
    store.orderRepo.saveMany(orders),
    ...resources.map(r => store.resourceRepo.save(r)),
    ...materials.map(m => store.materialRepo.save(m)),
    ...batches.map(b => store.batchRepo.save(b)),
  ]);
  await store.inventoryStore.replaceAll(inventory);

  console.info('[db:seed] Loaded mock pharma data into PostgreSQL');
  console.info(
    `  orders=${orders.length} resources=${resources.length} ` +
    `materials=${materials.length} batches=${batches.length} inventory=${inventory.length}`,
  );

  await store.close();
}

main().catch((err) => {
  console.error('[db:seed] Failed:', err);
  process.exit(1);
});
