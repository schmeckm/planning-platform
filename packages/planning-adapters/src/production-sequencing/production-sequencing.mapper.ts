import {
  asOrderId,
  asResourceId,
  asMaterialId,
  asBatchId,
  asOperationId,
} from '@PCP/planning-core';
import type {
  PlanningOrder,
  PlanningResource,
  PlanningMaterial,
  PlanningBatch,
  InventoryPosition,
  OrderPriority,
  BatchStatus,
} from '@PCP/planning-core';
import type { AdapterOrderFilter } from '../interfaces/adapter.interface.js';
import type {
  PsProductionOrderRow,
  PsWorkCenterRow,
  PsMaterialRow,
  PsBatchRow,
  PsInventoryRow,
  PsSetupMatrix,
} from './production-sequencing.types.js';

function parseDate(iso: string): Date {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function mapPriority(p: 1 | 2 | 3 | 4): OrderPriority {
  switch (p) {
    case 1: return 'CRITICAL';
    case 2: return 'HIGH';
    case 3: return 'NORMAL';
    default: return 'LOW';
  }
}

function mapBatchStatus(status: PsBatchRow['status']): BatchStatus {
  switch (status) {
    case 'RELEASED': return 'RELEASED';
    case 'BLOCKED': return 'QA_HOLD';
    case 'QUARANTINE': return 'QUARANTINE';
    default: return 'PLANNED';
  }
}

function resolveSequenceSetupMinutes(
  previousMaterialId: string | undefined,
  nextMaterialId: string,
  baseSetupMinutes: number,
  matrix: PsSetupMatrix,
): number {
  if (!previousMaterialId) {
    return baseSetupMinutes;
  }
  const extra = matrix[previousMaterialId]?.[nextMaterialId] ?? 0;
  return baseSetupMinutes + extra;
}

export function mapPsOrder(
  row: PsProductionOrderRow,
  setupMatrix: PsSetupMatrix,
  filter?: AdapterOrderFilter,
): PlanningOrder | null {
  if (filter?.plant && row.plantId !== filter.plant) {
    return null;
  }

  const earliestStart = parseDate(row.earliestStart);
  const latestFinish = parseDate(row.latestFinish);
  const totalMinutes = row.operations.reduce(
    (sum, op) => sum + op.setupMinutes + op.runMinutes + op.teardownMinutes,
    0,
  );

  const firstOpSetup = row.operations[0]
    ? resolveSequenceSetupMinutes(
        row.previousMaterialId,
        row.materialId,
        row.operations[0].setupMinutes,
        setupMatrix,
      )
    : 0;

  const operations = row.operations.map(op => {
    const setupMinutes =
      op.sequence === row.operations[0]?.sequence
        ? firstOpSetup
        : op.setupMinutes;

    return {
      id: asOperationId(`${row.orderId}-OP-${op.sequence}`),
      orderId: asOrderId(row.orderId),
      sequence: op.sequence,
      type: 'RUN' as const,
      description: op.description,
      resourceId: asResourceId(op.workCenterId),
      durationMinutes: setupMinutes + op.runMinutes + op.teardownMinutes,
      setupMinutes,
      teardownMinutes: op.teardownMinutes,
      minLagMinutes: op.minLagMinutes,
      ...(op.maxLagMinutes !== undefined ? { maxLagMinutes: op.maxLagMinutes } : {}),
    };
  });

  const now = new Date();
  return {
    id: asOrderId(row.orderId),
    externalId: row.orderId,
    sourceSystem: 'PROD-SEQ',
    materialId: asMaterialId(row.materialId),
    ...(row.batchId ? { batchId: asBatchId(row.batchId) } : {}),
    quantity: row.quantity,
    unit: row.unit,
    priority: mapPriority(row.priority),
    status: row.status === 'PLANNED' ? 'DRAFT' : row.status === 'IN_PROCESS' ? 'IN_PROCESS' : 'RELEASED',
    earliestStart,
    latestFinish,
    durationMinutes: totalMinutes || 60,
    operations,
    tags: {
      plant: row.plantId,
      ...(row.sequenceGroup ? { sequenceGroup: row.sequenceGroup } : {}),
      ...(row.previousMaterialId ? { previousMaterialId: row.previousMaterialId } : {}),
    },
    schedulingStatus: 'PENDING',
    metadata: {
      ...(row.peggedSupplyOrderId ? { peggedSupplyOrderId: row.peggedSupplyOrderId } : {}),
      ...(row.previousMaterialId ? { previousMaterialId: row.previousMaterialId } : {}),
      sequenceDependentSetupMinutes: firstOpSetup,
    },
    createdAt: now,
    updatedAt: now,
  };
}

export function mapPsWorkCenter(row: PsWorkCenterRow): PlanningResource {
  return {
    id: asResourceId(row.workCenterId),
    name: row.name,
    type: 'MACHINE',
    capacity: row.capacityPerHour,
    parallelCapacity: row.parallelCapacity,
    oee: 0.85,
    qualifiedMaterials: [],
    attributes: {
      plant: row.plantId,
      sourceSystem: 'PROD-SEQ',
    },
  };
}

export function mapPsMaterial(row: PsMaterialRow): PlanningMaterial {
  return {
    id: asMaterialId(row.materialId),
    name: row.name,
    description: row.name,
    unit: row.unit,
    ...(row.shelfLifeDays !== undefined ? { shelfLifeDays: row.shelfLifeDays } : {}),
    requiresBatchRelease: true,
    isPatientSpecific: false,
    attributes: { sourceSystem: 'PROD-SEQ' },
  };
}

export function mapPsBatch(row: PsBatchRow): PlanningBatch {
  const manufactureDate = parseDate(row.manufactureDate);
  return {
    id: asBatchId(row.batchId),
    materialId: asMaterialId(row.materialId),
    quantity: row.quantity,
    unit: row.unit,
    status: mapBatchStatus(row.status),
    manufactureDate,
    expiryDate: parseDate(row.expiryDate),
    ...(row.status === 'RELEASED' ? { releaseDate: manufactureDate } : {}),
    availableFrom: manufactureDate,
    attributes: { sourceSystem: 'PROD-SEQ' },
  };
}

export function mapPsInventory(row: PsInventoryRow): InventoryPosition {
  return {
    materialId: asMaterialId(row.materialId),
    locationId: row.locationId,
    quantityOnHand: row.quantityAvailable,
    quantityReserved: 0,
    quantityAvailable: row.quantityAvailable,
    unit: row.unit,
    lastUpdated: new Date(),
  };
}
