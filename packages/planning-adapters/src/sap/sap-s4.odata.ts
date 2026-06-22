import type { SapODataList } from './sap-s4.types.js';

export type SapAdapterMode = 'fixture' | 'odata';

export interface SapS4AdapterConfig {
  mode: SapAdapterMode;
  baseUrl: string;
  plant: string;
  client?: string;
  username?: string;
  password?: string;
  timeoutMs: number;
}

export function resolveSapS4Config(overrides?: Partial<SapS4AdapterConfig>): SapS4AdapterConfig {
  const baseUrl = overrides?.baseUrl ?? process.env['SAP_BASE_URL'] ?? '';
  const explicitMode = overrides?.mode ?? (process.env['SAP_ADAPTER_MODE'] as SapAdapterMode | undefined);
  const mode: SapAdapterMode =
    explicitMode ?? (baseUrl ? 'odata' : 'fixture');

  return {
    mode,
    baseUrl: baseUrl.replace(/\/$/, ''),
    plant: overrides?.plant ?? process.env['SAP_PLANT'] ?? '1000',
    ...(overrides?.client ?? process.env['SAP_CLIENT']
      ? { client: overrides?.client ?? process.env['SAP_CLIENT']! }
      : {}),
    ...(overrides?.username ?? process.env['SAP_USERNAME']
      ? { username: overrides?.username ?? process.env['SAP_USERNAME']! }
      : {}),
    ...(overrides?.password ?? process.env['SAP_PASSWORD']
      ? { password: overrides?.password ?? process.env['SAP_PASSWORD']! }
      : {}),
    timeoutMs: overrides?.timeoutMs ?? 30_000,
  };
}

export class SapODataClient {
  constructor(private readonly config: SapS4AdapterConfig) {}

  async ping(): Promise<{ ok: boolean; latencyMs: number; message: string }> {
    const start = Date.now();
    try {
      await this.fetchJson('/sap/opu/odata/sap/API_PRODUCTION_ORDER_2_SRV/$metadata', {
        accept: 'application/xml',
      });
      return { ok: true, latencyMs: Date.now() - start, message: 'SAP OData metadata reachable' };
    } catch (err) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        message: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async getCollection<T>(servicePath: string, query?: string): Promise<T[]> {
    const path = query ? `${servicePath}?${query}` : servicePath;
    const payload = await this.fetchJson<SapODataList<T>>(path);
    return payload.d?.results ?? [];
  }

  private async fetchJson<T>(path: string, opts?: { accept?: string }): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    const headers: Record<string, string> = {
      Accept: opts?.accept ?? 'application/json',
    };
    if (this.config.client) {
      headers['sap-client'] = this.config.client;
    }

    const auth = this.basicAuthHeader();
    if (auth) {
      headers['Authorization'] = auth;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(url, { headers, signal: controller.signal });
      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`SAP OData ${response.status} ${response.statusText}: ${body.slice(0, 200)}`);
      }
      if (opts?.accept === 'application/xml') {
        return {} as T;
      }
      return (await response.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  private basicAuthHeader(): string | undefined {
    if (!this.config.username) return undefined;
    const token = Buffer.from(
      `${this.config.username}:${this.config.password ?? ''}`,
    ).toString('base64');
    return `Basic ${token}`;
  }
}
