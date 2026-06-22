/**
 * Pharma Pack – Cleaning validation matrix (product changeover)
 *
 * ID: pharma.cleaning.validation
 */

import type { ConstraintEvaluationResult } from '@PCP/planning-core';
import { asConstraintId, asMaterialId } from '@PCP/planning-core';
import type {
  IConstraintPlugin,
  ConstraintContext,
  ConstraintMetadata,
  ConstraintSelfTestResult,
} from '@PCP/planning-constraints';
import { buildPassResult, buildFailResult } from '@PCP/planning-constraints';
import { resolvePreviousMaterialId } from '../constraint-helpers.js';

/** Default allergen / product-family changeover matrix (validated cleaning required). */
export const DEFAULT_CLEANING_MATRIX: Record<string, Record<string, boolean>> = {
  'MAT-BIO-001': { 'MAT-API-001': true, 'MAT-FG-001': true },
  'MAT-API-001': { 'MAT-BIO-001': true },
};

const META: ConstraintMetadata = {
  id: asConstraintId('pharma.cleaning.validation'),
  version: '1.0.0',
  name: 'Cleaning Validation Matrix Check',
  description:
    'Ensures product changeovers on shared equipment use a validated cleaning procedure when required by the matrix.',
  domain: 'PHARMA',
  defaultSeverity: 'BLOCKER',
  validationRefs: [
    { type: 'URS', id: 'URS-PH-010', description: 'Validated cleaning before product changeover' },
    { type: 'FS', id: 'FS-PH-040', description: 'Cleaning matrix lookup previous → next material' },
  ],
  author: 'Pharma Collective Platform Contributors',
  license: 'Apache-2.0',
  tags: ['pharma', 'cleaning', 'changeover', 'allergen'],
};

function resolveMatrix(ctx: ConstraintContext): Record<string, Record<string, boolean>> {
  const ext = ctx.extensions['cleaningValidationMatrix'];
  if (ext && typeof ext === 'object' && !Array.isArray(ext)) {
    return ext as Record<string, Record<string, boolean>>;
  }
  return DEFAULT_CLEANING_MATRIX;
}

export class PharmaCleaningValidationConstraint implements IConstraintPlugin {
  readonly metadata = META;

  async evaluate(ctx: ConstraintContext): Promise<ConstraintEvaluationResult> {
    const { order } = ctx;
    const previousMaterialId = resolvePreviousMaterialId(order);
    const nextMaterialId = order.materialId;

    if (!previousMaterialId || previousMaterialId === nextMaterialId) {
      return buildPassResult(
        META,
        `Order ${order.id}: no product changeover detected — cleaning matrix check skipped.`,
        { previousMaterialId: previousMaterialId ?? null, nextMaterialId },
      );
    }

    const matrix = resolveMatrix(ctx);
    const row = matrix[previousMaterialId] ?? matrix[String(previousMaterialId)];
    const cleaningValidated = row?.[String(nextMaterialId)] ?? row?.[nextMaterialId];

    if (cleaningValidated) {
      return buildPassResult(
        META,
        `Order ${order.id}: validated cleaning confirmed for ${previousMaterialId} → ${nextMaterialId}.`,
        { previousMaterialId, nextMaterialId, cleaningValidated: true },
      );
    }

    return buildFailResult(
      META,
      `Cleaning validation BLOCKER: ${previousMaterialId} → ${nextMaterialId} not in matrix`,
      `Order ${order.id} processes material ${nextMaterialId} after ${previousMaterialId} on shared equipment, ` +
        `but no validated cleaning procedure is recorded for this changeover.`,
      'Execute validated cleaning per SOP or reschedule after matrix-approved changeover.',
      0,
      { previousMaterialId, nextMaterialId, cleaningValidated: false },
    );
  }

  async selfTest(): Promise<ConstraintSelfTestResult> {
    const start = Date.now();
    const failedTests: ConstraintSelfTestResult['failedTests'] = [];
    const now = new Date();

    const mkOrder = (previousMaterialId?: string) => ({
      id: 'ORD-CLEAN' as never,
      materialId: asMaterialId('MAT-API-001'),
      quantity: 1,
      unit: 'KG',
      priority: 'NORMAL' as const,
      status: 'RELEASED' as const,
      earliestStart: now,
      latestFinish: new Date(now.getTime() + 86_400_000),
      durationMinutes: 60,
      operations: [],
      tags: {},
      schedulingStatus: 'PENDING' as const,
      metadata: previousMaterialId ? { previousMaterialId } : {},
      createdAt: now,
      updatedAt: now,
    });

    const base: ConstraintContext = {
      order: mkOrder('MAT-BIO-001'),
      resources: [],
      batches: [],
      materials: [],
      inventory: [],
      siblingOrders: [],
      evaluationTime: now,
      extensions: {},
    };

    const pass = await this.evaluate(base);
    if (!pass.passed) {
      failedTests.push({ name: 'matrix-allows', expected: 'pass', actual: 'fail' });
    }

    const failCtx: ConstraintContext = {
      ...base,
      order: mkOrder('MAT-UNKNOWN'),
      extensions: { cleaningValidationMatrix: {} },
    };
    const fail = await this.evaluate(failCtx);
    if (fail.passed) {
      failedTests.push({ name: 'matrix-blocks', expected: 'fail', actual: 'pass' });
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
