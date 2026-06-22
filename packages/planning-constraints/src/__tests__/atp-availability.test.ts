/**
 * Unit tests – AtpAvailabilityConstraint
 *
 * Tests that the ATP check correctly blocks scheduling when material
 * inventory is insufficient and passes when inventory covers the order.
 */

import { describe, it, expect } from 'vitest';
import { AtpAvailabilityConstraint } from '../constraints/atp-availability.constraint.js';
import type { ConstraintContext } from '../interfaces/constraint.interface.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildCtx(required: number, available: number, noPosition = false): ConstraintContext {
  const now = new Date();
  return {
    order: {
      id: 'ORD-TEST-001' as never,
      materialId: 'MAT-001' as never,
      quantity: required,
      unit: 'KG',
      priority: 'NORMAL',
      status: 'RELEASED',
      earliestStart: now,
      latestFinish: new Date(now.getTime() + 86_400_000),
      durationMinutes: 60,
      operations: [],
      tags: {},
      schedulingStatus: 'PENDING',
      metadata: {},
      createdAt: now,
      updatedAt: now,
    },
    resources: [],
    batches: [],
    materials: [],
    inventory: noPosition
      ? []
      : [
          {
            materialId: 'MAT-001' as never,
            locationId: 'WH-001',
            quantityOnHand: available,
            quantityReserved: 0,
            quantityAvailable: available,
            unit: 'KG',
            lastUpdated: now,
          },
        ],
    siblingOrders: [],
    evaluationTime: now,
    extensions: {},
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AtpAvailabilityConstraint', () => {
  const constraint = new AtpAvailabilityConstraint();

  it('has correct metadata', () => {
    expect(constraint.metadata.id).toBe('generic.atp.availability');
    expect(constraint.metadata.domain).toBe('GENERIC');
    expect(constraint.metadata.defaultSeverity).toBe('BLOCKER');
    expect(constraint.metadata.license).toBe('Apache-2.0');
  });

  it('passes when available quantity exceeds required quantity', async () => {
    const result = await constraint.evaluate(buildCtx(100, 150));
    expect(result.passed).toBe(true);
    expect(result.score).toBe(1);
  });

  it('passes when available quantity exactly equals required quantity', async () => {
    const result = await constraint.evaluate(buildCtx(100, 100));
    expect(result.passed).toBe(true);
  });

  it('fails when available quantity is less than required', async () => {
    const result = await constraint.evaluate(buildCtx(100, 50));
    expect(result.passed).toBe(false);
    expect(result.severity).toBe('BLOCKER');
    expect(result.score).toBeCloseTo(0.5);
    expect(result.detail).toMatchObject({ shortage: 50 });
  });

  it('fails when no inventory position exists for the material', async () => {
    const result = await constraint.evaluate(buildCtx(100, 0, true));
    expect(result.passed).toBe(false);
    expect(result.severity).toBe('BLOCKER');
    expect(result.score).toBe(0);
  });

  it('passes built-in selfTest()', async () => {
    const selfTestResult = await constraint.selfTest();
    expect(selfTestResult.passed).toBe(true);
    expect(selfTestResult.testsFailed).toBe(0);
    expect(selfTestResult.testsPassed).toBeGreaterThan(0);
    expect(selfTestResult.pluginId).toBe(constraint.metadata.id);
  });

  it('includes validation references', () => {
    const refs = constraint.metadata.validationRefs;
    expect(refs.length).toBeGreaterThan(0);
    const urs = refs.find(r => r.type === 'URS');
    expect(urs).toBeDefined();
  });
});
