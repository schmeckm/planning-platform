/**
 * ERPNext adapter — fixture mode (demo) + Frappe REST API (live).
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
import { ERPNEXT_FIXTURES } from './erpnext.fixtures.js';
import { mapErpNextWorkOrderRow } from './erpnext.mapper.js';
import {
  mapErpNextOrder,
  mapErpNextWorkstation,
  mapErpNextItem,
  mapErpNextBatch,
  mapErpNextBin,
} from './erpnext.canonical.js';
import type {
  ErpNextWorkOrderRow,
  ErpNextWorkOrderOperationRow,
  ErpNextWorkstation,
  ErpNextItem,
  ErpNextBatch,
  ErpNextBin,
} from './erpnext.types.js';
import { resolveErpNextConfig, ErpNextApiClient, type ErpNextAdapterConfig } from './erpnext.api.js';

export class ErpNextPlanningAdapter implements IPlanningAdapter {
  readonly metadata: AdapterMetadata = {
    id: 'erpnext',
    name: 'ERPNext Planning Adapter',
    version: '0.1.0',
    sourceSystem: 'ERPNEXT',
    description:
      'Maps ERPNext Work Orders, Workstations, Items, Batches, and Bin stock ' +
      'to the PCP canonical model. Fixture mode for demo; REST API for live sites.',
    author: 'Pharma Collective Platform Contributors',
  };

  private readonly api: ErpNextApiClient;

  constructor(private readonly config: ErpNextAdapterConfig) {
    this.api = new ErpNextApiClient(config);
  }

  async testConnection(): Promise<AdapterHealthResult> {
    if (this.config.mode === 'fixture') {
      return {
        healthy: true,
        message: 'ERPNext adapter running in fixture mode (no live ERPNext connection).',
        latencyMs: 0,
        detail: { mode: 'fixture', company: this.config.company },
      };
    }

    const ping = await this.api.ping();
    return {
      healthy: ping.ok,
      message: ping.message,
      latencyMs: ping.latencyMs,
      detail: { mode: 'api', baseUrl: this.config.baseUrl, company: this.config.company },
    };
  }

  async fetchOrders(filter?: AdapterOrderFilter): Promise<PlanningOrder[]> {
    const raw =
      this.config.mode === 'fixture'
        ? ERPNEXT_FIXTURES.workOrders
        : await this.fetchApiWorkOrders();

    return raw
      .map(wo => mapErpNextOrder(wo, filter))
      .filter((o): o is PlanningOrder => o !== null);
  }

  async fetchResources(): Promise<PlanningResource[]> {
    const raw =
      this.config.mode === 'fixture'
        ? ERPNEXT_FIXTURES.workstations
        : await this.api.getList<ErpNextWorkstation>('Workstation', 'limit_page_length=100');

    return raw.map(mapErpNextWorkstation);
  }

  async fetchMaterials(): Promise<PlanningMaterial[]> {
    const raw =
      this.config.mode === 'fixture'
        ? ERPNEXT_FIXTURES.items
        : await this.api.getList<ErpNextItem>('Item', 'filters=[["is_stock_item","=",1]]&limit_page_length=100');

    return raw.map(mapErpNextItem);
  }

  async fetchBatches(filter?: AdapterBatchFilter): Promise<PlanningBatch[]> {
    const raw =
      this.config.mode === 'fixture'
        ? ERPNEXT_FIXTURES.batches
        : await this.api.getList<ErpNextBatch>('Batch', 'limit_page_length=100');

    let batches = raw.map(mapErpNextBatch);
    if (filter?.materialIds?.length) {
      batches = batches.filter(b => filter.materialIds!.includes(String(b.materialId)));
    }
    return batches;
  }

  async fetchInventory(): Promise<InventoryPosition[]> {
    const raw =
      this.config.mode === 'fixture'
        ? ERPNEXT_FIXTURES.bins
        : await this.api.getList<ErpNextBin>('Bin', 'filters=[["actual_qty",">",0]]&limit_page_length=200');

    return raw.map(mapErpNextBin);
  }

  async fetchCalendars(): Promise<WorkingCalendar[]> {
    throw new NotImplementedError('fetchCalendars', this.metadata.id);
  }

  private async fetchApiWorkOrders() {
    const companyFilter = encodeURIComponent(
      JSON.stringify([['company', '=', this.config.company], ['docstatus', '<', 2]]),
    );
    const rows = await this.api.getList<ErpNextWorkOrderRow>(
      'Work Order',
      `filters=${companyFilter}&fields=${encodeURIComponent(JSON.stringify(['name', 'production_item', 'qty', 'stock_uom', 'status', 'planned_start_date', 'planned_end_date', 'company', 'priority']))}&limit_page_length=100`,
    );

    const result = [];
    for (const row of rows) {
      const opFilter = encodeURIComponent(JSON.stringify([['parent', '=', row.name ?? '']]));
      const operations = await this.api.getList<ErpNextWorkOrderOperationRow>(
        'Work Order Operation',
        `filters=${opFilter}&limit_page_length=50`,
      );
      result.push(mapErpNextWorkOrderRow(row, operations));
    }
    return result;
  }
}

export function createErpNextAdapter(config?: Partial<ErpNextAdapterConfig>): ErpNextPlanningAdapter {
  return new ErpNextPlanningAdapter(resolveErpNextConfig(config));
}
