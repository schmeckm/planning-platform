/**
 * Shopfloor provider interface.
 *
 * Unlike IPlanningAdapter (ERP master data → canonical model),
 * IShopfloorProvider exposes live operational telemetry for line transparency.
 * All writes go to shadow storage only.
 */

import type {
  ShopfloorBoard,
  ShopfloorMqttConfig,
  ShopfloorMqttMessage,
  ShopfloorMqttStatus,
  ShopfloorStreamStatus,
  ShopfloorTopicBinding,
  ShopfloorTopicCatalogEntry,
  ShopfloorWipOrder,
} from '../types/shopfloor.types.js';

export interface ShopfloorProviderMetadata {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly description: string;
}

export interface ShopfloorRequestContext {
  userId?: string;
  userRole?: string;
  userName?: string;
}

export interface ShopfloorBoardFilter {
  plantId?: string;
  lineId?: string;
}

export interface ShopfloorMessagesFilter {
  limit?: number;
  resourceId?: string;
  topic?: string;
}

export interface ShopfloorResourcePreview {
  resourceId: string;
  resourceName: string;
  plantId: string;
  topics: Record<string, string>;
}

/**
 * Operational shopfloor provider — live MQTT ingest + board aggregation.
 */
export interface IShopfloorProvider {
  readonly metadata: ShopfloorProviderMetadata;

  testConnection(): Promise<{ healthy: boolean; message: string }>;

  getConfig(ctx?: ShopfloorRequestContext): Promise<ShopfloorMqttConfig>;
  updateConfig(input: Partial<ShopfloorMqttConfig> & { password?: string | null }, ctx?: ShopfloorRequestContext): Promise<ShopfloorMqttConfig>;

  listResources(): Promise<{ packagingLines: unknown[]; workCenters: unknown[] }>;
  previewTopics(input: Record<string, unknown>): Promise<{ previews: ShopfloorResourcePreview[] }>;

  listBindings(): Promise<{ items: ShopfloorTopicBinding[] }>;
  createBindings(input: Record<string, unknown>, ctx?: ShopfloorRequestContext): Promise<{ created: ShopfloorTopicBinding[] }>;
  updateBinding(bindingId: string, input: Record<string, unknown>, ctx?: ShopfloorRequestContext): Promise<ShopfloorTopicBinding>;
  deleteBinding(bindingId: string, ctx?: ShopfloorRequestContext): Promise<{ deleted: boolean }>;
  regenerateTopics(ctx?: ShopfloorRequestContext): Promise<{ updated: number }>;

  getStatus(): Promise<ShopfloorMqttStatus>;
  reconnect(): Promise<{ started: boolean }>;
  listMessages(filter?: ShopfloorMessagesFilter): Promise<{ items: ShopfloorMqttMessage[] }>;

  getTopicCatalog(): Promise<{ items: ShopfloorTopicCatalogEntry[] }>;
  listWipOrders(lineId?: string | null): Promise<{ items: ShopfloorWipOrder[] }>;
  previewSimulation(input: Record<string, unknown>): Promise<{ previews: unknown[] }>;
  runSimulation(input: Record<string, unknown>, ctx?: ShopfloorRequestContext): Promise<{ messageCount: number }>;
  startStreamSimulation(input: Record<string, unknown>, ctx?: ShopfloorRequestContext): Promise<ShopfloorStreamStatus>;
  stopStreamSimulation(): Promise<{ active: false }>;
  getStreamStatus(): Promise<ShopfloorStreamStatus>;

  getBoard(filter?: ShopfloorBoardFilter): Promise<ShopfloorBoard>;
}
