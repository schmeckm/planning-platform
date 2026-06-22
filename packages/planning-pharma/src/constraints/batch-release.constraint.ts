/**
 * Pharma Pack – Constraint: Batch Release Status Check
 *
 * A pharma batch MUST have QA-released status before it can be used
 * in a manufacturing or packaging operation. This is a GMP requirement.
 *
 * ID:      pharma.batch.release-status
 * Domain:  PHARMA
 * Severity: BLOCKER
 *
 * Validation References:
 *   URS-PH-001: Batch must have QA-released status before use
 *   FS-PH-010:  Batch release check against batch status field
 *   DS-PH-010:  Implementation reads BatchStatus enum from canonical model
 *   GMP-REF-001: EU GMP Annex 11 – electronic records for batch release
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
  id: asConstraintId('pharma.batch.release-status'),
  version: '1.0.0',
  name: 'Pharma Batch Release Status Check',
  description:
    'Ensures the batch assigned to this order has QA-released status (GMP requirement). ' +
    'Batches in QC_HOLD, QA_HOLD, or QUARANTINE status block scheduling.',
  domain: 'PHARMA',
  defaultSeverity: 'BLOCKER',
  validationRefs: [
    { type: 'URS', id: 'URS-PH-001', description: 'Batch must have QA-released status before use' },
    { type: 'FS',  id: 'FS-PH-010',  description: 'Batch release check against batch status field' },
    { type: 'DS',  id: 'DS-PH-010',  description: 'Implementation reads BatchStatus from canonical model' },
    { type: 'TC',  id: 'TC-PH-010-001', description: 'Test case: released batch → pass' },
    { type: 'TC',  id: 'TC-PH-010-002', description: 'Test case: QA_HOLD batch → fail' },
    { type: 'TC',  id: 'TC-PH-010-003', description: 'Test case: no batch assigned → warning' },
  ],
  documentationUrl: 'https://github.com/schmeckm/planningplatform/blob/main/open-planning-platform/docs/industries/pharma.md',
  author: 'Pharma Collective Platform Contributors',
  license: 'Apache-2.0',
  tags: ['pharma', 'batch', 'release', 'gmp', 'qa', 'blocker'],
};

const BLOCKED_STATUSES = new Set(['QC_HOLD', 'QA_HOLD', 'QUARANTINE', 'REJECTED', 'EXPIRED']);
const WARNING_STATUSES = new Set(['PLANNED', 'IN_PRODUCTION']);

export class PharmaGmpBatchReleaseConstraint implements IConstraintPlugin {
  readonly metadata = META;

  async evaluate(ctx: ConstraintContext): Promise<ConstraintEvaluationResult> {
    const { order, batches, materials } = ctx;

    const material = materials.find(m => m.id === order.materialId);

    // If the material does not require batch release, skip
    if (material && !material.requiresBatchRelease) {
      return buildPassResult(
        META,
        `Order ${order.id}: material ${order.materialId} does not require batch release. Check skipped.`,
        { materialId: order.materialId, requiresBatchRelease: false },
      );
    }

    if (!order.batchId) {
      return buildWarnResult(
        META,
        `Order ${order.id} has no batch assigned – cannot verify release status`,
        `The order requires a GMP-released batch (material ${order.materialId}), ` +
          `but no batch is currently assigned.`,
        'Assign a QA-released batch to this order before finalizing the schedule.',
        0.3,
        { materialId: order.materialId, batchId: null },
      );
    }

    const batch = batches.find(b => b.id === order.batchId);
    if (!batch) {
      return buildFailResult(
        META,
        `Batch ${order.batchId} not found`,
        `Order ${order.id} references batch ${order.batchId}, but this batch cannot be found in the system.`,
        'Verify the batch ID or reload the planning context.',
        0,
        { batchId: order.batchId },
      );
    }

    if (BLOCKED_STATUSES.has(batch.status)) {
      const statusMessages: Record<string, string> = {
        QC_HOLD: 'The batch is pending QC analysis results.',
        QA_HOLD: 'The batch is under QA investigation or deviation review.',
        QUARANTINE: 'The batch is in quarantine and not eligible for use.',
        REJECTED: 'The batch has been rejected and cannot be used.',
        EXPIRED: 'The batch has passed its expiry date.',
      };
      return buildFailResult(
        META,
        `GMP Batch Release BLOCKER: batch ${batch.id} is in status ${batch.status}`,
        `Order ${order.id} cannot be scheduled. Batch ${batch.id} (material ${order.materialId}) ` +
          `has status "${batch.status}". ${statusMessages[batch.status] ?? ''}`,
        `Wait for QA to release batch ${batch.id}, or assign a different released batch.`,
        0,
        { batchId: batch.id, batchStatus: batch.status },
      );
    }

    if (WARNING_STATUSES.has(batch.status)) {
      return buildWarnResult(
        META,
        `Batch ${batch.id} is in status ${batch.status} – release pending`,
        `Order ${order.id}: batch ${batch.id} is currently "${batch.status}". ` +
          `It is expected to be released, but release is not yet confirmed.`,
        `Monitor the batch release timeline. Ensure QA sign-off is obtained before production starts.`,
        0.5,
        { batchId: batch.id, batchStatus: batch.status },
      );
    }

    // Status is RELEASED
    return buildPassResult(
      META,
      `Order ${order.id}: GMP batch release check passed. Batch ${batch.id} status is "${batch.status}".`,
      { batchId: batch.id, batchStatus: batch.status, releaseDate: batch.releaseDate },
    );
  }

  async selfTest(): Promise<ConstraintSelfTestResult> {
    const start = Date.now();
    const tests: ConstraintSelfTestResult['failedTests'] = [];

    const cases: Array<{ name: string; status: string; expectPass: boolean }> = [
      { name: 'released-batch', status: 'RELEASED', expectPass: true },
      { name: 'qa-hold-batch', status: 'QA_HOLD', expectPass: false },
      { name: 'qc-hold-batch', status: 'QC_HOLD', expectPass: false },
      { name: 'quarantine-batch', status: 'QUARANTINE', expectPass: false },
      { name: 'rejected-batch', status: 'REJECTED', expectPass: false },
      { name: 'expired-batch', status: 'EXPIRED', expectPass: false },
    ];

    for (const tc of cases) {
      const ctx = buildCtx(tc.status as never);
      const result = await this.evaluate(ctx);
      if (result.passed !== tc.expectPass) {
        tests.push({
          name: tc.name,
          expected: `passed=${tc.expectPass}`,
          actual: `passed=${result.passed}`,
        });
      }
    }

    return {
      pluginId: META.id,
      pluginVersion: META.version,
      passed: tests.length === 0,
      testsPassed: cases.length - tests.length,
      testsFailed: tests.length,
      failedTests: tests,
      durationMs: Date.now() - start,
    };
  }
}

function buildCtx(batchStatus: 'RELEASED' | 'QA_HOLD' | 'QC_HOLD' | 'QUARANTINE' | 'REJECTED' | 'EXPIRED'): ConstraintContext {
  const now = new Date();
  return {
    order: {
      id: 'test-order-1' as never,
      materialId: 'MAT-001' as never,
      batchId: 'BATCH-001' as never,
      quantity: 100,
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
    batches: [
      {
        id: 'BATCH-001' as never,
        materialId: 'MAT-001' as never,
        quantity: 200,
        unit: 'KG',
        status: batchStatus,
        availableFrom: now,
        ...(batchStatus === 'RELEASED' ? { releaseDate: now } : {}),
        attributes: {},
      },
    ],
    materials: [
      {
        id: 'MAT-001' as never,
        name: 'Active Pharmaceutical Ingredient',
        description: 'API for test product',
        unit: 'KG',
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
