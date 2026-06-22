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
  ErpNextWorkOrder,
  ErpNextWorkstation,
  ErpNextItem,
  ErpNextBatch,
  ErpNextBin,
} from './erpnext.types.js';
import { ERPNEXT_WO_STATUS_MAP } from './erpnext.mapper.js';

const SAP_STATUS_TO_ORDER: Record<string, PlanningOrder['status']> = {
  CRTD: 'DRAFT',
  REL: 'RELEASED',
  PCNF: 'IN_PROCESS',
  CNF: 'COMPLETED',
  DLFL: 'CANCELLED',
};

function parseDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function mapPriority(priority?: string): OrderPriority {
  switch ((priority ?? '').toLowerCase()) {
    case 'urgent':
    case 'high': return 'HIGH';
    case 'medium':
    case 'normal': return 'NORMAL';
    case 'low': return 'LOW';
    default: return 'NORMAL';
  }
}

export function mapErpNextOrder(wo: ErpNextWorkOrder, filter?: AdapterOrderFilter): PlanningOrder | null {
  const sapStatus = ERPNEXT_WO_STATUS_MAP[wo.status] ?? 'CRTD';
  if (filter?.statuses?.length && !filter.statuses.includes(sapStatus)) return null;

  const now = new Date();
  const earliestStart = parseDate(wo.planned_start_date) ?? now;
  const latestFinish = parseDate(wo.planned_end_date) ?? new Date(now.getTime() + 86_400_000 * 14);

  if (filter?.dueBefore && latestFinish > filter.dueBefore) return null;
  if (filter?.dueAfter && latestFinish < filter.dueAfter) return null;

  const durationMinutes = wo.operations.reduce((s, op) => s + op.time_in_mins, 0) || 480;

  return {
    id: asOrderId(`ERP-${wo.name}`),
    externalId: wo.name,
    sourceSystem: 'ERPNEXT',
    materialId: asMaterialId(wo.production_item),
    quantity: wo.qty,
    unit: wo.stock_uom,
    priority: mapPriority(wo.priority),
    status: SAP_STATUS_TO_ORDER[sapStatus] ?? 'DRAFT',
    earliestStart,
    latestFinish,
    durationMinutes,
    operations: wo.operations.map(op => ({
      id: asOperationId(`ERP-${wo.name}-${op.idx}`),
      orderId: asOrderId(`ERP-${wo.name}`),
      sequence: op.idx * 10,
      type: 'RUN' as const,
      description: op.description ?? op.operation,
      ...(op.workstation ? { resourceId: asResourceId(`ERP-WS-${op.workstation}`) } : {}),
      durationMinutes: op.time_in_mins,
      setupMinutes: 0,
      teardownMinutes: 0,
      minLagMinutes: 0,
    })),
    tags: {
      company: wo.company,
      erpnextStatus: wo.status,
      sourceSystem: 'ERPNEXT',
    },
    schedulingStatus: 'PENDING',
    metadata: { workOrder: wo.name },
    createdAt: now,
    updatedAt: now,
  };
}

export function mapErpNextWorkstation(ws: ErpNextWorkstation): PlanningResource {
  return {
    id: asResourceId(`ERP-WS-${ws.name}`),
    name: ws.workstation_name,
    type: 'MACHINE',
    capacity: ws.production_capacity ?? 1,
    parallelCapacity: 1,
    oee: 0.82,
    qualifiedMaterials: [],
    attributes: {
      workstation: ws.name,
      sourceSystem: 'ERPNEXT',
    },
  };
}

export function mapErpNextItem(item: ErpNextItem): PlanningMaterial {
  return {
    id: asMaterialId(item.name),
    name: item.item_name,
    description: item.item_name,
    unit: item.stock_uom,
    ...(item.shelf_life_in_days ? { shelfLifeDays: item.shelf_life_in_days } : {}),
    requiresBatchRelease: item.has_batch_no === 1,
    isPatientSpecific: false,
    attributes: { sourceSystem: 'ERPNEXT' },
  };
}

export function mapErpNextBatch(batch: ErpNextBatch): PlanningBatch {
  const expiry = parseDate(batch.expiry_date);
  const manufacture = parseDate(batch.manufacturing_date);
  const isHold = batch.batch_id.includes('HOLD');
  return {
    id: asBatchId(batch.batch_id),
    materialId: asMaterialId(batch.item),
    quantity: batch.batch_qty,
    unit: batch.stock_uom,
    status: isHold ? 'QC_HOLD' : 'RELEASED',
    ...(manufacture ? { manufactureDate: manufacture } : {}),
    ...(expiry ? { expiryDate: expiry } : {}),
    availableFrom: manufacture ?? new Date(),
    attributes: { sourceSystem: 'ERPNEXT' },
  };
}

export function mapErpNextBin(bin: ErpNextBin): InventoryPosition {
  return {
    materialId: asMaterialId(bin.item_code),
    locationId: bin.warehouse,
    quantityOnHand: bin.actual_qty,
    quantityReserved: 0,
    quantityAvailable: bin.actual_qty,
    unit: bin.stock_uom,
    lastUpdated: new Date(),
  };
}
