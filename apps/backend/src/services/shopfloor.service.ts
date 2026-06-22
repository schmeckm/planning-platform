/**
 * HAE backend bridge for shopfloor operations.
 * Delegates to the Hard Allocation Engine /api/v1/shopfloor/* endpoints.
 */

import type {
  IShopfloorProvider,
  ShopfloorBoard,
  ShopfloorBoardFilter,
  ShopfloorMessagesFilter,
  ShopfloorMqttConfig,
  ShopfloorMqttMessage,
  ShopfloorMqttStatus,
  ShopfloorRequestContext,
  ShopfloorResourcePreview,
  ShopfloorStreamStatus,
  ShopfloorTopicBinding,
  ShopfloorTopicCatalogEntry,
  ShopfloorWipOrder,
} from '@PCP/planning-shopfloor';

const HAE_BASE = process.env['HAE_API_URL'] ?? 'http://127.0.0.1:8000';
const HAE_SHOPFLOOR_PREFIX = `${HAE_BASE}/api/v1/shopfloor`;

function buildUserHeaders(ctx?: ShopfloorRequestContext): Record<string, string> {
  return {
    'X-User-Id': ctx?.userId ?? 'SYSTEM',
    'X-User-Role': ctx?.userRole ?? 'ADMIN',
    'X-User-Name': ctx?.userName ?? 'OPP',
  };
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

async function haeFetch<T>(
  path: string,
  options: RequestInit = {},
  ctx?: ShopfloorRequestContext,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...buildUserHeaders(ctx),
    ...(options.headers as Record<string, string> | undefined),
  };

  const response = await fetch(`${HAE_SHOPFLOOR_PREFIX}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `HAE shopfloor request failed (${response.status})`;
    try {
      const body = (await response.json()) as { message?: string; error?: string };
      message = body.message ?? body.error ?? message;
    } catch {
      /* ignore parse errors */
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function compactBoardFilter(filter: ShopfloorBoardFilter = {}): ShopfloorBoardFilter {
  const result: ShopfloorBoardFilter = {};
  if (filter.plantId !== undefined) result.plantId = filter.plantId;
  if (filter.lineId !== undefined) result.lineId = filter.lineId;
  return result;
}

function compactMessagesFilter(filter: ShopfloorMessagesFilter = {}): ShopfloorMessagesFilter {
  const result: ShopfloorMessagesFilter = {};
  if (filter.limit !== undefined) result.limit = filter.limit;
  if (filter.resourceId !== undefined) result.resourceId = filter.resourceId;
  if (filter.topic !== undefined) result.topic = filter.topic;
  return result;
}

export class HaeShopfloorProvider implements IShopfloorProvider {
  readonly metadata = {
    id: 'hae.shopfloor',
    name: 'HAE Shopfloor MQTT',
    version: '0.1.0',
    description: 'Live line transparency via MQTT ingest and shadow storage in the HAE backend.',
  } as const;

  async testConnection(): Promise<{ healthy: boolean; message: string }> {
    const started = Date.now();
    try {
      await haeFetch<ShopfloorMqttStatus>('/mqtt/status');
      return {
        healthy: true,
        message: `HAE shopfloor reachable (${Date.now() - started}ms)`,
      };
    } catch (err) {
      return {
        healthy: false,
        message: err instanceof Error ? err.message : 'HAE shopfloor unreachable',
      };
    }
  }

  getConfig(ctx?: ShopfloorRequestContext): Promise<ShopfloorMqttConfig> {
    return haeFetch<ShopfloorMqttConfig>('/mqtt/config', { method: 'GET' }, ctx);
  }

  updateConfig(
    input: Partial<ShopfloorMqttConfig> & { password?: string | null },
    ctx?: ShopfloorRequestContext,
  ): Promise<ShopfloorMqttConfig> {
    return haeFetch<ShopfloorMqttConfig>('/mqtt/config', { method: 'PUT', body: JSON.stringify(input) }, ctx);
  }

  listResources(): Promise<{ packagingLines: unknown[]; workCenters: unknown[] }> {
    return haeFetch<{ packagingLines: unknown[]; workCenters: unknown[] }>('/mqtt/resources', { method: 'GET' });
  }

  previewTopics(input: Record<string, unknown>): Promise<{ previews: ShopfloorResourcePreview[] }> {
    return haeFetch<{ previews: ShopfloorResourcePreview[] }>('/mqtt/topics/preview', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  listBindings(): Promise<{ items: ShopfloorTopicBinding[] }> {
    return haeFetch<{ items: ShopfloorTopicBinding[] }>('/mqtt/bindings', { method: 'GET' });
  }

  createBindings(
    input: Record<string, unknown>,
    ctx?: ShopfloorRequestContext,
  ): Promise<{ created: ShopfloorTopicBinding[] }> {
    return haeFetch<{ created: ShopfloorTopicBinding[] }>(
      '/mqtt/bindings',
      { method: 'POST', body: JSON.stringify(input) },
      ctx,
    );
  }

  updateBinding(
    bindingId: string,
    input: Record<string, unknown>,
    ctx?: ShopfloorRequestContext,
  ): Promise<ShopfloorTopicBinding> {
    return haeFetch<ShopfloorTopicBinding>(
      `/mqtt/bindings/${encodeURIComponent(bindingId)}`,
      { method: 'PUT', body: JSON.stringify(input) },
      ctx,
    );
  }

  deleteBinding(bindingId: string, ctx?: ShopfloorRequestContext): Promise<{ deleted: boolean }> {
    return haeFetch<{ deleted: boolean }>(
      `/mqtt/bindings/${encodeURIComponent(bindingId)}`,
      { method: 'DELETE' },
      ctx,
    );
  }

  regenerateTopics(ctx?: ShopfloorRequestContext): Promise<{ updated: number }> {
    return haeFetch<{ updated: number }>('/mqtt/bindings/regenerate', { method: 'POST', body: '{}' }, ctx);
  }

  getStatus(): Promise<ShopfloorMqttStatus> {
    return haeFetch<ShopfloorMqttStatus>('/mqtt/status', { method: 'GET' });
  }

  reconnect(): Promise<{ started: boolean }> {
    return haeFetch<{ started: boolean }>('/mqtt/reconnect', { method: 'POST', body: '{}' });
  }

  listMessages(filter: ShopfloorMessagesFilter = {}): Promise<{ items: ShopfloorMqttMessage[] }> {
    const compact = compactMessagesFilter(filter);
    const query = buildQuery({
      limit: compact.limit,
      resourceId: compact.resourceId,
      topic: compact.topic,
    });
    return haeFetch<{ items: ShopfloorMqttMessage[] }>(`/mqtt/messages${query}`, { method: 'GET' });
  }

  getTopicCatalog(): Promise<{ items: ShopfloorTopicCatalogEntry[] }> {
    return haeFetch<{ items: ShopfloorTopicCatalogEntry[] }>('/mqtt/simulation/topic-catalog', { method: 'GET' });
  }

  listWipOrders(lineId?: string | null): Promise<{ items: ShopfloorWipOrder[] }> {
    const query = buildQuery({ lineId: lineId ?? undefined });
    return haeFetch<{ items: ShopfloorWipOrder[] }>(`/mqtt/simulation/wip-orders${query}`, { method: 'GET' });
  }

  previewSimulation(input: Record<string, unknown>): Promise<{ previews: unknown[] }> {
    return haeFetch<{ previews: unknown[] }>('/mqtt/simulation/preview', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  runSimulation(
    input: Record<string, unknown>,
    ctx?: ShopfloorRequestContext,
  ): Promise<{ messageCount: number }> {
    return haeFetch<{ messageCount: number }>('/mqtt/simulation/run', {
      method: 'POST',
      body: JSON.stringify(input),
    }, ctx);
  }

  startStreamSimulation(
    input: Record<string, unknown>,
    ctx?: ShopfloorRequestContext,
  ): Promise<ShopfloorStreamStatus> {
    return haeFetch<ShopfloorStreamStatus>('/mqtt/simulation/stream/start', {
      method: 'POST',
      body: JSON.stringify(input),
    }, ctx);
  }

  stopStreamSimulation(): Promise<{ active: false }> {
    return haeFetch<{ active: false }>('/mqtt/simulation/stream/stop', { method: 'POST', body: '{}' });
  }

  getStreamStatus(): Promise<ShopfloorStreamStatus> {
    return haeFetch<ShopfloorStreamStatus>('/mqtt/simulation/stream/status', { method: 'GET' });
  }

  getBoard(filter: ShopfloorBoardFilter = {}): Promise<ShopfloorBoard> {
    const compact = compactBoardFilter(filter);
    const query = buildQuery({
      plantId: compact.plantId,
      lineId: compact.lineId,
    });
    return haeFetch<ShopfloorBoard>(`/board${query}`, { method: 'GET' });
  }
}

export const haeShopfloorProvider = new HaeShopfloorProvider();
