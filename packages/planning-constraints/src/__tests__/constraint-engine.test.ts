/**
 * Integration tests – ConstraintEngine
 *
 * Validates that the engine correctly orchestrates multiple constraint plugins,
 * aggregates results, and derives the correct scheduling status per order.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConstraintEngine } from '../engine/constraint-engine.js';
import { ConstraintRegistry } from '../registry/constraint-registry.js';
import { AtpAvailabilityConstraint } from '../constraints/atp-availability.constraint.js';
import { RemainingShelfLifeConstraint } from '../constraints/remaining-shelf-life.constraint.js';
import { ResourceCapacityConstraint } from '../constraints/resource-capacity.constraint.js';
import type { ConstraintContext } from '../interfaces/constraint.interface.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeBaseContext(): Omit<ConstraintContext, 'order' | 'siblingOrders'> {
  const now = new Date();
  return {
    resources: [
      {
        id: 'RES-001' as never,
        name: 'Granulation Line 1',
        type: 'MACHINE',
        capacity: 500,
        parallelCapacity: 1,
        oee: 0.85,
        qualifiedMaterials: ['MAT-001' as never],
        attributes: {},
      },
    ],
    batches: [
      {
        id: 'BATCH-001' as never,
        materialId: 'MAT-001' as never,
        quantity: 500,
        unit: 'KG',
        status: 'RELEASED' as const,
        expiryDate: new Date(now.getTime() + 200 * 86_400_000),
        availableFrom: now,
        attributes: {},
      },
    ],
    materials: [
      {
        id: 'MAT-001' as never,
        name: 'API-001',
        description: 'Test API',
        unit: 'KG',
        minRemainingShelfLifeDays: 90,
        requiresBatchRelease: true,
        isPatientSpecific: false,
        attributes: {},
      },
    ],
    inventory: [
      {
        materialId: 'MAT-001' as never,
        locationId: 'WH-001',
        quantityOnHand: 400,
        quantityReserved: 0,
        quantityAvailable: 400,
        unit: 'KG',
        lastUpdated: now,
      },
    ],
    evaluationTime: now,
    extensions: {},
  };
}

function makeOrder(overrides: Partial<{
  id: string;
  quantity: number;
  batchId: string;
  durationMinutes: number;
}> = {}) {
  const now = new Date();
  return {
    id: (overrides.id ?? 'ORD-001') as never,
    materialId: 'MAT-001' as never,
    batchId: (overrides.batchId ?? 'BATCH-001') as never,
    quantity: overrides.quantity ?? 100,
    unit: 'KG',
    priority: 'NORMAL' as const,
    status: 'RELEASED' as const,
    earliestStart: now,
    latestFinish: new Date(now.getTime() + 14 * 86_400_000),
    durationMinutes: overrides.durationMinutes ?? 480,
    operations: [],
    tags: {},
    schedulingStatus: 'PENDING' as const,
    metadata: {},
    createdAt: now,
    updatedAt: now,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ConstraintEngine', () => {
  let registry: ConstraintRegistry;
  let engine: ConstraintEngine;

  beforeEach(() => {
    registry = new ConstraintRegistry();
    registry.registerMany([
      new AtpAvailabilityConstraint(),
      new RemainingShelfLifeConstraint(),
      new ResourceCapacityConstraint(),
    ]);
    engine = new ConstraintEngine(registry);
  });

  it('returns FEASIBLE for a valid order that passes all constraints', async () => {
    const output = await engine.evaluate({
      orders: [makeOrder({ quantity: 100 })],
      context: makeBaseContext(),
    });

    expect(output.results).toHaveLength(1);
    expect(output.results[0].schedulingStatus).toBe('FEASIBLE');
    expect(output.summary.feasible).toBe(1);
    expect(output.summary.infeasible).toBe(0);
    expect(output.simRunId).toBeTruthy();
    expect(output.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('returns INFEASIBLE when ATP inventory is insufficient', async () => {
    const ctx = makeBaseContext();
    // Override inventory to have insufficient quantity
    const depleted = {
      ...ctx,
      inventory: [
        {
          materialId: 'MAT-001' as never,
          locationId: 'WH-001',
          quantityOnHand: 10,
          quantityReserved: 0,
          quantityAvailable: 10, // only 10, order needs 200
          unit: 'KG',
          lastUpdated: new Date(),
        },
      ],
    };

    const output = await engine.evaluate({
      orders: [makeOrder({ quantity: 200 })],
      context: depleted,
    });

    expect(output.results[0].schedulingStatus).toBe('INFEASIBLE');
    expect(output.summary.infeasible).toBe(1);
    const blockerResults = output.results[0].constraintResults.filter(r => !r.passed);
    expect(blockerResults.length).toBeGreaterThan(0);
  });

  it('processes multiple orders independently', async () => {
    const ctx = makeBaseContext();
    const orders = [
      makeOrder({ id: 'ORD-A', quantity: 50 }),
      makeOrder({ id: 'ORD-B', quantity: 50 }),
      makeOrder({ id: 'ORD-C', quantity: 50 }),
    ];

    const output = await engine.evaluate({ orders, context: ctx });

    expect(output.results).toHaveLength(3);
    expect(output.summary.totalOrders).toBe(3);
  });

  it('returns empty results for empty order list', async () => {
    const output = await engine.evaluate({ orders: [], context: makeBaseContext() });
    expect(output.results).toHaveLength(0);
    expect(output.summary.totalOrders).toBe(0);
  });

  it('evaluates only selected constraints when constraintIds is specified', async () => {
    const output = await engine.evaluate({
      orders: [makeOrder()],
      context: makeBaseContext(),
      constraintIds: ['generic.atp.availability'],
    });

    expect(output.summary.constraintsEvaluated).toBe(1);
    expect(output.results[0].constraintResults).toHaveLength(1);
    expect(output.results[0].constraintResults[0].constraintId).toBe('generic.atp.availability');
  });

  it('generates a unique simRunId for each evaluation', async () => {
    const ctx = makeBaseContext();
    const [run1, run2] = await Promise.all([
      engine.evaluate({ orders: [makeOrder()], context: ctx }),
      engine.evaluate({ orders: [makeOrder()], context: ctx }),
    ]);
    expect(run1.simRunId).not.toBe(run2.simRunId);
  });

  it('returns FEASIBLE and sets scheduledStart / scheduledFinish on feasible orders', async () => {
    const output = await engine.evaluate({
      orders: [makeOrder({ durationMinutes: 60 })],
      context: makeBaseContext(),
    });

    const result = output.results[0];
    expect(result.schedulingStatus).toBe('FEASIBLE');
    if (result.schedulingStatus === 'FEASIBLE') {
      expect(result.scheduledStart).toBeInstanceOf(Date);
      expect(result.scheduledFinish).toBeInstanceOf(Date);
    }
  });

  it('a crashing plugin does not crash the engine', async () => {
    const crashingPlugin = {
      metadata: {
        id: 'test.crashing' as never,
        version: '0.0.0',
        name: 'Crashing Plugin',
        description: 'Always crashes',
        domain: 'GENERIC' as const,
        defaultSeverity: 'BLOCKER' as const,
        validationRefs: [],
        author: 'test',
        license: 'MIT',
        tags: [],
      },
      evaluate: async () => { throw new Error('intentional crash'); },
      selfTest: async () => ({ pluginId: 'test.crashing' as never, pluginVersion: '0.0.0', passed: false, testsPassed: 0, testsFailed: 1, failedTests: [], durationMs: 0 }),
    };

    const safeRegistry = new ConstraintRegistry();
    safeRegistry.register(crashingPlugin);
    const safeEngine = new ConstraintEngine(safeRegistry);

    const output = await safeEngine.evaluate({
      orders: [makeOrder()],
      context: makeBaseContext(),
    });

    expect(output.results[0].schedulingStatus).toBe('INFEASIBLE');
    const crashResult = output.results[0].constraintResults[0];
    expect(crashResult.passed).toBe(false);
    expect(crashResult.message).toContain('Plugin crashed');
  });
});
