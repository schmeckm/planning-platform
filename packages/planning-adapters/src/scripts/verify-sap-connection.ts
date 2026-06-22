/**
 * Verify SAP OData connectivity (live mode).
 *
 * Usage:
 *   SAP_BASE_URL=... SAP_USERNAME=... SAP_PASSWORD=... pnpm --filter @PCP/planning-adapters verify:sap
 */

import { createSapS4Adapter } from '../sap/sap-s4.adapter.js';
import { resolveSapS4Config } from '../sap/sap-s4.odata.js';

async function main(): Promise<void> {
  const config = resolveSapS4Config();
  if (config.mode === 'fixture') {
    console.info('[verify:sap] No SAP_BASE_URL — adapter is in fixture mode (OK for demo).');
    const adapter = createSapS4Adapter({ mode: 'fixture', baseUrl: '', plant: config.plant, timeoutMs: 5000 });
    const health = await adapter.testConnection();
    console.info(JSON.stringify(health, null, 2));
    return;
  }

  const adapter = createSapS4Adapter({ ...config, mode: 'odata' });
  const health = await adapter.testConnection();
  console.info(JSON.stringify(health, null, 2));
  if (!health.healthy) process.exit(1);

  const orders = await adapter.fetchOrders({ plant: config.plant });
  console.info(`[verify:sap] Fetched ${orders.length} production orders from plant ${config.plant}`);
}

main().catch(err => {
  console.error('[verify:sap] Failed:', err);
  process.exit(1);
});
