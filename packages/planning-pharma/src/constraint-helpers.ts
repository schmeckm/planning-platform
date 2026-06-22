/**
 * Shared helpers for pharma constraint plugins.
 */

import type { PlanningBatch, PlanningOrder } from '@PCP/planning-core';
import type { InspectionLotStatus } from '@PCP/planning-core';

export function resolveDestinationCountry(order: PlanningOrder): string | undefined {
  if (order.destinationCountry) {
    return order.destinationCountry.toUpperCase();
  }
  const fromTags =
    order.tags['destinationCountry'] ??
    order.tags['hae.destinationCountry'] ??
    order.tags['market'];
  if (fromTags) {
    return fromTags.toUpperCase();
  }
  const meta = order.metadata['destinationCountry'];
  return typeof meta === 'string' && meta.length > 0 ? meta.toUpperCase() : undefined;
}

export function resolveApprovedCountries(batch: PlanningBatch): string[] {
  if (batch.approvedCountries?.length) {
    return batch.approvedCountries.map(c => c.toUpperCase());
  }
  const raw = batch.attributes['approvedCountries'];
  if (typeof raw === 'string' && raw.length > 0) {
    return raw.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
  }
  return [];
}

export function resolveInspectionLotStatus(batch: PlanningBatch): InspectionLotStatus | undefined {
  if (batch.inspectionLotStatus) {
    return batch.inspectionLotStatus;
  }
  const raw = batch.attributes['inspectionLotStatus'];
  if (raw === 'OPEN' || raw === 'RELEASED' || raw === 'REJECTED' || raw === 'SKIPPED') {
    return raw;
  }
  switch (batch.status) {
    case 'RELEASED':
      return 'RELEASED';
    case 'QC_HOLD':
    case 'QA_HOLD':
    case 'QUARANTINE':
      return 'OPEN';
    default:
      return undefined;
  }
}

export function resolvePreviousMaterialId(order: PlanningOrder): string | undefined {
  const meta = order.metadata['previousMaterialId'];
  if (typeof meta === 'string' && meta.length > 0) {
    return meta;
  }
  const tag = order.tags['previousMaterialId'];
  return tag && tag.length > 0 ? tag : undefined;
}

export function resolveCampaignId(order: PlanningOrder): string | undefined {
  return order.tags['campaign'] ?? order.tags['campaignId'] ?? undefined;
}

export function primaryResourceId(order: PlanningOrder): string | undefined {
  const op = order.operations.find(o => o.resourceId);
  return op?.resourceId;
}
