/**
 * CGT Pack – Cryogenic storage capacity
 *
 * ID: cgt.storage.cryogenic-capacity
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
  id: asConstraintId('cgt.storage.cryogenic-capacity'),
  version: '1.0.0',
  name: 'Cryogenic Storage Capacity Check',
  description:
    'Ensures CGT patient-specific orders do not exceed available cryogenic storage slots at the processing site.',
  domain: 'CGT',
  defaultSeverity: 'BLOCKER',
  validationRefs: [
    { type: 'URS', id: 'URS-CGT-003', description: 'Cryo storage slots must not be exceeded' },
    { type: 'FS', id: 'FS-CGT-030', description: 'Count CGT orders vs resource cryoStorageSlots' },
  ],
  author: 'Pharma Collective Platform Contributors',
  license: 'Apache-2.0',
  tags: ['cgt', 'cryogenic', 'storage', 'capacity'],
};

function cryoSlotLimit(ctx: ConstraintContext): number | undefined {
  const ext = ctx.extensions['cryogenicStorageSlots'];
  if (typeof ext === 'number' && ext > 0) {
    return ext;
  }
  for (const resource of ctx.resources) {
    const slots = resource.attributes['cryoStorageSlots'];
    if (typeof slots === 'number' && slots > 0) {
      return slots;
    }
    if (typeof slots === 'string' && slots.length > 0) {
      const parsed = Number(slots);
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }
  }
  return undefined;
}

export class CgtCryogenicStorageConstraint implements IConstraintPlugin {
  readonly metadata = META;

  async evaluate(ctx: ConstraintContext): Promise<ConstraintEvaluationResult> {
    const { order, materials, siblingOrders } = ctx;
    const material = materials.find(m => m.id === order.materialId);

    if (material && !material.isPatientSpecific) {
      return buildPassResult(
        META,
        `Order ${order.id}: non-patient-specific material — cryo capacity check skipped.`,
        { materialId: order.materialId },
      );
    }

    const slotLimit = cryoSlotLimit(ctx);
    if (!slotLimit) {
      return buildPassResult(
        META,
        `Order ${order.id}: cryogenic slot limit not configured — check skipped.`,
        { slotLimit: null },
      );
    }

    const cgtOrders = [order, ...siblingOrders].filter(o => {
      const mat = materials.find(m => m.id === o.materialId);
      return mat?.isPatientSpecific ?? Boolean(o.patientId);
    });

    const demand = cgtOrders.length;
    if (demand <= slotLimit) {
      return buildPassResult(
        META,
        `Order ${order.id}: cryo storage demand ${demand}/${slotLimit} slots — within capacity.`,
        { slotLimit, demand, orderIds: cgtOrders.map(o => o.id) },
      );
    }

    return buildFailResult(
      META,
      `Cryogenic storage exceeded: ${demand} doses require ${slotLimit} slots`,
      `Order ${order.id}: ${demand} patient-specific CGT orders compete for ${slotLimit} cryogenic storage slots.`,
      'Defer non-critical orders, add cryo capacity, or adjust the simulation scope.',
      0,
      { slotLimit, demand },
    );
  }

  async selfTest(): Promise<ConstraintSelfTestResult> {
    const start = Date.now();
    const now = new Date();

    const mkOrder = (id: string): ConstraintContext['order'] => ({
      id: id as never,
      materialId: 'MAT-CGT' as never,
      patientId: id,
      quantity: 1,
      unit: 'DOSE',
      priority: 'CRITICAL',
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
    });

    const materials = [
      {
        id: 'MAT-CGT' as never,
        name: 'CAR-T',
        description: '',
        unit: 'DOSE',
        requiresBatchRelease: true,
        isPatientSpecific: true,
        attributes: {},
      },
    ];

    const pass = await this.evaluate({
      order: mkOrder('ORD-1'),
      siblingOrders: [],
      resources: [{ id: 'RES-CGT' as never, name: 'CGT', type: 'CLEANROOM', capacity: 4, parallelCapacity: 4, oee: 1, qualifiedMaterials: [], attributes: { cryoStorageSlots: 10 } }],
      batches: [],
      materials,
      inventory: [],
      evaluationTime: now,
      extensions: {},
    });

    const fail = await this.evaluate({
      order: mkOrder('ORD-1'),
      siblingOrders: [mkOrder('ORD-2'), mkOrder('ORD-3')],
      resources: [{ id: 'RES-CGT' as never, name: 'CGT', type: 'CLEANROOM', capacity: 4, parallelCapacity: 4, oee: 1, qualifiedMaterials: [], attributes: { cryoStorageSlots: 2 } }],
      batches: [],
      materials,
      inventory: [],
      evaluationTime: now,
      extensions: {},
    });

    const failedTests: ConstraintSelfTestResult['failedTests'] = [];
    if (!pass.passed) {
      failedTests.push({ name: 'within-capacity', expected: 'pass', actual: 'fail' });
    }
    if (fail.passed) {
      failedTests.push({ name: 'over-capacity', expected: 'fail', actual: 'pass' });
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
