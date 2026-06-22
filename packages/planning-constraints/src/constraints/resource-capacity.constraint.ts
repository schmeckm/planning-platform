/**
 * Constraint: Resource Capacity Check
 *
 * Verifies that a resource capable of processing the required material
 * exists and has sufficient capacity within the order's time window.
 *
 * ID:      generic.resource.capacity
 * Domain:  GENERIC
 * Severity: BLOCKER
 *
 * Validation References:
 *   URS-PLAN-002: System shall check resource availability before scheduling
 *   FS-PLAN-020:  Resource capacity check against calendar and OEE
 */

import type { ConstraintEvaluationResult, PlanningResource } from '@PCP/planning-core';
import { asConstraintId } from '@PCP/planning-core';
import type {
  IConstraintPlugin,
  ConstraintContext,
  ConstraintMetadata,
  ConstraintSelfTestResult,
} from '../interfaces/constraint.interface.js';
import { buildPassResult, buildFailResult } from '../interfaces/constraint.interface.js';

const META: ConstraintMetadata = {
  id: asConstraintId('generic.resource.capacity'),
  version: '1.0.0',
  name: 'Resource Capacity Check',
  description:
    'Verifies that at least one qualified resource exists for the order and has available capacity, ' +
    'factoring in OEE and parallel capacity.',
  domain: 'GENERIC',
  defaultSeverity: 'BLOCKER',
  validationRefs: [
    { type: 'URS', id: 'URS-PLAN-002', description: 'Resource availability check before scheduling' },
    { type: 'FS',  id: 'FS-PLAN-020',  description: 'Resource capacity check against OEE and calendar' },
  ],
  author: 'Pharma Collective Platform Contributors',
  license: 'Apache-2.0',
  tags: ['resource', 'capacity', 'oee', 'generic'],
};

export class ResourceCapacityConstraint implements IConstraintPlugin {
  readonly metadata = META;

  async evaluate(ctx: ConstraintContext): Promise<ConstraintEvaluationResult> {
    const { order, resources } = ctx;

    const qualifiedResources = resources.filter(r =>
      r.qualifiedMaterials.includes(order.materialId),
    );

    if (qualifiedResources.length === 0) {
      return buildFailResult(
        META,
        `No qualified resource found for material ${order.materialId}`,
        `Order ${order.id} requires a resource qualified for material ${order.materialId}. ` +
          `None of the ${resources.length} available resource(s) are qualified for this material.`,
        `Qualify at least one resource for material ${order.materialId} or add a new resource.`,
        0,
        { materialId: order.materialId, totalResources: resources.length, qualifiedResources: 0 },
      );
    }

    // Find the resource with the highest effective capacity
    const best = qualifiedResources.reduce<PlanningResource | null>((acc, r) => {
      const effective = r.capacity * r.oee * r.parallelCapacity;
      const accEffective = acc ? acc.capacity * acc.oee * acc.parallelCapacity : -1;
      return effective > accEffective ? r : acc;
    }, null);

    if (!best) {
      return buildFailResult(
        META,
        'Unable to determine best resource',
        `No resource could be selected despite ${qualifiedResources.length} qualified candidates.`,
        'Check resource configuration.',
        0,
        {},
      );
    }

    const effectiveCapacity = best.capacity * best.oee * best.parallelCapacity;
    const requiredRatePerHour = order.quantity / (order.durationMinutes / 60);

    if (effectiveCapacity < requiredRatePerHour) {
      return buildFailResult(
        META,
        `Insufficient capacity: need ${requiredRatePerHour.toFixed(2)}/h, best resource provides ${effectiveCapacity.toFixed(2)}/h`,
        `Order ${order.id} requires a throughput of ${requiredRatePerHour.toFixed(2)} ${order.unit}/h. ` +
          `The best available resource (${best.name}) provides only ${effectiveCapacity.toFixed(2)} ${order.unit}/h ` +
          `(capacity ${best.capacity} × OEE ${best.oee} × parallel slots ${best.parallelCapacity}).`,
        `Consider splitting the order, extending the time window, or increasing OEE on resource ${best.name}.`,
        effectiveCapacity / requiredRatePerHour,
        {
          bestResource: best.id,
          effectiveCapacity,
          requiredRatePerHour,
          oee: best.oee,
          parallelCapacity: best.parallelCapacity,
        },
      );
    }

    return buildPassResult(
      META,
      `Order ${order.id}: Resource capacity check passed. ` +
        `${qualifiedResources.length} qualified resource(s) available; ` +
        `best resource ${best.name} provides ${effectiveCapacity.toFixed(2)} ${order.unit}/h.`,
      {
        qualifiedResourceCount: qualifiedResources.length,
        selectedResource: best.id,
        effectiveCapacity,
        requiredRatePerHour,
      },
    );
  }

  async selfTest(): Promise<ConstraintSelfTestResult> {
    const start = Date.now();
    const tests: ConstraintSelfTestResult['failedTests'] = [];

    // Test 1: No resources at all → fail
    const emptyCtx = buildCtx([], 100, 60);
    const r1 = await this.evaluate(emptyCtx);
    if (r1.passed) tests.push({ name: 'no-resources', expected: 'passed=false', actual: 'passed=true' });

    // Test 2: Resource qualified, sufficient capacity → pass
    const goodCtx = buildCtx([{ capacity: 200, oee: 0.9, parallel: 1 }], 100, 60);
    const r2 = await this.evaluate(goodCtx);
    if (!r2.passed) tests.push({ name: 'sufficient-capacity', expected: 'passed=true', actual: 'passed=false' });

    // Test 3: Resource present but insufficient capacity → fail
    const lowCtx = buildCtx([{ capacity: 10, oee: 0.5, parallel: 1 }], 1000, 60);
    const r3 = await this.evaluate(lowCtx);
    if (r3.passed) tests.push({ name: 'insufficient-capacity', expected: 'passed=false', actual: 'passed=true' });

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
  resources: Array<{ capacity: number; oee: number; parallel: number }>,
  quantity: number,
  durationMinutes: number,
): ConstraintContext {
  return {
    order: {
      id: 'test-order-1' as never,
      materialId: 'MAT-001' as never,
      quantity,
      unit: 'KG',
      priority: 'NORMAL',
      status: 'RELEASED',
      earliestStart: new Date(),
      latestFinish: new Date(Date.now() + 86_400_000),
      durationMinutes,
      operations: [],
      tags: {},
      schedulingStatus: 'PENDING',
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    resources: resources.map((r, i) => ({
      id: `RES-00${i + 1}` as never,
      name: `Resource ${i + 1}`,
      type: 'MACHINE' as const,
      capacity: r.capacity,
      parallelCapacity: r.parallel,
      oee: r.oee,
      qualifiedMaterials: ['MAT-001' as never],
      attributes: {},
    })),
    batches: [],
    materials: [],
    inventory: [],
    siblingOrders: [],
    evaluationTime: new Date(),
    extensions: {},
  };
}
