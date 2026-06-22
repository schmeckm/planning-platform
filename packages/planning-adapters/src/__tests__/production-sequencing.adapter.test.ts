/**
 * Production Sequencing Adapter — fixture mode tests
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { ProductionSequencingAdapter } from '../production-sequencing/production-sequencing.adapter.js';

let adapter: ProductionSequencingAdapter;

beforeAll(() => {
  adapter = new ProductionSequencingAdapter({
    mode: 'fixture',
    baseUrl: '',
    plant: 'PLANT-01',
    timeoutMs: 5000,
  });
});

describe('ProductionSequencingAdapter – metadata', () => {
  it('uses vendor-neutral adapter id (no ERP trademarks)', () => {
    expect(adapter.metadata.id).toBe('production.sequencing');
    expect(adapter.metadata.name).not.toMatch(/SAP|PP\/DS|PPDS/i);
    expect(adapter.metadata.sourceSystem).toBe('PROD-SEQ');
  });

  it('testConnection() is healthy in fixture mode', async () => {
    const health = await adapter.testConnection();
    expect(health.healthy).toBe(true);
    expect(health.detail?.['mode']).toBe('fixture');
  });
});

describe('ProductionSequencingAdapter – data', () => {
  it('returns orders with multi-step routings', async () => {
    const orders = await adapter.fetchOrders();
    expect(orders.length).toBe(3);
    const fg = orders.find(o => String(o.id) === 'PS-ORD-100');
    expect(fg?.operations.length).toBe(3);
    expect(fg?.sourceSystem).toBe('PROD-SEQ');
  });

  it('applies sequence-dependent setup from matrix on first operation', async () => {
    const orders = await adapter.fetchOrders();
    const fg = orders.find(o => String(o.id) === 'PS-ORD-100');
    expect(fg?.metadata['sequenceDependentSetupMinutes']).toBe(75);
    expect(fg?.operations[0]?.setupMinutes).toBe(75);
  });

  it('includes pegging metadata on dependent order', async () => {
    const orders = await adapter.fetchOrders();
    const fg = orders.find(o => String(o.id) === 'PS-ORD-100');
    expect(fg?.metadata['peggedSupplyOrderId']).toBe('PS-ORD-090');
  });

  it('returns work centers, materials, batches, inventory', async () => {
    const [resources, materials, batches, inventory] = await Promise.all([
      adapter.fetchResources(),
      adapter.fetchMaterials(),
      adapter.fetchBatches(),
      adapter.fetchInventory(),
    ]);
    expect(resources.length).toBe(4);
    expect(materials.length).toBe(3);
    expect(batches.length).toBe(3);
    expect(inventory.length).toBe(3);
  });
});
