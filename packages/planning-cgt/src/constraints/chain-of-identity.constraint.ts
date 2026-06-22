/**
 * CGT Pack – Constraint: Chain of Identity (CoI)
 *
 * In Cell & Gene Therapy, every patient-specific order must use only
 * materials and batches that are linked to the same patient ID.
 * Cross-patient contamination is a critical safety risk.
 *
 * ID:      cgt.patient.chain-of-identity
 * Domain:  CGT
 * Severity: BLOCKER
 *
 * Validation References:
 *   URS-CGT-001: Patient-specific orders must only use patient-matched materials
 *   FS-CGT-010:  Chain of Identity check across order, batch, and material
 *   GMP-REF-002: FDA Guidance – Chain of Identity for ATMP products
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
  id: asConstraintId('cgt.patient.chain-of-identity'),
  version: '1.0.0',
  name: 'Chain of Identity (CoI) Check',
  description:
    'Verifies that the patient ID on the order matches the patient ID on the assigned batch. ' +
    'Critical safety constraint for autologous Cell & Gene Therapy products.',
  domain: 'CGT',
  defaultSeverity: 'BLOCKER',
  validationRefs: [
    { type: 'URS', id: 'URS-CGT-001', description: 'Patient-specific orders must use patient-matched materials' },
    { type: 'FS',  id: 'FS-CGT-010',  description: 'CoI check across order, batch, and material' },
    { type: 'TC',  id: 'TC-CGT-010-001', description: 'Test: same patient ID → pass' },
    { type: 'TC',  id: 'TC-CGT-010-002', description: 'Test: different patient ID → fail' },
    { type: 'TC',  id: 'TC-CGT-010-003', description: 'Test: non-patient-specific material → skip' },
  ],
  documentationUrl: 'https://github.com/schmeckm/planningplatform/blob/main/open-planning-platform/docs/industries/cgt.md',
  author: 'Pharma Collective Platform Contributors',
  license: 'Apache-2.0',
  tags: ['cgt', 'patient', 'chain-of-identity', 'autologous', 'safety', 'critical'],
};

export class CgtChainOfIdentityConstraint implements IConstraintPlugin {
  readonly metadata = META;

  async evaluate(ctx: ConstraintContext): Promise<ConstraintEvaluationResult> {
    const { order, batches, materials } = ctx;

    const material = materials.find(m => m.id === order.materialId);

    // Only applies to patient-specific (autologous) materials
    if (material && !material.isPatientSpecific) {
      return buildPassResult(
        META,
        `Order ${order.id}: material ${order.materialId} is not patient-specific. CoI check skipped.`,
        { materialId: order.materialId, isPatientSpecific: false },
      );
    }

    if (!order.patientId) {
      return buildFailResult(
        META,
        `Patient-specific order ${order.id} has no patient ID`,
        `Order ${order.id} processes a patient-specific material (${order.materialId}) ` +
          `but has no patient ID assigned. Chain of Identity cannot be verified.`,
        'Assign a valid patient ID to the order before scheduling.',
        0,
        { materialId: order.materialId, orderPatientId: null },
      );
    }

    if (!order.batchId) {
      return buildFailResult(
        META,
        `Patient-specific order ${order.id} has no batch assigned for CoI verification`,
        `Order ${order.id} (patient: ${order.patientId}) requires a patient-matched batch, ` +
          `but no batch is assigned. Chain of Identity cannot be established.`,
        `Assign a batch that carries the patient ID ${order.patientId}.`,
        0,
        { orderPatientId: order.patientId, batchId: null },
      );
    }

    const batch = batches.find(b => b.id === order.batchId);
    if (!batch) {
      return buildFailResult(
        META,
        `Batch ${order.batchId} not found for CoI verification`,
        `Order ${order.id} (patient: ${order.patientId}) references batch ${order.batchId}, ` +
          `but this batch is not available in the planning context.`,
        'Ensure the batch is loaded in the simulation context.',
        0,
        { orderPatientId: order.patientId, batchId: order.batchId },
      );
    }

    if (!batch.patientId) {
      return buildFailResult(
        META,
        `CoI BLOCKER: batch ${batch.id} has no patient ID`,
        `Order ${order.id} (patient: ${order.patientId}) is linked to batch ${batch.id}, ` +
          `but the batch has no patient ID. Chain of Identity is broken.`,
        `Update batch ${batch.id} with the correct patient ID, or select a patient-matched batch.`,
        0,
        { orderPatientId: order.patientId, batchId: batch.id, batchPatientId: null },
      );
    }

    if (batch.patientId !== order.patientId) {
      return buildFailResult(
        META,
        `CoI CRITICAL: patient ID mismatch! Order patient "${order.patientId}" ≠ batch patient "${batch.patientId}"`,
        `CRITICAL SAFETY ISSUE: Order ${order.id} belongs to patient "${order.patientId}", ` +
          `but the assigned batch ${batch.id} belongs to patient "${batch.patientId}". ` +
          `This is a Chain of Identity violation and must be resolved before scheduling.`,
        `Immediately reassign a batch that belongs to patient "${order.patientId}". ` +
          `Do NOT proceed with the current batch assignment.`,
        0,
        {
          orderPatientId: order.patientId,
          batchId: batch.id,
          batchPatientId: batch.patientId,
          severity: 'CRITICAL_SAFETY',
        },
      );
    }

    return buildPassResult(
      META,
      `Order ${order.id}: Chain of Identity verified. Order and batch ${batch.id} both belong to patient "${order.patientId}".`,
      { orderPatientId: order.patientId, batchId: batch.id, batchPatientId: batch.patientId },
    );
  }

  async selfTest(): Promise<ConstraintSelfTestResult> {
    const start = Date.now();
    const tests: ConstraintSelfTestResult['failedTests'] = [];

    // Test 1: Matching patient IDs → pass
    const r1 = await this.evaluate(buildCtx('PAT-001', 'PAT-001', true));
    if (!r1.passed) tests.push({ name: 'matching-patient-id', expected: 'passed=true', actual: 'passed=false' });

    // Test 2: Mismatched patient IDs → fail (critical safety)
    const r2 = await this.evaluate(buildCtx('PAT-001', 'PAT-002', true));
    if (r2.passed) tests.push({ name: 'mismatched-patient-id', expected: 'passed=false', actual: 'passed=true' });

    // Test 3: Non-patient-specific material → skip
    const r3 = await this.evaluate(buildCtx('PAT-001', 'PAT-001', false));
    if (!r3.passed) tests.push({ name: 'non-patient-specific-skip', expected: 'passed=true', actual: 'passed=false' });

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
  orderPatientId: string,
  batchPatientId: string,
  isPatientSpecific: boolean,
): ConstraintContext {
  const now = new Date();
  return {
    order: {
      id: 'test-order-cgt-1' as never,
      materialId: 'MAT-CGT-001' as never,
      batchId: 'BATCH-CGT-001' as never,
      patientId: orderPatientId,
      quantity: 1,
      unit: 'DOSE',
      priority: 'CRITICAL',
      status: 'RELEASED',
      earliestStart: now,
      latestFinish: new Date(now.getTime() + 86_400_000 * 14),
      durationMinutes: 480,
      operations: [],
      tags: { productType: 'CAR-T' },
      schedulingStatus: 'PENDING',
      metadata: {},
      createdAt: now,
      updatedAt: now,
    },
    resources: [],
    batches: [
      {
        id: 'BATCH-CGT-001' as never,
        materialId: 'MAT-CGT-001' as never,
        quantity: 1,
        unit: 'DOSE',
        status: 'RELEASED',
        availableFrom: now,
        patientId: batchPatientId,
        attributes: {},
      },
    ],
    materials: [
      {
        id: 'MAT-CGT-001' as never,
        name: 'CAR-T Cell Product',
        description: 'Autologous CAR-T cell therapy',
        unit: 'DOSE',
        requiresBatchRelease: true,
        isPatientSpecific,
        attributes: {},
      },
    ],
    inventory: [],
    siblingOrders: [],
    evaluationTime: now,
    extensions: {},
  };
}
