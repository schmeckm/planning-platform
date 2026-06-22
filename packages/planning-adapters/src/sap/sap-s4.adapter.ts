/**
 * SAP S/4HANA planning adapter — fixture mode (demo) + OData mode (live).
 */

import type {
  PlanningOrder,
  PlanningResource,
  PlanningMaterial,
  PlanningBatch,
  InventoryPosition,
  WorkingCalendar,
} from '@PCP/planning-core';
import type {
  IPlanningAdapter,
  AdapterMetadata,
  AdapterHealthResult,
  AdapterOrderFilter,
  AdapterBatchFilter,
} from '../interfaces/adapter.interface.js';
import { NotImplementedError } from '../interfaces/adapter.interface.js';
import { SAP_S4_FIXTURES } from './sap-s4.fixtures.js';
import {
  mapSapOrder,
  mapSapWorkCenter,
  mapSapMaterial,
  mapSapBatch,
  mapSapInventory,
  mapODataProductionOrder,
  mapODataWorkCenter,
  mapODataProduct,
  mapODataBatch,
  mapODataStock,
} from './sap-s4.mapper.js';
import type {
  SapODataProductionOrderRow,
  SapODataWorkCenterRow,
  SapODataProductRow,
  SapODataBatchRow,
  SapODataStockRow,
} from './sap-s4.types.js';
import { resolveSapS4Config, SapODataClient, type SapS4AdapterConfig } from './sap-s4.odata.js';

export class SapS4PlanningAdapter implements IPlanningAdapter {
  readonly metadata: AdapterMetadata = {
    id: 'sap.s4hana',
    name: 'SAP S/4HANA Planning Adapter',
    version: '0.2.0',
    sourceSystem: 'SAP-S4',
    description:
      'Maps SAP S/4HANA production orders, work centers, materials, batches, and stock ' +
      'to the PCP canonical model. Fixture mode for demo; OData mode for live systems.',
    author: 'Pharma Collective Platform Contributors',
  };

  private readonly odata: SapODataClient;

  constructor(private readonly config: SapS4AdapterConfig) {
    this.odata = new SapODataClient(config);
  }

  async testConnection(): Promise<AdapterHealthResult> {
    if (this.config.mode === 'fixture') {
      return {
        healthy: true,
        message: 'SAP adapter running in fixture mode (no live SAP connection).',
        latencyMs: 0,
        detail: { mode: 'fixture', plant: this.config.plant },
      };
    }

    if (!this.config.baseUrl) {
      return {
        healthy: false,
        message: 'SAP_BASE_URL is required for OData mode.',
      };
    }

    const ping = await this.odata.ping();
    return {
      healthy: ping.ok,
      message: ping.message,
      latencyMs: ping.latencyMs,
      detail: { mode: 'odata', baseUrl: this.config.baseUrl, plant: this.config.plant },
    };
  }

  async fetchOrders(filter?: AdapterOrderFilter): Promise<PlanningOrder[]> {
    const plant = filter?.plant ?? this.config.plant;
    const raw =
      this.config.mode === 'fixture'
        ? SAP_S4_FIXTURES.orders.filter(o => o.WERKS === plant)
        : await this.fetchODataOrders(plant);

    return raw
      .map(o => mapSapOrder(o, filter))
      .filter((o): o is PlanningOrder => o !== null);
  }

  async fetchResources(): Promise<PlanningResource[]> {
    const raw =
      this.config.mode === 'fixture'
        ? SAP_S4_FIXTURES.workCenters
        : await this.odata.getCollection<SapODataWorkCenterRow>(
            '/sap/opu/odata/sap/API_WORK_CENTER_SRV/A_WorkCenter',
            `$filter=Plant eq '${this.config.plant}'`,
          ).then(rows => rows.map(mapODataWorkCenter));

    return raw.map(mapSapWorkCenter);
  }

  async fetchMaterials(): Promise<PlanningMaterial[]> {
    const raw =
      this.config.mode === 'fixture'
        ? SAP_S4_FIXTURES.materials
        : await this.odata.getCollection<SapODataProductRow>(
            '/sap/opu/odata/sap/API_PRODUCT_SRV/A_Product',
            `$top=100`,
          ).then(rows => rows.map(mapODataProduct));

    return raw.map(mapSapMaterial);
  }

  async fetchBatches(filter?: AdapterBatchFilter): Promise<PlanningBatch[]> {
    const raw =
      this.config.mode === 'fixture'
        ? SAP_S4_FIXTURES.batches
        : await this.odata.getCollection<SapODataBatchRow>(
            '/sap/opu/odata/sap/API_BATCH_SRV/A_Batch',
            `$filter=Plant eq '${this.config.plant}'`,
          ).then(rows => rows.map(mapODataBatch));

    let batches = raw.map(mapSapBatch);
    if (filter?.materialIds?.length) {
      batches = batches.filter(b => filter.materialIds!.includes(String(b.materialId)));
    }
    if (filter?.statuses?.length) {
      batches = batches.filter(b => filter.statuses!.includes(b.status));
    }
    return batches;
  }

  async fetchInventory(): Promise<InventoryPosition[]> {
    const raw =
      this.config.mode === 'fixture'
        ? SAP_S4_FIXTURES.inventory
        : await this.odata.getCollection<SapODataStockRow>(
            '/sap/opu/odata/sap/API_MATERIAL_STOCK_SRV/A_MatlStkInMatlBaseUnit',
            `$filter=Plant eq '${this.config.plant}'`,
          ).then(rows => rows.map(mapODataStock));

    return raw.map(mapSapInventory);
  }

  async fetchCalendars(): Promise<WorkingCalendar[]> {
    throw new NotImplementedError('fetchCalendars', this.metadata.id);
  }

  private async fetchODataOrders(plant: string) {
    const rows = await this.odata.getCollection<SapODataProductionOrderRow>(
      '/sap/opu/odata/sap/API_PRODUCTION_ORDER_2_SRV/A_ProductionOrder_2',
      `$filter=ProductionPlant eq '${plant}'&$expand=to_ProductionOrderOperation`,
    );
    return rows.map(mapODataProductionOrder);
  }
}

/**
 * Creates the SAP S/4HANA adapter.
 * Defaults to fixture mode when SAP_BASE_URL is not set.
 */
export function createSapS4Adapter(config?: Partial<SapS4AdapterConfig>): SapS4PlanningAdapter {
  return new SapS4PlanningAdapter(resolveSapS4Config(config));
}
