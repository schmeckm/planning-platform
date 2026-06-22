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
} from '@PCP/planning-core';
import type { AdapterOrderFilter } from '../interfaces/adapter.interface.js';
import type {
  SapProductionOrder,
  SapWorkCenter,
  SapMaterial,
  SapBatch,
  SapInventory,
  SapODataProductionOrderRow,
  SapODataOperationRow,
  SapODataWorkCenterRow,
  SapODataProductRow,
  SapODataBatchRow,
  SapODataStockRow,
} from './sap-s4.types.js';

export const SAP_STATUS_MAP: Record<string, PlanningOrder['status']> = {
  CRTD: 'DRAFT',
  REL: 'RELEASED',
  PCNF: 'IN_PROCESS',
  CNF: 'COMPLETED',
  TECO: 'COMPLETED',
  DLFL: 'CANCELLED',
};

export function parseSapDate(value: string | undefined | null): Date | undefined {
  if (!value || value === '00000000') return undefined;
  if (/^\d{8}$/.test(value)) {
    const y = parseInt(value.substring(0, 4), 10);
    const m = parseInt(value.substring(4, 6), 10) - 1;
    const d = parseInt(value.substring(6, 8), 10);
    return new Date(y, m, d);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function parseSapODataDate(value: string | undefined): string {
  if (!value) return '00000000';
  if (/^\d{8}$/.test(value)) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '00000000';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function toNumber(value: string | number | undefined): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  return 0;
}

function mapPriority(priok?: string): OrderPriority {
  switch (priok) {
    case '1': return 'CRITICAL';
    case '2': return 'HIGH';
    case '3': return 'NORMAL';
    default: return 'LOW';
  }
}

function deriveSapStatus(row: SapODataProductionOrderRow): string {
  if (row.OrderIsDeleted) return 'DLFL';
  if (row.OrderIsDelivered || row.OrderIsConfirmed) return 'CNF';
  if (row.OrderIsReleased) return 'REL';
  return 'CRTD';
}

export function mapODataProductionOrder(row: SapODataProductionOrderRow): SapProductionOrder {
  const operations = (row.to_ProductionOrderOperation?.results ?? []).map(mapODataOperation);
  return {
    AUFNR: row.ManufacturingOrder ?? '',
    MATNR: row.Material ?? '',
    CHARG: row.Batch ?? '',
    MENGE: toNumber(row.TotalOrderQuantity),
    GMEIN: row.ProductionUnit ?? 'EA',
    GLTRP: parseSapODataDate(row.MfgOrderPlannedEndDate),
    GSTRS: parseSapODataDate(row.MfgOrderPlannedStartDate),
    FTRMS: parseSapODataDate(row.MfgOrderPlannedStartDate),
    DISPO: row.MRPController ?? '',
    WERKS: row.ProductionPlant ?? '',
    STATU: deriveSapStatus(row),
    OPERATIONS: operations,
  };
}

function mapODataOperation(row: SapODataOperationRow) {
  const setup = toNumber(row.SetupDuration);
  const run = toNumber(row.ProcessingDuration);
  const teardown = toNumber(row.TeardownDuration);
  return {
    VORNR: row.ManufacturingOrderOperation ?? '0010',
    LTXA1: row.OperationDescription ?? 'Operation',
    ARBPL: row.WorkCenter ?? '',
    VGW01: setup,
    VGW02: run,
    VGW03: teardown,
    ARBEI: setup + run + teardown || toNumber(row.OpPlannedTotalQuantity) || 60,
  };
}

export function mapODataWorkCenter(row: SapODataWorkCenterRow): SapWorkCenter {
  return {
    ARBPL: row.WorkCenter ?? '',
    KTEXT: row.WorkCenterDesc ?? row.WorkCenter ?? '',
    WERKS: row.Plant ?? '',
  };
}

export function mapODataProduct(row: SapODataProductRow): SapMaterial {
  const mat: SapMaterial = {
    MATNR: row.Product ?? '',
    MAKTX: row.ProductDescription ?? row.Product ?? '',
    MEINS: row.BaseUnit ?? 'EA',
  };
  const shelf = toNumber(row.TotalShelfLife);
  if (shelf > 0) mat.MHDHB = shelf;
  return mat;
}

export function mapODataBatch(row: SapODataBatchRow): SapBatch {
  return {
    CHARG: row.Batch ?? '',
    MATNR: row.Material ?? '',
    WERKS: row.Plant ?? row.BatchIdentifyingPlant ?? '',
    CLABS: 0,
    MEINS: 'EA',
    VFDAT: parseSapODataDate(row.ShelfLifeExpirationDate),
    HSDAT: parseSapODataDate(row.ManufactureDate),
    STATUS: row.BatchStatus ?? 'RELEASED',
  };
}

export function mapODataStock(row: SapODataStockRow): SapInventory {
  return {
    MATNR: row.Material ?? '',
    WERKS: row.Plant ?? '',
    LGORT: row.StorageLocation ?? '0001',
    CLABS: toNumber(row.MatlWrhsStkQtyInMatlBaseUnit),
    MEINS: row.MaterialBaseUnit ?? 'EA',
  };
}

export function mapSapOrder(sap: SapProductionOrder, filter?: AdapterOrderFilter): PlanningOrder | null {
  if (filter?.plant && sap.WERKS !== filter.plant) return null;
  if (filter?.statuses?.length && !filter.statuses.includes(sap.STATU)) return null;

  const now = new Date();
  const earliestStart = parseSapDate(sap.GSTRS) ?? now;
  const latestFinish = parseSapDate(sap.GLTRP) ?? new Date(now.getTime() + 86_400_000 * 30);

  if (filter?.dueBefore && latestFinish > filter.dueBefore) return null;
  if (filter?.dueAfter && latestFinish < filter.dueAfter) return null;

  const totalDuration = sap.OPERATIONS.reduce((s, o) => s + o.ARBEI, 0) || 480;

  return {
    id: asOrderId(`SAP-${sap.AUFNR}`),
    externalId: sap.AUFNR,
    sourceSystem: 'SAP-S4',
    materialId: asMaterialId(sap.MATNR),
    ...(sap.CHARG ? { batchId: asBatchId(sap.CHARG) } : {}),
    quantity: sap.MENGE,
    unit: sap.GMEIN,
    priority: mapPriority(sap.PRIOK),
    status: SAP_STATUS_MAP[sap.STATU] ?? 'DRAFT',
    earliestStart,
    latestFinish,
    durationMinutes: totalDuration,
    operations: sap.OPERATIONS.map((op, idx) => ({
      id: asOperationId(`SAP-${sap.AUFNR}-${op.VORNR}`),
      orderId: asOrderId(`SAP-${sap.AUFNR}`),
      sequence: parseInt(op.VORNR, 10) || (idx + 1) * 10,
      type: 'RUN' as const,
      description: op.LTXA1,
      ...(op.ARBPL ? { resourceId: asResourceId(`SAP-WC-${op.ARBPL}`) } : {}),
      durationMinutes: op.ARBEI,
      setupMinutes: op.VGW01,
      teardownMinutes: op.VGW03,
      minLagMinutes: 0,
    })),
    tags: {
      plant: sap.WERKS,
      mrpController: sap.DISPO,
      sourceSystem: 'SAP-S4',
    },
    schedulingStatus: 'PENDING',
    metadata: { sapOrderNumber: sap.AUFNR },
    createdAt: now,
    updatedAt: now,
  };
}

export function mapSapWorkCenter(wc: SapWorkCenter): PlanningResource {
  return {
    id: asResourceId(`SAP-WC-${wc.ARBPL}`),
    name: wc.KTEXT,
    type: 'MACHINE',
    capacity: wc.KAPAZ ?? 1,
    parallelCapacity: 1,
    oee: 0.85,
    qualifiedMaterials: [],
    attributes: {
      plant: wc.WERKS,
      workCenter: wc.ARBPL,
      sourceSystem: 'SAP-S4',
    },
  };
}

export function mapSapMaterial(mat: SapMaterial): PlanningMaterial {
  return {
    id: asMaterialId(mat.MATNR),
    name: mat.MAKTX,
    description: mat.MAKTX,
    unit: mat.MEINS,
    ...(mat.MHDHB ? { shelfLifeDays: mat.MHDHB } : {}),
    requiresBatchRelease: true,
    isPatientSpecific: false,
    attributes: { sourceSystem: 'SAP-S4' },
  };
}

const SAP_BATCH_STATUS: Record<string, PlanningBatch['status']> = {
  RELEASED: 'RELEASED',
  RESTRICTED: 'QA_HOLD',
  BLOCKED: 'QC_HOLD',
  X: 'RELEASED',
};

export function mapSapBatch(batch: SapBatch): PlanningBatch {
  const expiry = parseSapDate(batch.VFDAT);
  const manufacture = parseSapDate(batch.HSDAT);
  return {
    id: asBatchId(batch.CHARG),
    materialId: asMaterialId(batch.MATNR),
    quantity: batch.CLABS,
    unit: batch.MEINS,
    status: SAP_BATCH_STATUS[batch.STATUS] ?? 'RELEASED',
    ...(manufacture ? { manufactureDate: manufacture } : {}),
    ...(expiry ? { expiryDate: expiry } : {}),
    availableFrom: manufacture ?? new Date(),
    locationId: batch.WERKS,
    attributes: { sourceSystem: 'SAP-S4', plant: batch.WERKS },
  };
}

export function mapSapInventory(stock: SapInventory): InventoryPosition {
  return {
    materialId: asMaterialId(stock.MATNR),
    locationId: `${stock.WERKS}-${stock.LGORT}`,
    quantityOnHand: stock.CLABS,
    quantityReserved: 0,
    quantityAvailable: stock.CLABS,
    unit: stock.MEINS,
    lastUpdated: new Date(),
  };
}
