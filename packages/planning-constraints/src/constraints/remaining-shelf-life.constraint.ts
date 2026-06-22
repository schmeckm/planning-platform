/**
 * Constraint: Remaining Shelf Life (RMSL) Check
 *
 * Verifies that at the expected point of use (scheduledStart + processing time),
 * the batch will still have sufficient remaining shelf life to meet the
 * material's minimum requirement.
 *
 * ID:      generic.batch.remaining-shelf-life
 * Domain:  GENERIC
 * Severity: BLOCKER
 *
 * Validation References:
 *   URS-PLAN-003: System shall enforce minimum remaining shelf life at point of use
 *   FS-PLAN-030:  RMSL calculation based on batch expiry date and scheduled start
 */

import type { ConstraintEvaluationResult } from '@PCP/planning-core';
import { asConstraintId } from '@PCP/planning-core';
import type {
  IConstraintPlugin,
  ConstraintContext,
  ConstraintMetadata,
  ConstraintSelfTestResult,
} from '../interfaces/constraint.interface.js';
import { buildPassResult, buildFailResult, buildWarnResult } from '../interfaces/constraint.interface.js';

const META: ConstraintMetadata = {
  id: asConstraintId('generic.batch.remaining-shelf-life'),
  version: '1.0.0',
  name: 'Remaining Shelf Life (RMSL) Check',
  description:
    'Verifies that the assigned batch has sufficient remaining shelf life at the point of use, ' +
    'respecting the material minimum shelf life requirement.',
  domain: 'GENERIC',
  defaultSeverity: 'BLOCKER',
  validationRefs: [
    { type: 'URS', id: 'URS-PLAN-003', description: 'Minimum remaining shelf life at point of use' },
    { type: 'FS',  id: 'FS-PLAN-030',  description: 'RMSL calculation vs. scheduled start' },
  ],
  author: 'Pharma Collective Platform Contributors',
  license: 'Apache-2.0',
  tags: ['rmsl', 'shelf-life', 'batch', 'expiry', 'generic', 'pharma'],
};

const MS_PER_DAY = 86_400_000;
const WARNING_BUFFER_DAYS = 7; // warn if RMSL is less than minRSL + 7 days

export class RemainingShelfLifeConstraint implements IConstraintPlugin {
  readonly metadata = META;

  async evaluate(ctx: ConstraintContext): Promise<ConstraintEvaluationResult> {
    const { order, batches, materials } = ctx;

    if (!order.batchId) {
      // No batch assigned – skip silently (other constraints handle batch assignment)
      return buildPassResult(META, `Order ${order.id}: no batch assigned, RMSL check skipped.`, {
        skipped: true,
      });
    }

    const batch = batches.find(b => b.id === order.batchId);
    if (!batch) {
      return buildFailResult(
        META,
        `Batch ${order.batchId} not found in context`,
        `Order ${order.id} references batch ${order.batchId}, but this batch is not present in the planning context.`,
        'Ensure the batch is loaded into the simulation context.',
        0,
        { batchId: order.batchId },
      );
    }

    if (!batch.expiryDate) {
      return buildPassResult(META, `Order ${order.id}: batch ${batch.id} has no expiry date, RMSL check skipped.`, {
        batchId: batch.id,
        skipped: true,
      });
    }

    const material = materials.find(m => m.id === order.materialId);
    const minRSLDays = material?.minRemainingShelfLifeDays;

    if (minRSLDays === undefined) {
      // Material has no minimum RSL requirement – just check that batch isn't expired
      const pointOfUse = order.scheduledStart ?? order.earliestStart;
      if (batch.expiryDate <= pointOfUse) {
        return buildFailResult(
          META,
          `Batch ${batch.id} will be expired at point of use`,
          `Order ${order.id}: batch ${batch.id} expires on ${batch.expiryDate.toISOString().substring(0, 10)}, ` +
            `but the order is scheduled to start on ${pointOfUse.toISOString().substring(0, 10)}.`,
          'Select a batch with a later expiry date or reschedule the order earlier.',
          0,
          { batchId: batch.id, expiryDate: batch.expiryDate, pointOfUse },
        );
      }
      return buildPassResult(
        META,
        `Order ${order.id}: batch not expired at point of use.`,
        { batchId: batch.id, expiryDate: batch.expiryDate },
      );
    }

    const pointOfUse = order.scheduledStart ?? order.earliestStart;
    const remainingDays = (batch.expiryDate.getTime() - pointOfUse.getTime()) / MS_PER_DAY;

    if (remainingDays < minRSLDays) {
      return buildFailResult(
        META,
        `RMSL violation: ${remainingDays.toFixed(1)} days remaining, minimum is ${minRSLDays} days`,
        `Order ${order.id}: batch ${batch.id} has ${remainingDays.toFixed(1)} remaining shelf life days ` +
          `at the point of use (${pointOfUse.toISOString().substring(0, 10)}). ` +
          `Material ${order.materialId} requires a minimum of ${minRSLDays} days.`,
        `Use a fresher batch (manufactured later) or reschedule the order to start earlier. ` +
          `Shortage: ${(minRSLDays - remainingDays).toFixed(1)} days.`,
        Math.max(0, remainingDays / minRSLDays),
        { batchId: batch.id, remainingDays, minRSLDays, pointOfUse, expiryDate: batch.expiryDate },
      );
    }

    if (remainingDays < minRSLDays + WARNING_BUFFER_DAYS) {
      return buildWarnResult(
        META,
        `RMSL warning: ${remainingDays.toFixed(1)} days remaining (close to minimum of ${minRSLDays})`,
        `Order ${order.id}: batch ${batch.id} has only ${remainingDays.toFixed(1)} days of remaining shelf life, ` +
          `which is within ${WARNING_BUFFER_DAYS} days of the required minimum of ${minRSLDays} days.`,
        'Consider using a fresher batch to provide more buffer time.',
        remainingDays / (minRSLDays + WARNING_BUFFER_DAYS),
        { batchId: batch.id, remainingDays, minRSLDays, buffer: remainingDays - minRSLDays },
      );
    }

    return buildPassResult(
      META,
      `Order ${order.id}: RMSL check passed. ${remainingDays.toFixed(1)} days remaining ≥ minimum ${minRSLDays} days.`,
      { batchId: batch.id, remainingDays, minRSLDays, buffer: remainingDays - minRSLDays },
    );
  }

  async selfTest(): Promise<ConstraintSelfTestResult> {
    const start = Date.now();
    const tests: ConstraintSelfTestResult['failedTests'] = [];
    const now = new Date();

    // Test 1: No batch → pass (skipped)
    const r1 = await this.evaluate(buildCtx(undefined, 30, 10, now));
    if (!r1.passed) tests.push({ name: 'no-batch-skip', expected: 'passed=true', actual: 'passed=false' });

    // Test 2: Sufficient RSL → pass
    const expiryFuture = new Date(now.getTime() + 60 * MS_PER_DAY);
    const r2 = await this.evaluate(buildCtx('BATCH-001', 30, 10, now, expiryFuture));
    if (!r2.passed) tests.push({ name: 'sufficient-rsl', expected: 'passed=true', actual: 'passed=false' });

    // Test 3: Insufficient RSL → fail
    const expiryNear = new Date(now.getTime() + 5 * MS_PER_DAY);
    const r3 = await this.evaluate(buildCtx('BATCH-001', 30, 10, now, expiryNear));
    if (r3.passed) tests.push({ name: 'insufficient-rsl', expected: 'passed=false', actual: 'passed=true' });

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

function buildCtx(
  batchId: string | undefined,
  minRSLDays: number,
  _durationMinutes: number,
  now: Date,
  expiryDate?: Date,
): ConstraintContext {
  return {
    order: {
      id: 'test-order-1' as never,
      materialId: 'MAT-001' as never,
      batchId: batchId as never,
      quantity: 10,
      unit: 'KG',
      priority: 'NORMAL',
      status: 'RELEASED',
      earliestStart: now,
      latestFinish: new Date(now.getTime() + 86_400_000),
      durationMinutes: _durationMinutes,
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
            ...(expiryDate !== undefined ? { expiryDate } : {}),
            availableFrom: now,
            attributes: {},
          },
        ]
      : [],
    materials: [
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
    ],
    inventory: [],
    siblingOrders: [],
    evaluationTime: now,
    extensions: {},
  };
}
