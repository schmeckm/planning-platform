/**
 * Unit tests – RemainingShelfLifeConstraint (RMSL)
 *
 * Verifies correct blocking when a batch will be expired or near-expired
 * at the point of use, and correct pass-through for compliant scenarios.
 */

import { describe, it, expect } from 'vitest';
import { RemainingShelfLifeConstraint } from '../constraints/remaining-shelf-life.constraint.js';
import type { ConstraintContext } from '../interfaces/constraint.interface.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MS_PER_DAY = 86_400_000;

function buildCtx(options: {
  batchId?: string;
  minRSLDays?: number;
  expiryOffsetDays?: number;
  scheduledStartOffsetDays?: number;
}): ConstraintContext {
  const now = new Date();
  const { batchId, minRSLDays = 30, expiryOffsetDays, scheduledStartOffsetDays } = options;

  return {
    order: {
      id: 'ORD-RMSL-001' as never,
      materialId: 'MAT-001' as never,
      batchId: batchId as never,
      quantity: 10,
      unit: 'KG',
      priority: 'NORMAL',
      status: 'RELEASED',
      earliestStart: scheduledStartOffsetDays !== undefined
        ? new Date(now.getTime() + scheduledStartOffsetDays * MS_PER_DAY)
        : now,
      latestFinish: new Date(now.getTime() + 60 * MS_PER_DAY),
      durationMinutes: 60,
      operations: [],
      tags: {},
      schedulingStatus: 'PENDING',
      metadata: {},
      createdAt: now,
      updatedAt: now,
    },
    resources: [],
    batches: batchId
      ? [
          {
            id: batchId as never,
            materialId: 'MAT-001' as never,
            quantity: 100,
            unit: 'KG',
            status: 'RELEASED' as const,
            availableFrom: now,
            ...(expiryOffsetDays !== undefined
              ? { expiryDate: new Date(now.getTime() + expiryOffsetDays * MS_PER_DAY) }
              : {}),
            attributes: {},
          },
        ]
      : [],
    materials: minRSLDays !== undefined
      ? [
          {
            id: 'MAT-001' as never,
            name: 'Test Material',
            description: 'Test',
            unit: 'KG',
            minRemainingShelfLifeDays: minRSLDays,
            requiresBatchRelease: true,
            isPatientSpecific: false,
            attributes: {},
          },
        ]
      : [],
    inventory: [],
    siblingOrders: [],
    evaluationTime: now,
    extensions: {},
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('RemainingShelfLifeConstraint', () => {
  const constraint = new RemainingShelfLifeConstraint();

  it('has correct metadata', () => {
    expect(constraint.metadata.id).toBe('generic.batch.remaining-shelf-life');
    expect(constraint.metadata.domain).toBe('GENERIC');
    expect(constraint.metadata.defaultSeverity).toBe('BLOCKER');
  });

  it('passes (skipped) when no batch is assigned to the order', async () => {
    const result = await constraint.evaluate(buildCtx({ batchId: undefined }));
    expect(result.passed).toBe(true);
    expect(result.detail).toMatchObject({ skipped: true });
  });

  it('passes when remaining shelf life exceeds minimum by a comfortable margin', async () => {
    // expiry in 90 days, min is 30 days → 60 days remaining > 30 min
    const result = await constraint.evaluate(
      buildCtx({ batchId: 'BATCH-001', minRSLDays: 30, expiryOffsetDays: 90 }),
    );
    expect(result.passed).toBe(true);
    expect(result.score).toBe(1);
  });

  it('fails when remaining shelf life is below minimum required', async () => {
    // expiry in 5 days, min is 30 days → 5 < 30 → BLOCKER
    const result = await constraint.evaluate(
      buildCtx({ batchId: 'BATCH-001', minRSLDays: 30, expiryOffsetDays: 5 }),
    );
    expect(result.passed).toBe(false);
    expect(result.severity).toBe('BLOCKER');
    expect(result.detail).toMatchObject({ remainingDays: expect.any(Number), minRSLDays: 30 });
  });

  it('warns when remaining shelf life is within warning buffer (min < rsl < min+7)', async () => {
    // expiry in 33 days, min is 30 days → 33 > 30 but < 30+7 → WARNING
    const result = await constraint.evaluate(
      buildCtx({ batchId: 'BATCH-001', minRSLDays: 30, expiryOffsetDays: 33 }),
    );
    expect(result.passed).toBe(true); // warnings don't block
    expect(result.severity).toBe('WARNING');
  });

  it('fails when batch will be expired at point of use (no minRSL on material)', async () => {
    // expiry in -1 days (already expired), no minRSL required
    const result = await constraint.evaluate(
      buildCtx({ batchId: 'BATCH-001', minRSLDays: undefined as never, expiryOffsetDays: -1 }),
    );
    expect(result.passed).toBe(false);
  });

  it('passes when batch has no expiry date configured', async () => {
    // No expiryDate on batch → skip
    const result = await constraint.evaluate(
      buildCtx({ batchId: 'BATCH-001', minRSLDays: 30 }), // no expiryOffsetDays
    );
    expect(result.passed).toBe(true);
    expect(result.detail).toMatchObject({ skipped: true });
  });

  it('passes built-in selfTest()', async () => {
    const selfTestResult = await constraint.selfTest();
    expect(selfTestResult.passed).toBe(true);
    expect(selfTestResult.testsFailed).toBe(0);
  });
});
