/**
 * Unit tests – CgtChainOfIdentityConstraint
 *
 * Critical CGT safety constraint: the batch used for an autologous CGT order
 * MUST originate from the same patient as the order itself.
 */

import { describe, it, expect } from 'vitest';
import { CgtChainOfIdentityConstraint } from '../constraints/chain-of-identity.constraint.js';
import type { ConstraintContext } from '@PCP/planning-constraints';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildCtx(options: {
  orderPatientId?: string;
  batchPatientId?: string;
  noBatch?: boolean;
  isPatientSpecific?: boolean;
}): ConstraintContext {
  const now = new Date();
  const { orderPatientId, batchPatientId, noBatch = false, isPatientSpecific = true } = options;

  return {
    order: {
      id: 'ORD-CGT-TEST-001' as never,
      materialId: 'MAT-CGT-001' as never,
      batchId: noBatch ? undefined as never : 'BATCH-CGT-001' as never,
      patientId: orderPatientId,
      quantity: 1,
      unit: 'DOSE',
      priority: 'CRITICAL',
      status: 'RELEASED',
      earliestStart: now,
      latestFinish: new Date(now.getTime() + 5 * 86_400_000),
      durationMinutes: 480,
      operations: [],
      tags: {},
      schedulingStatus: 'PENDING',
      metadata: {},
      createdAt: now,
      updatedAt: now,
    },
    resources: [],
    batches: noBatch ? [] : [
      {
        id: 'BATCH-CGT-001' as never,
        materialId: 'MAT-CGT-001' as never,
        quantity: 1,
        unit: 'DOSE',
        status: 'RELEASED' as const,
        availableFrom: now,
        patientId: batchPatientId,
        attributes: {},
      },
    ],
    materials: [
      {
        id: 'MAT-CGT-001' as never,
        name: 'CAR-T Cell Product',
        description: 'Patient-specific autologous CAR-T',
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

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('CgtChainOfIdentityConstraint', () => {
  const constraint = new CgtChainOfIdentityConstraint();

  it('has correct metadata', () => {
    expect(constraint.metadata.id).toBe('cgt.patient.chain-of-identity');
    expect(constraint.metadata.domain).toBe('CGT');
    expect(constraint.metadata.defaultSeverity).toBe('BLOCKER');
    expect(constraint.metadata.license).toBe('Apache-2.0');
    const tags = constraint.metadata.tags;
    expect(tags).toContain('cgt');
    expect(tags).toContain('patient');
  });

  it('passes when order and batch share the same patient ID', async () => {
    const result = await constraint.evaluate(
      buildCtx({ orderPatientId: 'PAT-001', batchPatientId: 'PAT-001' }),
    );
    expect(result.passed).toBe(true);
    expect(result.score).toBe(1);
  });

  it('fails (BLOCKER) when patient IDs differ', async () => {
    const result = await constraint.evaluate(
      buildCtx({ orderPatientId: 'PAT-001', batchPatientId: 'PAT-002' }),
    );
    expect(result.passed).toBe(false);
    expect(result.severity).toBe('BLOCKER');
    expect(result.message).toMatch(/chain.of.identity|CoI|patient/i);
  });

  it('fails (BLOCKER) when the order has no patient ID', async () => {
    const result = await constraint.evaluate(
      buildCtx({ orderPatientId: undefined, batchPatientId: 'PAT-001' }),
    );
    expect(result.passed).toBe(false);
    expect(result.severity).toBe('BLOCKER');
  });

  it('fails (BLOCKER) when no batch is assigned to a patient-specific order', async () => {
    const result = await constraint.evaluate(
      buildCtx({ orderPatientId: 'PAT-001', noBatch: true }),
    );
    expect(result.passed).toBe(false);
    expect(result.severity).toBe('BLOCKER');
  });

  it('passes (skipped) when the material is NOT patient-specific', async () => {
    const result = await constraint.evaluate(
      buildCtx({ orderPatientId: 'PAT-001', batchPatientId: 'PAT-002', isPatientSpecific: false }),
    );
    expect(result.passed).toBe(true);
    expect(result.detail).toMatchObject({ isPatientSpecific: false });
  });

  it('passes built-in selfTest()', async () => {
    const selfTestResult = await constraint.selfTest();
    expect(selfTestResult.passed).toBe(true);
    expect(selfTestResult.testsFailed).toBe(0);
    expect(selfTestResult.testsPassed).toBeGreaterThan(0);
  });
});
