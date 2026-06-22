/** Vendor-neutral production sequencing fixture / API shapes (no ERP vendor field names in public API). */

export interface PsOperationRow {
  sequence: number;
  workCenterId: string;
  description: string;
  setupMinutes: number;
  runMinutes: number;
  teardownMinutes: number;
  minLagMinutes: number;
  maxLagMinutes?: number;
}

export interface PsProductionOrderRow {
  orderId: string;
  materialId: string;
  batchId?: string;
  plantId: string;
  quantity: number;
  unit: string;
  status: 'PLANNED' | 'RELEASED' | 'IN_PROCESS';
  priority: 1 | 2 | 3 | 4;
  earliestStart: string;
  latestFinish: string;
  /** Feeder / component order for pegging (supply chain link). */
  peggedSupplyOrderId?: string;
  /** Campaign or sequence group on a shared line. */
  sequenceGroup?: string;
  /** Previous product on line — used with setup matrix for extra setup time. */
  previousMaterialId?: string;
  operations: PsOperationRow[];
}

export interface PsWorkCenterRow {
  workCenterId: string;
  name: string;
  plantId: string;
  capacityPerHour: number;
  parallelCapacity: number;
}

export interface PsMaterialRow {
  materialId: string;
  name: string;
  unit: string;
  shelfLifeDays?: number;
}

export interface PsBatchRow {
  batchId: string;
  materialId: string;
  quantity: number;
  unit: string;
  status: 'RELEASED' | 'BLOCKED' | 'QUARANTINE';
  expiryDate: string;
  manufactureDate: string;
}

export interface PsInventoryRow {
  materialId: string;
  locationId: string;
  quantityAvailable: number;
  unit: string;
}

/** Sequence-dependent setup minutes: fromMaterial → toMaterial on shared equipment. */
export type PsSetupMatrix = Record<string, Record<string, number>>;

export type ProductionSequencingMode = 'fixture' | 'api';

export interface ProductionSequencingConfig {
  mode: ProductionSequencingMode;
  baseUrl: string;
  plant: string;
  timeoutMs: number;
}
