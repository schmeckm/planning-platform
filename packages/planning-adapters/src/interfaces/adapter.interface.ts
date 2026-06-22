/**
 * planning-adapters / adapter.interface.ts
 *
 * Universal adapter interface.
 *
 * Key principle: External systems NEVER directly write to the planning core.
 * Every external system's data model must be mapped to the canonical model
 * by an adapter. This protects the kernel from vendor lock-in.
 *
 * Adapter naming convention: <System><Entity>Adapter
 * e.g., SapProductionOrderAdapter, ErpNextBatchAdapter, CsvMockAdapter
 */

import type {
  PlanningOrder,
  PlanningResource,
  PlanningMaterial,
  PlanningBatch,
  InventoryPosition,
  WorkingCalendar,
} from '@PCP/planning-core';

export interface AdapterMetadata {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly sourceSystem: string;
  readonly description: string;
  readonly author: string;
}

/**
 * Full planning data adapter.
 * An adapter may implement any subset of these methods.
 * Methods that are not supported should throw NotImplementedError.
 */
export interface IPlanningAdapter {
  readonly metadata: AdapterMetadata;

  /** Test the connection / data source availability. */
  testConnection(): Promise<AdapterHealthResult>;

  /** Fetch and map orders to the canonical model. */
  fetchOrders(filter?: AdapterOrderFilter): Promise<PlanningOrder[]>;

  /** Fetch and map resources. */
  fetchResources(): Promise<PlanningResource[]>;

  /** Fetch and map materials. */
  fetchMaterials(): Promise<PlanningMaterial[]>;

  /** Fetch and map batches. */
  fetchBatches(filter?: AdapterBatchFilter): Promise<PlanningBatch[]>;

  /** Fetch inventory positions. */
  fetchInventory(): Promise<InventoryPosition[]>;

  /** Fetch working calendars. */
  fetchCalendars(): Promise<WorkingCalendar[]>;
}

export interface AdapterHealthResult {
  healthy: boolean;
  message: string;
  latencyMs?: number;
  detail?: Record<string, unknown>;
}

export interface AdapterOrderFilter {
  plant?: string;
  productionLines?: string[];
  dueBefore?: Date;
  dueAfter?: Date;
  statuses?: string[];
}

export interface AdapterBatchFilter {
  materialIds?: string[];
  expiryBefore?: Date;
  statuses?: string[];
}

export class NotImplementedError extends Error {
  constructor(method: string, adapterId: string) {
    super(`Adapter "${adapterId}" does not implement "${method}".`);
    this.name = 'NotImplementedError';
  }
}
