/**
 * Unit tests – PharmaGmpBatchReleaseConstraint
 *
 * GMP requirement: a batch must have QA-released status before use.
 * Tests cover all BLOCKED_STATUSES (BLOCKER) and WARNING_STATUSES.
 */

import { describe, it, expect } from 'vitest';
import { PharmaGmpBatchReleaseConstraint } from '../constraints/batch-release.constraint.js';
import type { ConstraintContext } from '@PCP/planning-constraints';

// ─── Helpers ─────────────────────────────────────────────────────────────────

type BatchStatus = 'RELEASED' | 'QA_HOLD' | 'QC_HOLD' | 'QUARANTINE' | 'REJECTED' | 'EXPIRED' | 'PLANNED' | 'IN_PRODUCTION';

function buildCtx(batchStatus: BatchStatus, options: { requiresBatchRelease?: boolean; noBatch?: boolean } = {}): ConstraintContext {
  const now = new Date();
  return {
    order: {
      id: 'ORD-PH-TEST-001' as never,
      materialId: 'MAT-001' as never,
      batchId: options.noBatch ? undefined as never : 'BATCH-001' as never,
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
    batches: options.noBatch ? [] : [
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
        description: 'API test material',
        unit: 'KG',
        requiresBatchRelease: options.requiresBatchRelease ?? true,
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

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('PharmaGmpBatchReleaseConstraint', () => {
  const constraint = new PharmaGmpBatchReleaseConstraint();

  it('has correct metadata', () => {
    expect(constraint.metadata.id).toBe('pharma.batch.release-status');
    expect(constraint.metadata.domain).toBe('PHARMA');
    expect(constraint.metadata.defaultSeverity).toBe('BLOCKER');
    expect(constraint.metadata.license).toBe('Apache-2.0');
  });

  it('passes for a RELEASED batch', async () => {
    const result = await constraint.evaluate(buildCtx('RELEASED'));
    expect(result.passed).toBe(true);
    expect(result.score).toBe(1);
  });

  it('blocks scheduling for QA_HOLD batch', async () => {
    const result = await constraint.evaluate(buildCtx('QA_HOLD'));
    expect(result.passed).toBe(false);
    expect(result.severity).toBe('BLOCKER');
  });

  it('blocks scheduling for QC_HOLD batch', async () => {
    const result = await constraint.evaluate(buildCtx('QC_HOLD'));
    expect(result.passed).toBe(false);
    expect(result.severity).toBe('BLOCKER');
  });

  it('blocks scheduling for QUARANTINE batch', async () => {
    const result = await constraint.evaluate(buildCtx('QUARANTINE'));
    expect(result.passed).toBe(false);
    expect(result.severity).toBe('BLOCKER');
  });

  it('blocks scheduling for REJECTED batch', async () => {
    const result = await constraint.evaluate(buildCtx('REJECTED'));
    expect(result.passed).toBe(false);
    expect(result.severity).toBe('BLOCKER');
  });

  it('blocks scheduling for EXPIRED batch', async () => {
    const result = await constraint.evaluate(buildCtx('EXPIRED'));
    expect(result.passed).toBe(false);
    expect(result.severity).toBe('BLOCKER');
  });

  it('warns for PLANNED batch (release pending, not yet confirmed)', async () => {
    const result = await constraint.evaluate(buildCtx('PLANNED'));
    expect(result.passed).toBe(true); // warning doesn't block
    expect(result.severity).toBe('WARNING');
  });

  it('warns for IN_PRODUCTION batch (release pending)', async () => {
    const result = await constraint.evaluate(buildCtx('IN_PRODUCTION'));
    expect(result.passed).toBe(true);
    expect(result.severity).toBe('WARNING');
  });

  it('warns (not blocks) when no batch is assigned but material requires release', async () => {
    const result = await constraint.evaluate(buildCtx('RELEASED', { noBatch: true }));
    expect(result.passed).toBe(true); // warning, not blocker
    expect(result.severity).toBe('WARNING');
  });

  it('passes (skipped) when material does not require batch release', async () => {
    const result = await constraint.evaluate(buildCtx('RELEASED', { requiresBatchRelease: false }));
    expect(result.passed).toBe(true);
    expect(result.detail).toMatchObject({ requiresBatchRelease: false });
  });

  it('passes built-in selfTest()', async () => {
    const selfTestResult = await constraint.selfTest();
    expect(selfTestResult.passed).toBe(true);
    expect(selfTestResult.testsFailed).toBe(0);
    expect(selfTestResult.testsPassed).toBeGreaterThanOrEqual(6);
  });
});
