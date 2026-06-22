/**
 * Pharma Pack – Constraint: Hold Time Check
 *
 * After certain operations (e.g., dispensing, granulation), material must be
 * held for a minimum time before the next step. If the scheduled gap between
 * operations is shorter than the required hold time, scheduling is blocked.
 *
 * ID:      pharma.operation.hold-time
 * Domain:  PHARMA
 * Severity: BLOCKER
 *
 * Validation References:
 *   URS-PH-002: System shall enforce validated hold times between operations
 *   FS-PH-020:  Hold time check compares inter-operation gap vs. process specification
 */

import type { ConstraintEvaluationResult } from '@PCP/planning-core';
import { asConstraintId } from '@PCP/planning-core';
import type {
  IConstraintPlugin,
  ConstraintContext,
  ConstraintMetadata,
  ConstraintSelfTestResult,
} from '@PCP/planning-constraints';
import { buildPassResult, buildFailResult } from '@PCP/planning-constraints';

const META: ConstraintMetadata = {
  id: asConstraintId('pharma.operation.hold-time'),
  version: '1.0.0',
  name: 'Hold Time Check',
  description:
    'Verifies that the scheduled time gap between consecutive operations meets ' +
    'the validated minimum and maximum hold time requirements.',
  domain: 'PHARMA',
  defaultSeverity: 'BLOCKER',
  validationRefs: [
    { type: 'URS', id: 'URS-PH-002', description: 'Enforce validated hold times between operations' },
    { type: 'FS',  id: 'FS-PH-020',  description: 'Hold time check vs. process specification' },
  ],
  documentationUrl: 'https://github.com/schmeckm/planningplatform/blob/main/open-planning-platform/docs/industries/pharma.md',
  author: 'Pharma Collective Platform Contributors',
  license: 'Apache-2.0',
  tags: ['pharma', 'hold-time', 'operations', 'gmp'],
};

export class PharmaHoldTimeConstraint implements IConstraintPlugin {
  readonly metadata = META;

  async evaluate(ctx: ConstraintContext): Promise<ConstraintEvaluationResult> {
    const { order } = ctx;
    const ops = [...order.operations].sort((a, b) => a.sequence - b.sequence);

    if (ops.length < 2) {
      return buildPassResult(META, `Order ${order.id}: fewer than 2 operations, hold-time check skipped.`, {
        operationCount: ops.length,
      });
    }

    for (let i = 0; i < ops.length - 1; i++) {
      const current = ops[i]!;
      const next = ops[i + 1]!;

      if (!current.scheduledFinish || !next.scheduledStart) {
        continue; // Operations not yet scheduled – skip
      }

      const actualGapMinutes =
        (next.scheduledStart.getTime() - current.scheduledFinish.getTime()) / 60_000;

      if (actualGapMinutes < current.minLagMinutes) {
        return buildFailResult(
          META,
          `Hold time violation between op ${current.sequence} → ${next.sequence}: ` +
            `gap is ${actualGapMinutes.toFixed(0)} min, minimum is ${current.minLagMinutes} min`,
          `Order ${order.id}: the gap between operation "${current.description}" (step ${current.sequence}) ` +
            `and "${next.description}" (step ${next.sequence}) is ${actualGapMinutes.toFixed(0)} minutes. ` +
            `The validated minimum hold time is ${current.minLagMinutes} minutes.`,
          `Reschedule operation ${next.sequence} to start at least ${current.minLagMinutes} minutes ` +
            `after step ${current.sequence} finishes. Adjust start time by at least ` +
            `${(current.minLagMinutes - actualGapMinutes).toFixed(0)} minutes.`,
          0,
          {
            fromOperation: current.id,
            toOperation: next.id,
            actualGapMinutes,
            minLagMinutes: current.minLagMinutes,
            violation: current.minLagMinutes - actualGapMinutes,
          },
        );
      }

      if (current.maxLagMinutes !== undefined && actualGapMinutes > current.maxLagMinutes) {
        return buildFailResult(
          META,
          `Maximum hold time exceeded between op ${current.sequence} → ${next.sequence}: ` +
            `gap is ${actualGapMinutes.toFixed(0)} min, maximum is ${current.maxLagMinutes} min`,
          `Order ${order.id}: the gap between operation "${current.description}" and "${next.description}" ` +
            `is ${actualGapMinutes.toFixed(0)} minutes, exceeding the maximum hold time of ${current.maxLagMinutes} minutes. ` +
            `Exceeding this limit may violate the validated process specification.`,
          `Schedule step ${next.sequence} earlier, or review the process hold time specification.`,
          0,
          {
            fromOperation: current.id,
            toOperation: next.id,
            actualGapMinutes,
            maxLagMinutes: current.maxLagMinutes,
            excess: actualGapMinutes - current.maxLagMinutes,
          },
        );
      }
    }

    return buildPassResult(
      META,
      `Order ${order.id}: all inter-operation hold times are within specification.`,
      { operationCount: ops.length },
    );
  }

  async selfTest(): Promise<ConstraintSelfTestResult> {
    const start = Date.now();
    const tests: ConstraintSelfTestResult['failedTests'] = [];
    const now = new Date();

    // Test 1: Single op → pass (skipped)
    const r1 = await this.evaluate(buildCtx(1, 60, now));
    if (!r1.passed) tests.push({ name: 'single-op-skip', expected: 'passed=true', actual: 'passed=false' });

    // Test 2: Two ops with sufficient gap → pass
    const r2 = await this.evaluate(buildCtx(2, 120, now));
    if (!r2.passed) tests.push({ name: 'sufficient-gap', expected: 'passed=true', actual: 'passed=false' });

    // Test 3: Two ops with insufficient gap → fail
    const r3 = await this.evaluate(buildCtx(2, 5, now));
    if (r3.passed) tests.push({ name: 'insufficient-gap', expected: 'passed=false', actual: 'passed=true' });

    return {
      pluginId: META.id,
      pluginVersion: META.version,
      passed: tests.length === 0,
      testsPassed: 3 - tests.length,
      testsFailed: tests.length,
      failedTests: tests,
      durationMs: Date.now() - start,
    };
  }
}

function buildCtx(numOps: number, gapMinutes: number, now: Date): ConstraintContext {
  // Build ops sequentially so each op starts exactly gapMinutes after the previous one finishes.
  let cursor = now.getTime();
  const ops = Array.from({ length: numOps }, (_, i) => {
    const opStart = new Date(cursor);
    const opFinish = new Date(cursor + 60 * 60_000);
    cursor = opFinish.getTime() + gapMinutes * 60_000;
    return {
      id: `OP-00${i + 1}` as never,
      orderId: 'test-order-1' as never,
      sequence: i + 1,
      type: i === 0 ? ('RUN' as const) : ('HOLD' as const),
      description: i === 0 ? 'Granulation' : 'Drying',
      durationMinutes: 60,
      setupMinutes: 10,
      teardownMinutes: 10,
      minLagMinutes: 30,
      scheduledStart: opStart,
      scheduledFinish: opFinish,
    };
  });

  return {
    order: {
      id: 'test-order-1' as never,
      materialId: 'MAT-001' as never,
      quantity: 100,
      unit: 'KG',
      priority: 'NORMAL',
      status: 'RELEASED',
      earliestStart: now,
      latestFinish: new Date(now.getTime() + 86_400_000 * 3),
      durationMinutes: 120,
      operations: ops,
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
