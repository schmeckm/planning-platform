/**
 * CGT Pack – Courier / shipment window
 *
 * ID: cgt.logistics.courier-window
 */

import type { ConstraintEvaluationResult } from '@PCP/planning-core';
import { asConstraintId } from '@PCP/planning-core';
import type {
  IConstraintPlugin,
  ConstraintContext,
  ConstraintMetadata,
  ConstraintSelfTestResult,
} from '@PCP/planning-constraints';
import { buildPassResult, buildFailResult, buildWarnResult } from '@PCP/planning-constraints';

const META: ConstraintMetadata = {
  id: asConstraintId('cgt.logistics.courier-window'),
  version: '1.0.0',
  name: 'Courier Shipment Window Check',
  description:
    'Verifies that scheduled finish allows handover to courier within the validated pickup window.',
  domain: 'CGT',
  defaultSeverity: 'BLOCKER',
  validationRefs: [
    { type: 'URS', id: 'URS-CGT-004', description: 'Vein-to-vein includes courier pickup window' },
    { type: 'FS', id: 'FS-CGT-040', description: 'Compare scheduledFinish vs courierPickupLatest' },
  ],
  author: 'Pharma Collective Platform Contributors',
  license: 'Apache-2.0',
  tags: ['cgt', 'courier', 'logistics', 'shipment'],
};

function parseDate(value: unknown): Date | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  if (typeof value === 'string' && value.length > 0) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

export class CgtCourierWindowConstraint implements IConstraintPlugin {
  readonly metadata = META;

  async evaluate(ctx: ConstraintContext): Promise<ConstraintEvaluationResult> {
    const { order } = ctx;
    const pickupLatest = parseDate(order.metadata['courierPickupLatest']);
    const pickupEarliest = parseDate(order.metadata['courierPickupEarliest']);

    if (!pickupLatest && !pickupEarliest) {
      return buildPassResult(
        META,
        `Order ${order.id}: no courier window in metadata — check skipped.`,
        { courierWindowConfigured: false },
      );
    }

    const finish =
      order.scheduledFinish ??
      new Date(order.earliestStart.getTime() + order.durationMinutes * 60_000);

    if (pickupLatest && finish.getTime() > pickupLatest.getTime()) {
      return buildFailResult(
        META,
        `Courier window missed: finish after latest pickup ${pickupLatest.toISOString()}`,
        `Order ${order.id} scheduled finish ${finish.toISOString()} is after courier pickup deadline ` +
          `${pickupLatest.toISOString()}.`,
        'Reschedule earlier or book a later courier slot.',
        0,
        { scheduledFinish: finish.toISOString(), courierPickupLatest: pickupLatest.toISOString() },
      );
    }

    if (pickupEarliest && finish.getTime() < pickupEarliest.getTime()) {
      return buildWarnResult(
        META,
        `Finish before courier earliest pickup ${pickupEarliest.toISOString()}`,
        `Order ${order.id} finishes before the courier earliest pickup window — product may wait in controlled storage.`,
        'Align finish time with courier slot or add qualified storage hold.',
        0.7,
        { scheduledFinish: finish.toISOString(), courierPickupEarliest: pickupEarliest.toISOString() },
      );
    }

    return buildPassResult(
      META,
      `Order ${order.id}: finish ${finish.toISOString()} within courier window.`,
      {
        scheduledFinish: finish.toISOString(),
        ...(pickupEarliest ? { courierPickupEarliest: pickupEarliest.toISOString() } : {}),
        ...(pickupLatest ? { courierPickupLatest: pickupLatest.toISOString() } : {}),
      },
    );
  }

  async selfTest(): Promise<ConstraintSelfTestResult> {
    const start = Date.now();
    const now = new Date();
    const failedTests: ConstraintSelfTestResult['failedTests'] = [];

    const mk = (finishOffsetMin: number, pickupLatestOffsetMin: number): ConstraintContext => ({
      order: {
        id: 'ORD-COURIER' as never,
        materialId: 'MAT-CGT' as never,
        quantity: 1,
        unit: 'DOSE',
        priority: 'CRITICAL',
        status: 'RELEASED',
        earliestStart: now,
        latestFinish: new Date(now.getTime() + 86_400_000),
        durationMinutes: finishOffsetMin,
        scheduledFinish: new Date(now.getTime() + finishOffsetMin * 60_000),
        operations: [],
        tags: {},
        schedulingStatus: 'PENDING',
        metadata: {
          courierPickupLatest: new Date(now.getTime() + pickupLatestOffsetMin * 60_000).toISOString(),
        },
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
    });

    const pass = await this.evaluate(mk(60, 120));
    if (!pass.passed) {
      failedTests.push({ name: 'within-window', expected: 'pass', actual: 'fail' });
    }

    const fail = await this.evaluate(mk(180, 120));
    if (fail.passed) {
      failedTests.push({ name: 'missed-window', expected: 'fail', actual: 'pass' });
    }

    return {
      pluginId: META.id,
      pluginVersion: META.version,
      passed: failedTests.length === 0,
      testsPassed: 2 - failedTests.length,
      testsFailed: failedTests.length,
      failedTests,
      durationMs: Date.now() - start,
    };
  }
}
