/**
 * CGT Pack – Constraint: Vein-to-Vein Deadline Check
 *
 * For autologous CGT products, the total time from apheresis collection
 * to patient infusion must not exceed the validated vein-to-vein (V2V) window.
 * Exceeding this window may compromise product quality and patient safety.
 *
 * ID:      cgt.patient.vein-to-vein-deadline
 * Domain:  CGT
 * Severity: BLOCKER
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
  id: asConstraintId('cgt.patient.vein-to-vein-deadline'),
  version: '1.0.0',
  name: 'Vein-to-Vein Deadline Check',
  description:
    'Checks that the scheduled completion of the CGT order falls within the ' +
    'validated vein-to-vein window for the patient. ' +
    'The V2V window start (apheresis date) must be present in order metadata.',
  domain: 'CGT',
  defaultSeverity: 'BLOCKER',
  validationRefs: [
    { type: 'URS', id: 'URS-CGT-002', description: 'Vein-to-vein timeline must be within validated window' },
    { type: 'FS',  id: 'FS-CGT-020',  description: 'V2V check: apheresis date + max days ≥ scheduled finish' },
  ],
  documentationUrl: 'https://github.com/schmeckm/planningplatform/blob/main/open-planning-platform/docs/industries/cgt.md',
  author: 'Pharma Collective Platform Contributors',
  license: 'Apache-2.0',
  tags: ['cgt', 'patient', 'vein-to-vein', 'timeline', 'autologous', 'deadline'],
};

const MS_PER_DAY = 86_400_000;
const DEFAULT_MAX_V2V_DAYS = 28; // Typical CAR-T vein-to-vein window
const WARNING_BUFFER_DAYS = 3;

export class CgtVeinToVeinDeadlineConstraint implements IConstraintPlugin {
  readonly metadata = META;

  async evaluate(ctx: ConstraintContext): Promise<ConstraintEvaluationResult> {
    const { order } = ctx;

    const apheresisDateRaw = order.metadata['apheresisDate'];
    if (!apheresisDateRaw) {
      return buildWarnResult(
        META,
        `Order ${order.id}: no apheresis date in metadata – V2V check skipped`,
        `The vein-to-vein check requires an apheresis date in order.metadata.apheresisDate, ` +
          `but none is present for order ${order.id}.`,
        "Set order.metadata.apheresisDate to the patient's apheresis collection date.",
        0.5,
        { orderPatientId: order.patientId },
      );
    }

    const apheresisDate = new Date(apheresisDateRaw as string);
    const maxV2VDays =
      typeof order.metadata['maxVeinToVeinDays'] === 'number'
        ? order.metadata['maxVeinToVeinDays']
        : DEFAULT_MAX_V2V_DAYS;

    const infusionDeadline = new Date(apheresisDate.getTime() + maxV2VDays * MS_PER_DAY);
    const scheduledFinish = order.scheduledFinish ?? order.latestFinish;
    const remainingDays = (infusionDeadline.getTime() - scheduledFinish.getTime()) / MS_PER_DAY;

    if (remainingDays < 0) {
      const overrunDays = Math.abs(remainingDays).toFixed(1);
      return buildFailResult(
        META,
        `V2V deadline exceeded by ${overrunDays} days for patient ${order.patientId}`,
        `Order ${order.id} (patient: ${order.patientId}) is scheduled to finish on ` +
          `${scheduledFinish.toISOString().substring(0, 10)}, which is ${overrunDays} days ` +
          `after the vein-to-vein deadline of ${infusionDeadline.toISOString().substring(0, 10)} ` +
          `(apheresis: ${apheresisDate.toISOString().substring(0, 10)} + ${maxV2VDays} days).`,
        `Expedite manufacturing to finish by ${infusionDeadline.toISOString().substring(0, 10)}, ` +
          `or coordinate with the clinical team to adjust the infusion date.`,
        0,
        {
          patientId: order.patientId,
          apheresisDate,
          maxV2VDays,
          infusionDeadline,
          scheduledFinish,
          overrunDays: parseFloat(overrunDays),
        },
      );
    }

    if (remainingDays < WARNING_BUFFER_DAYS) {
      return buildWarnResult(
        META,
        `V2V warning: only ${remainingDays.toFixed(1)} days buffer before deadline`,
        `Order ${order.id} (patient: ${order.patientId}) is scheduled to finish with only ` +
          `${remainingDays.toFixed(1)} days before the V2V deadline. ` +
          `This is within the ${WARNING_BUFFER_DAYS}-day warning buffer.`,
        'Ensure no delays in downstream QC release or logistics to meet the infusion date.',
        remainingDays / WARNING_BUFFER_DAYS,
        {
          patientId: order.patientId,
          infusionDeadline,
          scheduledFinish,
          remainingDays,
        },
      );
    }

    return buildPassResult(
      META,
      `Order ${order.id} (patient: ${order.patientId}): V2V check passed. ` +
        `${remainingDays.toFixed(1)} days buffer before deadline ${infusionDeadline.toISOString().substring(0, 10)}.`,
      { patientId: order.patientId, infusionDeadline, scheduledFinish, remainingDays },
    );
  }

  async selfTest(): Promise<ConstraintSelfTestResult> {
    const start = Date.now();
    const tests: ConstraintSelfTestResult['failedTests'] = [];
    const now = new Date();

    // Test 1: Finish within V2V window → pass
    const apheresis = new Date(now.getTime() - 7 * MS_PER_DAY);
    const r1 = await this.evaluate(buildCtx(apheresis, new Date(now.getTime() + 10 * MS_PER_DAY)));
    if (!r1.passed) tests.push({ name: 'within-v2v', expected: 'passed=true', actual: 'passed=false' });

    // Test 2: Finish after V2V deadline → fail
    const r2 = await this.evaluate(buildCtx(apheresis, new Date(now.getTime() + 30 * MS_PER_DAY)));
    if (r2.passed) tests.push({ name: 'exceeds-v2v', expected: 'passed=false', actual: 'passed=true' });

    return {
      pluginId: META.id,
      pluginVersion: META.version,
      passed: tests.length === 0,
      testsPassed: 2 - tests.length,
      testsFailed: tests.length,
      failedTests: tests,
      durationMs: Date.now() - start,
    };
  }
}

function buildCtx(apheresisDate: Date, latestFinish: Date): ConstraintContext {
  const now = new Date();
  return {
    order: {
      id: 'test-cgt-order-1' as never,
      materialId: 'MAT-CGT-001' as never,
      patientId: 'PAT-001',
      quantity: 1,
      unit: 'DOSE',
      priority: 'CRITICAL',
      status: 'RELEASED',
      earliestStart: now,
      latestFinish,
      scheduledFinish: latestFinish,
      durationMinutes: 480,
      operations: [],
      tags: {},
      schedulingStatus: 'PENDING',
      metadata: {
        apheresisDate: apheresisDate.toISOString(),
        maxVeinToVeinDays: 28,
      },
      createdAt: now,
      updatedAt: now,
    },
    resources: [],
    batches: [],
    materials: [
      {
        id: 'MAT-CGT-001' as never,
        name: 'CAR-T',
        description: 'Autologous CAR-T',
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
