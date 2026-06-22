/**
 * Production Sequencing Adapter — vendor-neutral advanced planning data
 * (sequence-dependent setup, pegging, detailed routings).
 *
 * Not affiliated with any ERP vendor. Fixture mode for demo; optional generic REST API.
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
import { PRODUCTION_SEQUENCING_FIXTURES } from './production-sequencing.fixtures.js';
import {
  mapPsOrder,
  mapPsWorkCenter,
  mapPsMaterial,
  mapPsBatch,
  mapPsInventory,
} from './production-sequencing.mapper.js';
import {
  ProductionSequencingApiClient,
  resolveProductionSequencingConfig,
} from './production-sequencing.api.js';
import type { ProductionSequencingConfig } from './production-sequencing.types.js';

export class ProductionSequencingAdapter implements IPlanningAdapter {
  readonly metadata: AdapterMetadata = {
    id: 'production.sequencing',
    name: 'Production Sequencing Adapter',
    version: '0.1.0',
    sourceSystem: 'PROD-SEQ',
    description:
      'Maps detailed production routings with sequence-dependent setup times and order pegging ' +
      'to the PCP canonical model. Vendor-neutral fixture for demo; optional generic REST API.',
    author: 'Pharma Collective Platform Contributors',
  };

  private readonly api: ProductionSequencingApiClient;

  constructor(private readonly config: ProductionSequencingConfig) {
    this.api = new ProductionSequencingApiClient(config);
  }

  async testConnection(): Promise<AdapterHealthResult> {
    if (this.config.mode === 'fixture') {
      return {
        healthy: true,
        message: 'Production sequencing adapter in fixture mode (no live API).',
        latencyMs: 0,
        detail: { mode: 'fixture', plant: this.config.plant },
      };
    }

    const ping = await this.api.ping();
    return {
      healthy: ping.ok,
      message: ping.message,
      latencyMs: ping.latencyMs,
      detail: { mode: 'api', baseUrl: this.config.baseUrl, plant: this.config.plant },
    };
  }

  async fetchOrders(filter?: AdapterOrderFilter): Promise<PlanningOrder[]> {
    if (this.config.mode !== 'fixture') {
      throw new NotImplementedError('fetchOrders (API mode)', this.metadata.id);
    }

    const plant = filter?.plant ?? this.config.plant;
    return PRODUCTION_SEQUENCING_FIXTURES.orders
      .map(o =>
        mapPsOrder(o, PRODUCTION_SEQUENCING_FIXTURES.setupMatrix, { ...filter, plant }),
      )
      .filter((o): o is PlanningOrder => o !== null);
  }

  async fetchResources(): Promise<PlanningResource[]> {
    if (this.config.mode !== 'fixture') {
      throw new NotImplementedError('fetchResources (API mode)', this.metadata.id);
    }
    return PRODUCTION_SEQUENCING_FIXTURES.workCenters.map(mapPsWorkCenter);
  }

  async fetchMaterials(): Promise<PlanningMaterial[]> {
    if (this.config.mode !== 'fixture') {
      throw new NotImplementedError('fetchMaterials (API mode)', this.metadata.id);
    }
    return PRODUCTION_SEQUENCING_FIXTURES.materials.map(mapPsMaterial);
  }

  async fetchBatches(filter?: AdapterBatchFilter): Promise<PlanningBatch[]> {
    if (this.config.mode !== 'fixture') {
      throw new NotImplementedError('fetchBatches (API mode)', this.metadata.id);
    }

    let batches = PRODUCTION_SEQUENCING_FIXTURES.batches.map(mapPsBatch);
    if (filter?.materialIds?.length) {
      batches = batches.filter(b => filter.materialIds!.includes(String(b.materialId)));
    }
    if (filter?.statuses?.length) {
      batches = batches.filter(b => filter.statuses!.includes(b.status));
    }
    return batches;
  }

  async fetchInventory(): Promise<InventoryPosition[]> {
    if (this.config.mode !== 'fixture') {
      throw new NotImplementedError('fetchInventory (API mode)', this.metadata.id);
    }
    return PRODUCTION_SEQUENCING_FIXTURES.inventory.map(mapPsInventory);
  }

  async fetchCalendars(): Promise<WorkingCalendar[]> {
    throw new NotImplementedError('fetchCalendars', this.metadata.id);
  }
}

export function createProductionSequencingAdapter(
  config?: Partial<ProductionSequencingConfig>,
): ProductionSequencingAdapter {
  return new ProductionSequencingAdapter(resolveProductionSequencingConfig(config));
}
