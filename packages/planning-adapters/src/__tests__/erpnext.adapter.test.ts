/**
 * Integration tests – ErpNextPlanningAdapter (fixture mode)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { ErpNextPlanningAdapter } from '../erpnext/erpnext.adapter.js';

let adapter: ErpNextPlanningAdapter;

beforeAll(() => {
  adapter = new ErpNextPlanningAdapter({
    mode: 'fixture',
    baseUrl: '',
    company: 'Pharma Collective GmbH',
    timeoutMs: 5000,
  });
});

describe('ErpNextPlanningAdapter – metadata', () => {
  it('has valid adapter metadata', () => {
    expect(adapter.metadata.id).toBe('erpnext');
    expect(adapter.metadata.sourceSystem).toBe('ERPNEXT');
  });

  it('testConnection() is healthy in fixture mode', async () => {
    const health = await adapter.testConnection();
    expect(health.healthy).toBe(true);
    expect(health.detail?.['mode']).toBe('fixture');
  });
});

describe('ErpNextPlanningAdapter – data', () => {
  it('returns work orders mapped to canonical model', async () => {
    const orders = await adapter.fetchOrders();
    expect(orders.length).toBeGreaterThanOrEqual(2);
    expect(orders[0]?.sourceSystem).toBe('ERPNEXT');
    expect(String(orders[0]?.id)).toMatch(/^ERP-WO-/);
  });

  it('returns workstations and materials', async () => {
    const [resources, materials] = await Promise.all([
      adapter.fetchResources(),
      adapter.fetchMaterials(),
    ]);
    expect(resources.length).toBeGreaterThanOrEqual(4);
    expect(materials.some(m => String(m.id) === 'TAB-ASPIRIN-500MG')).toBe(true);
  });

  it('maps hold batch to QC_HOLD', async () => {
    const batches = await adapter.fetchBatches();
    const hold = batches.find(b => String(b.id).includes('HOLD'));
    expect(hold?.status).toBe('QC_HOLD');
  });

  it('returns warehouse inventory', async () => {
    const inventory = await adapter.fetchInventory();
    expect(inventory.length).toBeGreaterThan(0);
    expect(inventory[0]?.locationId).toContain('PCG');
  });
});
