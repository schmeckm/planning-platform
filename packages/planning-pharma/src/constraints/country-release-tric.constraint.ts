/**
 * Pharma Pack – Country / batch release (TRIC) check
 *
 * Ensures the assigned batch is market-released for the order destination country.
 * Mirrors HAE ComplianceEngine.checkTric().
 *
 * ID: pharma.batch.country-release-tric
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
import {
  resolveApprovedCountries,
  resolveDestinationCountry,
} from '../constraint-helpers.js';

const META: ConstraintMetadata = {
  id: asConstraintId('pharma.batch.country-release-tric'),
  version: '1.0.0',
  name: 'Country Batch Release (TRIC) Check',
  description:
    'Verifies that the batch is approved for the order destination market (TRIC / country release).',
  domain: 'PHARMA',
  defaultSeverity: 'BLOCKER',
  validationRefs: [
    { type: 'URS', id: 'URS-PH-003', description: 'Batch must be released for destination country' },
    { type: 'FS', id: 'FS-PH-030', description: 'TRIC check against approvedCountries on batch' },
    { type: 'TC', id: 'TC-PH-030-001', description: 'Approved destination → pass' },
    { type: 'TC', id: 'TC-PH-030-002', description: 'Missing country approval → fail' },
  ],
  author: 'Pharma Collective Platform Contributors',
  license: 'Apache-2.0',
  tags: ['pharma', 'tric', 'country-release', 'market-release', 'blocker'],
};

export class PharmaCountryReleaseTricConstraint implements IConstraintPlugin {
  readonly metadata = META;

  async evaluate(ctx: ConstraintContext): Promise<ConstraintEvaluationResult> {
    const { order, batches } = ctx;
    const destination = resolveDestinationCountry(order);

    if (!destination) {
      return buildPassResult(
        META,
        `Order ${order.id}: no destination country specified — TRIC check skipped.`,
        { destinationCountry: null, tricRequired: false },
      );
    }

    const requiresTric = order.metadata['tricRequired'] !== false;
    if (!requiresTric) {
      return buildPassResult(
        META,
        `Order ${order.id}: TRIC not required for destination ${destination}.`,
        { destinationCountry: destination, tricRequired: false },
      );
    }

    if (!order.batchId) {
      return buildFailResult(
        META,
        `TRIC check failed: no batch assigned for destination ${destination}`,
        `Order ${order.id} ships to ${destination} but has no batch assigned for TRIC verification.`,
        'Assign a batch with market release for the destination country.',
        0,
        { destinationCountry: destination, batchId: null },
      );
    }

    const batch = batches.find(b => b.id === order.batchId);
    if (!batch) {
      return buildFailResult(
        META,
        `TRIC check failed: batch ${order.batchId} not found`,
        `Order ${order.id} references batch ${order.batchId} which is not in the planning snapshot.`,
        'Reload adapter data or assign a valid batch.',
        0,
        { destinationCountry: destination, batchId: order.batchId },
      );
    }

    const approved = resolveApprovedCountries(batch);
    if (approved.includes(destination)) {
      return buildPassResult(
        META,
        `Order ${order.id}: batch ${batch.id} is TRIC-approved for ${destination}.`,
        { destinationCountry: destination, batchId: batch.id, approvedCountries: approved },
      );
    }

    return buildFailResult(
      META,
      `TRIC BLOCKER: batch ${batch.id} not approved for ${destination}`,
      `Order ${order.id} requires shipment to ${destination}, but batch ${batch.id} is only approved for: ${approved.join(', ') || 'none'}.`,
      `Use a batch with country release for ${destination}, or change the destination market.`,
      0,
      { destinationCountry: destination, batchId: batch.id, approvedCountries: approved },
    );
  }

  async selfTest(): Promise<ConstraintSelfTestResult> {
    const start = Date.now();
    const failedTests: ConstraintSelfTestResult['failedTests'] = [];
    const now = new Date();

    const baseCtx = (overrides: Partial<ConstraintContext>): ConstraintContext => ({
      order: {
        id: 'ORD-TRIC' as never,
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
        destinationCountry: 'DE',
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
          quantity: 100,
          unit: 'EA',
          status: 'RELEASED',
          availableFrom: now,
          approvedCountries: ['DE', 'US'],
          attributes: {},
        },
      ],
      materials: [],
      inventory: [],
      siblingOrders: [],
      evaluationTime: now,
      extensions: {},
      ...overrides,
    });

    const cases = [
      { name: 'approved-destination', expectPass: true, ctx: baseCtx({}) },
      {
        name: 'missing-approval',
        expectPass: false,
        ctx: baseCtx({
          order: { ...baseCtx({}).order, destinationCountry: 'JP' },
        }),
      },
      {
        name: 'skip-no-destination',
        expectPass: true,
        ctx: baseCtx({
          order: (() => {
            const { destinationCountry: _removed, ...rest } = baseCtx({}).order;
            return rest;
          })(),
        }),
      },
    ];

    for (const tc of cases) {
      const result = await this.evaluate(tc.ctx);
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
