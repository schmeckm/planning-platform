/**
 * Pharma Pack – Campaign sequencing (soft scoring)
 *
 * ID: pharma.campaign.sequencing
 */

import type { ConstraintEvaluationResult } from '@PCP/planning-core';
import { asConstraintId } from '@PCP/planning-core';
import type {
  IConstraintPlugin,
  ConstraintContext,
  ConstraintMetadata,
  ConstraintSelfTestResult,
} from '@PCP/planning-constraints';
import { buildPassResult, buildWarnResult } from '@PCP/planning-constraints';
import {
  primaryResourceId,
  resolveCampaignId,
} from '../constraint-helpers.js';

const META: ConstraintMetadata = {
  id: asConstraintId('pharma.campaign.sequencing'),
  version: '1.0.0',
  name: 'Campaign Sequencing Check',
  description:
    'Recommends grouping orders from the same campaign on shared resources to minimize changeovers.',
  domain: 'PHARMA',
  defaultSeverity: 'RECOMMENDATION',
  validationRefs: [
    { type: 'URS', id: 'URS-PH-011', description: 'Prefer campaign-aligned sequencing on shared lines' },
    { type: 'FS', id: 'FS-PH-050', description: 'Compare campaignId across sibling orders on same resource' },
  ],
  author: 'Pharma Collective Platform Contributors',
  license: 'Apache-2.0',
  tags: ['pharma', 'campaign', 'sequencing', 'changeover'],
};

export class PharmaCampaignSequencingConstraint implements IConstraintPlugin {
  readonly metadata = META;

  async evaluate(ctx: ConstraintContext): Promise<ConstraintEvaluationResult> {
    const { order, siblingOrders } = ctx;
    const campaignId = resolveCampaignId(order);
    const resourceId = primaryResourceId(order);

    if (!campaignId || !resourceId) {
      return buildPassResult(
        META,
        `Order ${order.id}: campaign or resource not defined — sequencing check skipped.`,
        { campaignId: campaignId ?? null, resourceId: resourceId ?? null },
      );
    }

    const conflicting = siblingOrders.filter(sibling => {
      if (resolveCampaignId(sibling) === campaignId) {
        return false;
      }
      const siblingResource = primaryResourceId(sibling);
      return siblingResource === resourceId;
    });

    if (conflicting.length === 0) {
      return buildPassResult(
        META,
        `Order ${order.id}: no campaign conflict on resource ${resourceId}.`,
        { campaignId, resourceId, conflictingOrders: [] },
      );
    }

    return buildWarnResult(
      META,
      `Campaign sequencing: ${conflicting.length} order(s) on ${resourceId} use a different campaign`,
      `Order ${order.id} (campaign ${campaignId}) shares resource ${resourceId} with orders from other campaigns: ` +
        `${conflicting.map(o => o.id).join(', ')}. Grouping by campaign reduces changeover risk.`,
      'Resequence orders to run campaign blocks together on the same resource.',
      0.6,
      {
        campaignId,
        resourceId,
        conflictingOrderIds: conflicting.map(o => o.id),
      },
    );
  }

  async selfTest(): Promise<ConstraintSelfTestResult> {
    const start = Date.now();
    const now = new Date();
    const resource = 'RES-MFG-001' as never;

    const mk = (id: string, campaign: string): ConstraintContext['order'] => ({
      id: id as never,
      materialId: 'MAT-1' as never,
      quantity: 1,
      unit: 'KG',
      priority: 'NORMAL',
      status: 'RELEASED',
      earliestStart: now,
      latestFinish: new Date(now.getTime() + 86_400_000),
      durationMinutes: 60,
      operations: [
        {
          id: 'OP-1' as never,
          orderId: id as never,
          sequence: 10,
          type: 'RUN',
          description: 'Run',
          resourceId: resource,
          durationMinutes: 60,
          setupMinutes: 0,
          teardownMinutes: 0,
          minLagMinutes: 0,
        },
      ],
      tags: { campaign },
      schedulingStatus: 'PENDING',
      metadata: {},
      createdAt: now,
      updatedAt: now,
    });

    const order = mk('ORD-A', 'CAMPAIGN-A');
    const sibling = mk('ORD-B', 'CAMPAIGN-B');

    const result = await this.evaluate({
      order,
      siblingOrders: [sibling],
      resources: [],
      batches: [],
      materials: [],
      inventory: [],
      evaluationTime: now,
      extensions: {},
    });

    const passed = result.severity === 'WARNING' && result.score < 1;

    return {
      pluginId: META.id,
      pluginVersion: META.version,
      passed,
      testsPassed: passed ? 1 : 0,
      testsFailed: passed ? 0 : 1,
      failedTests: passed
        ? []
        : [{ name: 'campaign-conflict-warning', expected: 'warning', actual: result.severity }],
      durationMs: Date.now() - start,
    };
  }
}
