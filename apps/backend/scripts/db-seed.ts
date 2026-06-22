/**
 * Seed canonical planning data from an adapter into PostgreSQL.
 *
 * Usage:
 *   pnpm --filter @PCP/backend db:seed
 *   pnpm --filter @PCP/backend db:seed -- --adapter=hae.postgres
 */

import { PostgresPlanningStore } from '@PCP/planning-core';
import { MockPharmaAdapter, createHaeAdapter, createSapS4Adapter, createErpNextAdapter } from '@PCP/planning-adapters';
import type { IPlanningAdapter } from '@PCP/planning-adapters';

function resolveOppDatabaseUrl(): string {
  const url = process.env['PCP_DATABASE_URL'];
  if (!url) {
    throw new Error('PCP_DATABASE_URL is required for db:seed (OPP shadow database).');
  }
  return url;
}

function parseArgs(argv: string[]): { adapterId: string } {
  const adapterArg = argv.find((arg) => arg.startsWith('--adapter='));
  return { adapterId: adapterArg?.slice('--adapter='.length) ?? 'mock.pharma' };
}

function resolveAdapter(adapterId: string): IPlanningAdapter {
  switch (adapterId) {
    case 'mock.pharma':
      return new MockPharmaAdapter();
    case 'hae.postgres':
      return createHaeAdapter();
    case 'sap.s4hana':
      return createSapS4Adapter();
    case 'erpnext':
      return createErpNextAdapter();
    default:
      throw new Error(`Unknown adapter "${adapterId}". Use mock.pharma, hae.postgres, sap.s4hana, or erpnext.`);
  }
}

async function main(): Promise<void> {
  const { adapterId } = parseArgs(process.argv.slice(2));
  const dbUrl = resolveOppDatabaseUrl();
  const store = new PostgresPlanningStore(dbUrl);
  await store.ensureSchema();

  const adapter = resolveAdapter(adapterId);
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

  console.info(`[db:seed] Loaded "${adapter.metadata.name}" (${adapterId}) into PostgreSQL`);
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
