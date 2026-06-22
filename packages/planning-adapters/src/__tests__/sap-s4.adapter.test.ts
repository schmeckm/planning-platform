/**
 * Integration tests – SapS4PlanningAdapter (fixture mode)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SapS4PlanningAdapter } from '../sap/sap-s4.adapter.js';
import type {
  PlanningOrder,
  PlanningResource,
  PlanningMaterial,
  PlanningBatch,
  InventoryPosition,
} from '@PCP/planning-core';

let adapter: SapS4PlanningAdapter;
let orders: PlanningOrder[];
let resources: PlanningResource[];
let materials: PlanningMaterial[];
let batches: PlanningBatch[];
let inventory: InventoryPosition[];

beforeAll(async () => {
  adapter = new SapS4PlanningAdapter({
    mode: 'fixture',
    baseUrl: '',
    plant: '1000',
    timeoutMs: 5000,
  });
  [orders, resources, materials, batches, inventory] = await Promise.all([
    adapter.fetchOrders(),
    adapter.fetchResources(),
    adapter.fetchMaterials(),
    adapter.fetchBatches(),
    adapter.fetchInventory(),
  ]);
});

describe('SapS4PlanningAdapter – metadata', () => {
  it('has valid adapter metadata', () => {
    expect(adapter.metadata.id).toBe('sap.s4hana');
    expect(adapter.metadata.sourceSystem).toBe('SAP-S4');
  });

  it('testConnection() is healthy in fixture mode', async () => {
    const health = await adapter.testConnection();
    expect(health.healthy).toBe(true);
    expect(health.detail?.['mode']).toBe('fixture');
  });
});

describe('SapS4PlanningAdapter – fetchOrders()', () => {
  it('returns released production orders for plant 1000', () => {
    expect(orders.length).toBeGreaterThanOrEqual(2);
    expect(orders.every(o => o.sourceSystem === 'SAP-S4')).toBe(true);
    expect(orders.every(o => o.tags['plant'] === '1000')).toBe(true);
  });

  it('maps SAP order numbers to canonical ids', () => {
    const first = orders.find(o => o.externalId === '10001234');
    expect(first?.id).toBe('SAP-10001234');
    expect(first?.operations.length).toBeGreaterThan(0);
  });

  it('maps blocked batch to QC_HOLD batch on order 10001235', async () => {
    const allBatches = await adapter.fetchBatches();
    const holdBatch = allBatches.find(b => String(b.id) === 'BATCH-2026-HOLD');
    expect(holdBatch?.status).toBe('QC_HOLD');
  });
});

describe('SapS4PlanningAdapter – fetchResources()', () => {
  it('returns work centers with SAP-WC prefix', () => {
    expect(resources.length).toBeGreaterThanOrEqual(4);
    expect(resources.every(r => String(r.id).startsWith('SAP-WC-'))).toBe(true);
  });
});

describe('SapS4PlanningAdapter – fetchMaterials()', () => {
  it('returns materials with shelf life', () => {
    expect(materials.length).toBeGreaterThanOrEqual(2);
    const fg = materials.find(m => String(m.id) === 'FG-ASPIRIN-500');
    expect(fg?.requiresBatchRelease).toBe(true);
    expect(fg?.shelfLifeDays).toBe(730);
  });
});

describe('SapS4PlanningAdapter – fetchInventory()', () => {
  it('returns stock positions by plant and storage location', () => {
    expect(inventory.length).toBeGreaterThan(0);
    expect(inventory[0]?.locationId).toMatch(/^1000-/);
  });
});
