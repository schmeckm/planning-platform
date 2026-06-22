/**
 * Unit tests – CgtVeinToVeinDeadlineConstraint
 *
 * For autologous CGT products the total time from apheresis collection to
 * infusion must not exceed the validated vein-to-vein (V2V) window (default 28 days).
 */

import { describe, it, expect } from 'vitest';
import { CgtVeinToVeinDeadlineConstraint } from '../constraints/vein-to-vein-deadline.constraint.js';
import type { ConstraintContext } from '@PCP/planning-constraints';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MS_PER_DAY = 86_400_000;
const DEFAULT_MAX_V2V_DAYS = 28;

function buildCtx(options: {
  apheresisOffsetDays?: number;
  maxVeinToVeinDays?: number;
  scheduledFinishOffsetDays?: number;
  noApheresisDate?: boolean;
}): ConstraintContext {
  const now = new Date();
  const {
    apheresisOffsetDays = -5,
    maxVeinToVeinDays = DEFAULT_MAX_V2V_DAYS,
    scheduledFinishOffsetDays = 20,
    noApheresisDate = false,
  } = options;

  const apheresisDate = new Date(now.getTime() + apheresisOffsetDays * MS_PER_DAY);
  const scheduledFinish = new Date(now.getTime() + scheduledFinishOffsetDays * MS_PER_DAY);

  return {
    order: {
      id: 'ORD-CGT-V2V-001' as never,
      materialId: 'MAT-CGT-001' as never,
      patientId: 'PAT-001',
      quantity: 1,
      unit: 'DOSE',
      priority: 'CRITICAL',
      status: 'RELEASED',
      earliestStart: now,
      latestFinish: new Date(now.getTime() + 30 * MS_PER_DAY),
      scheduledFinish,
      durationMinutes: 480,
      operations: [],
      tags: {},
      schedulingStatus: 'PENDING',
      metadata: noApheresisDate
        ? {}
        : {
            apheresisDate: apheresisDate.toISOString(),
            maxVeinToVeinDays,
          },
      createdAt: now,
      updatedAt: now,
    },
    resources: [],
    batches: [],
    materials: [
      {
        id: 'MAT-CGT-001' as never,
        name: 'CAR-T Cell Product',
        description: 'Patient-specific autologous CAR-T',
        unit: 'DOSE',
        requiresBatchRelease: true,
        isPatientSpecific: true,
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

describe('CgtVeinToVeinDeadlineConstraint', () => {
  const constraint = new CgtVeinToVeinDeadlineConstraint();

  it('has correct metadata', () => {
    expect(constraint.metadata.id).toBe('cgt.patient.vein-to-vein-deadline');
    expect(constraint.metadata.domain).toBe('CGT');
    expect(constraint.metadata.defaultSeverity).toBe('BLOCKER');
  });

  it('passes when scheduled finish is well within the V2V window', async () => {
    // apheresis -5 days ago, window 28 days, deadline = +23 days from now
    // scheduled finish = +10 days from now → 13 days buffer → pass
    const result = await constraint.evaluate(
      buildCtx({ apheresisOffsetDays: -5, maxVeinToVeinDays: 28, scheduledFinishOffsetDays: 10 }),
    );
    expect(result.passed).toBe(true);
    expect(result.score).toBe(1);
  });

  it('fails when scheduled finish exceeds the V2V deadline', async () => {
    // apheresis -5 days ago, window 28 days, deadline = +23 days from now
    // scheduled finish = +30 days → 7 days overrun → BLOCKER
    const result = await constraint.evaluate(
      buildCtx({ apheresisOffsetDays: -5, maxVeinToVeinDays: 28, scheduledFinishOffsetDays: 30 }),
    );
    expect(result.passed).toBe(false);
    expect(result.severity).toBe('BLOCKER');
    expect(result.message).toMatch(/V2V deadline exceeded/i);
  });

  it('warns when scheduled finish is within the 3-day warning buffer', async () => {
    // deadline = +23 days from now, scheduled finish = +22 days → within 3-day buffer → WARNING
    const result = await constraint.evaluate(
      buildCtx({ apheresisOffsetDays: -5, maxVeinToVeinDays: 28, scheduledFinishOffsetDays: 22 }),
    );
    expect(result.passed).toBe(true); // warning = doesn't block
    expect(result.severity).toBe('WARNING');
  });

  it('warns (skipped) when no apheresis date is present in metadata', async () => {
    const result = await constraint.evaluate(
      buildCtx({ noApheresisDate: true }),
    );
    expect(result.passed).toBe(true);
    expect(result.severity).toBe('WARNING');
    expect(result.message).toMatch(/apheresis date/i);
  });

  it('uses the configured maxVeinToVeinDays from metadata', async () => {
    // Tight 14-day window, apheresis 5 days ago → deadline +9 days
    // scheduled finish = +12 days → should fail
    const result = await constraint.evaluate(
      buildCtx({ apheresisOffsetDays: -5, maxVeinToVeinDays: 14, scheduledFinishOffsetDays: 12 }),
    );
    expect(result.passed).toBe(false);
    expect(result.severity).toBe('BLOCKER');
  });

  it('passes built-in selfTest()', async () => {
    const selfTestResult = await constraint.selfTest();
    expect(selfTestResult.passed).toBe(true);
    expect(selfTestResult.testsFailed).toBe(0);
  });
});
