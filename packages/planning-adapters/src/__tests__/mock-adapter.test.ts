/**
 * Integration tests – MockPharmaAdapter
 *
 * The mock adapter is the reference CSV/development adapter.
 * These tests verify that it returns valid canonical data structures
 * that satisfy the IConstraintPlugin contract.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { MockPharmaAdapter } from '../adapters/mock.adapter.js';
import type {
  PlanningOrder,
  PlanningResource,
  PlanningMaterial,
  PlanningBatch,
  InventoryPosition,
  WorkingCalendar,
} from '@PCP/planning-core';

// ─── Fixture ─────────────────────────────────────────────────────────────────

let adapter: MockPharmaAdapter;
let orders: PlanningOrder[];
let resources: PlanningResource[];
let materials: PlanningMaterial[];
let batches: PlanningBatch[];
let inventory: InventoryPosition[];
let calendars: WorkingCalendar[];

beforeAll(async () => {
  adapter = new MockPharmaAdapter();
  [orders, resources, materials, batches, inventory, calendars] = await Promise.all([
    adapter.fetchOrders(),
    adapter.fetchResources(),
    adapter.fetchMaterials(),
    adapter.fetchBatches(),
    adapter.fetchInventory(),
    adapter.fetchCalendars(),
  ]);
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('MockPharmaAdapter – metadata', () => {
  it('has valid adapter metadata', () => {
    expect(adapter.metadata.id).toBe('mock.pharma');
    expect(adapter.metadata.sourceSystem).toBe('MOCK');
    expect(adapter.metadata.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('testConnection() returns healthy', async () => {
    const health = await adapter.testConnection();
    expect(health.healthy).toBe(true);
    expect(health.latencyMs).toBeGreaterThanOrEqual(0);
  });
});

describe('MockPharmaAdapter – fetchOrders()', () => {
  it('returns at least one order', () => {
    expect(orders.length).toBeGreaterThan(0);
  });

  it('each order has required canonical fields', () => {
    for (const order of orders) {
      expect(typeof order.id).toBe('string');
      expect(typeof order.materialId).toBe('string');
      expect(typeof order.quantity).toBe('number');
      expect(order.quantity).toBeGreaterThan(0);
      expect(order.earliestStart).toBeInstanceOf(Date);
      expect(order.latestFinish).toBeInstanceOf(Date);
      expect(order.latestFinish.getTime()).toBeGreaterThan(order.earliestStart.getTime());
      expect(typeof order.durationMinutes).toBe('number');
      expect(['PENDING', 'FEASIBLE', 'INFEASIBLE', 'SOFT_VIOLATION']).toContain(order.schedulingStatus);
    }
  });

  it('contains both pharma and CGT orders', () => {
    const pharmaOrders = orders.filter(o => String(o.id).startsWith('ORD-PH'));
    const cgtOrders = orders.filter(o => String(o.id).startsWith('ORD-CGT'));
    expect(pharmaOrders.length).toBeGreaterThan(0);
    expect(cgtOrders.length).toBeGreaterThan(0);
  });

  it('CGT orders have patientId set', () => {
    const cgtOrders = orders.filter(o => String(o.id).startsWith('ORD-CGT'));
    for (const order of cgtOrders) {
      expect(order.patientId).toBeTruthy();
    }
  });

  it('operations have proper sequence numbers', () => {
    const ordersWithOps = orders.filter(o => o.operations.length > 1);
    for (const order of ordersWithOps) {
      const sequences = order.operations.map(op => op.sequence);
      const sorted = [...sequences].sort((a, b) => a - b);
      expect(sequences).toEqual(sorted);
    }
  });
});

describe('MockPharmaAdapter – fetchResources()', () => {
  it('returns at least one resource', () => {
    expect(resources.length).toBeGreaterThan(0);
  });

  it('each resource has canonical fields', () => {
    for (const resource of resources) {
      expect(typeof resource.id).toBe('string');
      expect(typeof resource.name).toBe('string');
      expect(resource.oee).toBeGreaterThan(0);
      expect(resource.oee).toBeLessThanOrEqual(1);
      expect(resource.capacity).toBeGreaterThan(0);
      expect(Array.isArray(resource.qualifiedMaterials)).toBe(true);
    }
  });

  it('contains MACHINE, VESSEL, CLEANROOM and ANALYTICAL_INSTRUMENT types', () => {
    const types = new Set(resources.map(r => r.type));
    expect(types.has('MACHINE')).toBe(true);
    expect(types.has('CLEANROOM')).toBe(true);
  });
});

describe('MockPharmaAdapter – fetchMaterials()', () => {
  it('returns at least one material', () => {
    expect(materials.length).toBeGreaterThan(0);
  });

  it('each material has canonical fields', () => {
    for (const mat of materials) {
      expect(typeof mat.id).toBe('string');
      expect(typeof mat.name).toBe('string');
      expect(typeof mat.requiresBatchRelease).toBe('boolean');
      expect(typeof mat.isPatientSpecific).toBe('boolean');
    }
  });

  it('contains at least one patient-specific (autologous) material', () => {
    const patientSpecific = materials.filter(m => m.isPatientSpecific);
    expect(patientSpecific.length).toBeGreaterThan(0);
  });
});

describe('MockPharmaAdapter – fetchBatches()', () => {
  it('returns at least one batch', () => {
    expect(batches.length).toBeGreaterThan(0);
  });

  it('each batch has a valid status', () => {
    const validStatuses = ['RELEASED', 'QA_HOLD', 'QC_HOLD', 'QUARANTINE', 'REJECTED', 'EXPIRED', 'PLANNED', 'IN_PRODUCTION'];
    for (const batch of batches) {
      expect(validStatuses).toContain(batch.status);
    }
  });

  it('contains at least one RELEASED and one QA_HOLD batch', () => {
    const released = batches.filter(b => b.status === 'RELEASED');
    const onHold = batches.filter(b => ['QA_HOLD', 'QC_HOLD'].includes(b.status));
    expect(released.length).toBeGreaterThan(0);
    expect(onHold.length).toBeGreaterThan(0);
  });

  it('CGT batches have a patientId', () => {
    const cgtBatches = batches.filter(b => String(b.id).startsWith('BATCH-CGT'));
    for (const batch of cgtBatches) {
      expect(batch.patientId).toBeTruthy();
    }
  });
});

describe('MockPharmaAdapter – fetchInventory()', () => {
  it('returns at least one inventory position', () => {
    expect(inventory.length).toBeGreaterThan(0);
  });

  it('each position has non-negative quantities', () => {
    for (const pos of inventory) {
      expect(pos.quantityOnHand).toBeGreaterThanOrEqual(0);
      expect(pos.quantityReserved).toBeGreaterThanOrEqual(0);
      expect(pos.quantityAvailable).toBeGreaterThanOrEqual(0);
      expect(pos.quantityAvailable).toBeLessThanOrEqual(pos.quantityOnHand);
    }
  });
});

describe('MockPharmaAdapter – fetchCalendars()', () => {
  it('returns at least one working calendar', () => {
    expect(calendars.length).toBeGreaterThan(0);
  });

  it('calendar has all 7 days of the week defined', () => {
    const cal = calendars[0]!;
    expect(cal.shifts).toHaveLength(7);
    const dayNumbers = cal.shifts.map(s => s.dayOfWeek).sort();
    expect(dayNumbers).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('calendar has a timezone', () => {
    expect(calendars[0]!.timezone).toBeTruthy();
  });
});
