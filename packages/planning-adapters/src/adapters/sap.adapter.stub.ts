/**
 * planning-adapters / sap.adapter.stub.ts
 *
 * SAP S/4HANA + ECC adapter stub.
 *
 * This is a stub / interface skeleton. The actual SAP OData/RFC calls
 * are project-specific and require SAP credentials and system access.
 *
 * The mapping logic below shows HOW SAP data structures map to the
 * canonical planning model – the critical architectural decision.
 *
 * SAP PP/DS fields → Canonical Model:
 *   AUFNR (Order Number)      → PlanningOrder.externalId
 *   MATNR (Material Number)   → PlanningOrder.materialId
 *   CHARG (Batch Number)      → PlanningBatch.id
 *   MENGE (Quantity)          → PlanningOrder.quantity
 *   DISPO (MRP Controller)    → PlanningOrder.tags.mrpController
 *   WERKS (Plant)             → PlanningOrder.tags.plant
 *   ARBPL (Work Center)       → PlanningResource.externalId
 *   VGWTS (Standard Values)   → PlanningOperation.durationMinutes
 */

import type {
  PlanningOrder,
  PlanningResource,
  PlanningMaterial,
  PlanningBatch,
  InventoryPosition,
  WorkingCalendar,
} from '@PCP/planning-core';
import {
  asOrderId,
  asResourceId,
  asMaterialId,
  asBatchId,
  asOperationId,
} from '@PCP/planning-core';
import type {
  IPlanningAdapter,
  AdapterMetadata,
  AdapterHealthResult,
  AdapterOrderFilter,
} from '../interfaces/adapter.interface.js';
import { NotImplementedError } from '../interfaces/adapter.interface.js';

interface SapProductionOrder {
  AUFNR: string;
  MATNR: string;
  CHARG: string;
  MENGE: number;
  GMEIN: string;
  GLTRP: string; // Scheduled finish date YYYYMMDD
  GSTRS: string; // Scheduled start date YYYYMMDD
  FTRMS: string; // Latest start YYYYMMDD
  DISPO: string;
  WERKS: string;
  STATU: string; // Status e.g. 'REL', 'CRTD', 'CNF'
  OPERATIONS: SapOperation[];
}

interface SapOperation {
  VORNR: string; // Operation number
  LTXA1: string; // Short text
  ARBPL: string; // Work center
  VGW01: number; // Setup time (min)
  VGW02: number; // Machine time (min)
  VGW03: number; // Teardown time (min)
  ARBEI: number; // Duration (min)
}

const SAP_STATUS_MAP: Record<string, PlanningOrder['status']> = {
  CRTD: 'DRAFT',
  REL:  'RELEASED',
  PCNF: 'IN_PROCESS',
  CNF:  'COMPLETED',
  TECO: 'COMPLETED',
  DLFL: 'CANCELLED',
};

export class SapS4PlanningAdapter implements IPlanningAdapter {
  readonly metadata: AdapterMetadata = {
    id: 'sap.s4hana',
    name: 'SAP S/4HANA Planning Adapter',
    version: '0.1.0-stub',
    sourceSystem: 'SAP-S4',
    description:
      'Maps SAP S/4HANA Production Orders (PP), Work Centers, Materials, and Batches ' +
      'to the Pharma Collective Platform canonical model. STUB – implement OData calls.',
    author: 'Pharma Collective Platform Contributors',
  };

  constructor(
    private readonly config: {
      baseUrl: string;
      client: string;
      plant: string;
    },
  ) {}

  async testConnection(): Promise<AdapterHealthResult> {
    // TODO: Call SAP OData ping endpoint
    // GET /sap/opu/odata/sap/API_PRODUCTION_ORDER_SRV/$metadata
    return {
      healthy: false,
      message: 'SAP adapter is a stub. Implement OData connection.',
      detail: { config: this.config },
    };
  }

  async fetchOrders(filter?: AdapterOrderFilter): Promise<PlanningOrder[]> {
    // TODO: Call SAP OData API_PRODUCTION_ORDER_SRV
    // GET /sap/opu/odata/sap/API_PRODUCTION_ORDER_SRV/A_ProductionOrder?$filter=Plant eq '${plant}'
    const sapOrders: SapProductionOrder[] = await this.callSapOData<SapProductionOrder[]>(
      '/A_ProductionOrder',
      { Plant: this.config.plant },
    );

    return sapOrders.map(o => this.mapOrder(o, filter));
  }

  async fetchResources(): Promise<PlanningResource[]> {
    throw new NotImplementedError('fetchResources', this.metadata.id);
  }

  async fetchMaterials(): Promise<PlanningMaterial[]> {
    throw new NotImplementedError('fetchMaterials', this.metadata.id);
  }

  async fetchBatches(): Promise<PlanningBatch[]> {
    throw new NotImplementedError('fetchBatches', this.metadata.id);
  }

  async fetchInventory(): Promise<InventoryPosition[]> {
    throw new NotImplementedError('fetchInventory', this.metadata.id);
  }

  async fetchCalendars(): Promise<WorkingCalendar[]> {
    throw new NotImplementedError('fetchCalendars', this.metadata.id);
  }

  /** Maps a SAP Production Order to the canonical PlanningOrder. */
  private mapOrder(sap: SapProductionOrder, _filter?: AdapterOrderFilter): PlanningOrder {
    const now = new Date();
    const earliestStart = this.parseSapDate(sap.GSTRS) ?? now;
    const latestFinish = this.parseSapDate(sap.GLTRP) ?? new Date(now.getTime() + 86_400_000 * 30);

    const totalDuration = sap.OPERATIONS.reduce((s, o) => s + o.ARBEI, 0) || 480;

    return {
      id: asOrderId(`SAP-${sap.AUFNR}`),
      externalId: sap.AUFNR,
      sourceSystem: 'SAP-S4',
      materialId: asMaterialId(sap.MATNR),
      ...(sap.CHARG ? { batchId: asBatchId(sap.CHARG) } : {}),
      quantity: sap.MENGE,
      unit: sap.GMEIN,
      priority: 'NORMAL',
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
      metadata: { sapRaw: sap },
      createdAt: now,
      updatedAt: now,
    };
  }

  private parseSapDate(yyyymmdd: string): Date | undefined {
    if (!yyyymmdd || yyyymmdd === '00000000') return undefined;
    const y = parseInt(yyyymmdd.substring(0, 4), 10);
    const m = parseInt(yyyymmdd.substring(4, 6), 10) - 1;
    const d = parseInt(yyyymmdd.substring(6, 8), 10);
    return new Date(y, m, d);
  }

  /**
   * Stub for SAP OData API call.
   * Replace with actual HTTP client (axios, fetch, SAP cloud SDK).
   */
  private async callSapOData<T>(_path: string, _params: Record<string, string>): Promise<T> {
    throw new Error(
      `SAP OData call not implemented. Configure the SAP adapter with real credentials. ` +
        `Endpoint: ${this.config.baseUrl}${_path}`,
    );
  }
}
