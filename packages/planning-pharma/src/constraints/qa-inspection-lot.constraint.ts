/**
 * Pharma Pack – QA inspection lot status
 *
 * ID: pharma.qa.inspection-lot
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
import { resolveInspectionLotStatus } from '../constraint-helpers.js';

const META: ConstraintMetadata = {
  id: asConstraintId('pharma.qa.inspection-lot'),
  version: '1.0.0',
  name: 'QA Inspection Lot Status Check',
  description:
    'Blocks scheduling when the QM inspection lot for the assigned batch is still open or rejected.',
  domain: 'PHARMA',
  defaultSeverity: 'BLOCKER',
  validationRefs: [
    { type: 'URS', id: 'URS-PH-012', description: 'Inspection lot must be released before use' },
    { type: 'FS', id: 'FS-PH-060', description: 'Map inspectionLotStatus on batch' },
  ],
  author: 'Pharma Collective Platform Contributors',
  license: 'Apache-2.0',
  tags: ['pharma', 'qa', 'inspection-lot', 'qm'],
};

export class PharmaQaInspectionLotConstraint implements IConstraintPlugin {
  readonly metadata = META;

  async evaluate(ctx: ConstraintContext): Promise<ConstraintEvaluationResult> {
    const { order, batches, materials } = ctx;
    const material = materials.find(m => m.id === order.materialId);

    if (material && !material.requiresBatchRelease) {
      return buildPassResult(
        META,
        `Order ${order.id}: material does not require batch release — inspection lot check skipped.`,
        { materialId: order.materialId },
      );
    }

    if (!order.batchId) {
      return buildPassResult(
        META,
        `Order ${order.id}: no batch assigned — inspection lot check deferred.`,
        { batchId: null },
      );
    }

    const batch = batches.find(b => b.id === order.batchId);
    if (!batch) {
      return buildFailResult(
        META,
        `Inspection lot check failed: batch ${order.batchId} not found`,
        `Order ${order.id} references batch ${order.batchId} which is missing from the planning snapshot.`,
        'Reload planning data or assign a valid batch.',
        0,
        { batchId: order.batchId },
      );
    }

    const lotStatus = resolveInspectionLotStatus(batch);
    if (!lotStatus || lotStatus === 'SKIPPED') {
      return buildPassResult(
        META,
        `Order ${order.id}: inspection lot check skipped for batch ${batch.id}.`,
        { batchId: batch.id, inspectionLotStatus: lotStatus ?? 'SKIPPED' },
      );
    }

    if (lotStatus === 'RELEASED') {
      return buildPassResult(
        META,
        `Order ${order.id}: inspection lot released for batch ${batch.id}.`,
        { batchId: batch.id, inspectionLotStatus: lotStatus },
      );
    }

    if (lotStatus === 'REJECTED') {
      return buildFailResult(
        META,
        `Inspection lot REJECTED for batch ${batch.id}`,
        `Order ${order.id} cannot be scheduled. QM rejected inspection lot for batch ${batch.id}.`,
        'Assign a different released batch or close the quality deviation.',
        0,
        { batchId: batch.id, inspectionLotStatus: lotStatus },
      );
    }

    return buildFailResult(
      META,
      `Inspection lot OPEN for batch ${batch.id}`,
      `Order ${order.id} cannot be scheduled until QM releases inspection lot for batch ${batch.id}.`,
      'Wait for QC/QA results or assign a batch with released inspection lot.',
      0,
      { batchId: batch.id, inspectionLotStatus: lotStatus },
    );
  }

  async selfTest(): Promise<ConstraintSelfTestResult> {
    const start = Date.now();
    const failedTests: ConstraintSelfTestResult['failedTests'] = [];
    const now = new Date();

    const mk = (lotStatus: 'OPEN' | 'RELEASED' | 'REJECTED'): ConstraintContext => ({
      order: {
        id: 'ORD-QA' as never,
        materialId: 'MAT-1' as never,
        batchId: 'BATCH-1' as never,
        quantity: 1,
        unit: 'EA',
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
          id: 'BATCH-1' as never,
          materialId: 'MAT-1' as never,
          quantity: 1,
          unit: 'EA',
          status: lotStatus === 'RELEASED' ? 'RELEASED' : 'QC_HOLD',
          availableFrom: now,
          inspectionLotStatus: lotStatus,
          attributes: {},
        },
      ],
      materials: [
        {
          id: 'MAT-1' as never,
          name: 'Test',
          description: '',
          unit: 'EA',
          requiresBatchRelease: true,
          isPatientSpecific: false,
          attributes: {},
        },
      ],
      inventory: [],
      siblingOrders: [],
      evaluationTime: now,
      extensions: {},
    });

    const cases = [
      { name: 'released-lot', status: 'RELEASED' as const, expectPass: true },
      { name: 'open-lot', status: 'OPEN' as const, expectPass: false },
      { name: 'rejected-lot', status: 'REJECTED' as const, expectPass: false },
    ];

    for (const tc of cases) {
      const result = await this.evaluate(mk(tc.status));
      if (result.passed !== tc.expectPass) {
        failedTests.push({
          name: tc.name,
          expected: `passed=${tc.expectPass}`,
          actual: `passed=${result.passed}`,
        });
      }
    }

    return {
      pluginId: META.id,
      pluginVersion: META.version,
      passed: failedTests.length === 0,
      testsPassed: cases.length - failedTests.length,
      testsFailed: failedTests.length,
      failedTests,
      durationMs: Date.now() - start,
    };
  }
}
