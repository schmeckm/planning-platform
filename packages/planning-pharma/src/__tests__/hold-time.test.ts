/**
 * Unit tests – PharmaHoldTimeConstraint
 *
 * GMP requirement: the time gap between consecutive operations must meet
 * validated minimum (and maximum) hold time specifications.
 */

import { describe, it, expect } from 'vitest';
import { PharmaHoldTimeConstraint } from '../constraints/hold-time.constraint.js';
import type { ConstraintContext } from '@PCP/planning-constraints';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MIN_PER_MS = 60_000;

function makeOperation(
  sequence: number,
  description: string,
  opts: {
    minLagMinutes?: number;
    maxLagMinutes?: number;
    scheduledFinish?: Date;
    scheduledStart?: Date;
  } = {},
) {
  return {
    id: `OP-${sequence}` as never,
    orderId: 'ORD-HT-001' as never,
    sequence,
    type: 'RUN' as const,
    description,
    durationMinutes: 60,
    setupMinutes: 0,
    teardownMinutes: 0,
    minLagMinutes: opts.minLagMinutes ?? 0,
    ...(opts.maxLagMinutes !== undefined ? { maxLagMinutes: opts.maxLagMinutes } : {}),
    ...(opts.scheduledFinish ? { scheduledFinish: opts.scheduledFinish } : {}),
    ...(opts.scheduledStart ? { scheduledStart: opts.scheduledStart } : {}),
  };
}

function buildCtx(operations: ReturnType<typeof makeOperation>[]): ConstraintContext {
  const now = new Date();
  return {
    order: {
      id: 'ORD-HT-001' as never,
      materialId: 'MAT-001' as never,
      quantity: 100,
      unit: 'KG',
      priority: 'NORMAL',
      status: 'RELEASED',
      earliestStart: now,
      latestFinish: new Date(now.getTime() + 7 * 86_400_000),
      durationMinutes: 480,
      operations,
      tags: {},
      schedulingStatus: 'PENDING',
      metadata: {},
      createdAt: now,
      updatedAt: now,
    },
    resources: [],
    batches: [],
    materials: [],
    inventory: [],
    siblingOrders: [],
    evaluationTime: now,
    extensions: {},
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('PharmaHoldTimeConstraint', () => {
  const constraint = new PharmaHoldTimeConstraint();

  it('has correct metadata', () => {
    expect(constraint.metadata.id).toBe('pharma.operation.hold-time');
    expect(constraint.metadata.domain).toBe('PHARMA');
    expect(constraint.metadata.defaultSeverity).toBe('BLOCKER');
  });

  it('passes (skipped) when order has fewer than 2 operations', async () => {
    const result = await constraint.evaluate(buildCtx([]));
    expect(result.passed).toBe(true);
    expect(result.detail).toMatchObject({ operationCount: 0 });
  });

  it('passes (skipped) when operations are not yet scheduled', async () => {
    const now = new Date();
    const ops = [
      makeOperation(10, 'Granulation', { minLagMinutes: 60 }),
      makeOperation(20, 'Drying'),
    ];
    const result = await constraint.evaluate(buildCtx(ops));
    expect(result.passed).toBe(true);
  });

  it('passes when gap between operations meets minimum hold time', async () => {
    const now = new Date();
    const finish = new Date(now.getTime() + 60 * MIN_PER_MS);
    const nextStart = new Date(finish.getTime() + 90 * MIN_PER_MS); // 90 min gap, min is 60

    const ops = [
      makeOperation(10, 'Granulation', { minLagMinutes: 60, scheduledFinish: finish }),
      makeOperation(20, 'Drying', { scheduledStart: nextStart }),
    ];
    const result = await constraint.evaluate(buildCtx(ops));
    expect(result.passed).toBe(true);
  });

  it('fails when gap between operations is shorter than minimum hold time', async () => {
    const now = new Date();
    const finish = new Date(now.getTime() + 60 * MIN_PER_MS);
    const nextStart = new Date(finish.getTime() + 30 * MIN_PER_MS); // only 30 min, min is 60

    const ops = [
      makeOperation(10, 'Granulation', { minLagMinutes: 60, scheduledFinish: finish }),
      makeOperation(20, 'Drying', { scheduledStart: nextStart }),
    ];
    const result = await constraint.evaluate(buildCtx(ops));
    expect(result.passed).toBe(false);
    expect(result.severity).toBe('BLOCKER');
    expect(result.message).toContain('Hold time violation');
  });

  it('fails when gap exceeds the maximum allowed hold time', async () => {
    const now = new Date();
    const finish = new Date(now.getTime() + 60 * MIN_PER_MS);
    const nextStart = new Date(finish.getTime() + 600 * MIN_PER_MS); // 600 min, max is 480

    const ops = [
      makeOperation(10, 'Granulation', {
        minLagMinutes: 60,
        maxLagMinutes: 480,
        scheduledFinish: finish,
      }),
      makeOperation(20, 'Drying', { scheduledStart: nextStart }),
    ];
    const result = await constraint.evaluate(buildCtx(ops));
    expect(result.passed).toBe(false);
    expect(result.message).toContain('max');
  });

  it('passes built-in selfTest()', async () => {
    const selfTestResult = await constraint.selfTest();
    expect(selfTestResult.passed).toBe(true);
    expect(selfTestResult.testsFailed).toBe(0);
  });
});
