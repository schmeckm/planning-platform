import type { ErpNextListResponse } from './erpnext.types.js';

export type ErpNextAdapterMode = 'fixture' | 'api';

export interface ErpNextAdapterConfig {
  mode: ErpNextAdapterMode;
  baseUrl: string;
  company: string;
  apiKey?: string;
  apiSecret?: string;
  timeoutMs: number;
}

export function resolveErpNextConfig(overrides?: Partial<ErpNextAdapterConfig>): ErpNextAdapterConfig {
  const baseUrl = overrides?.baseUrl ?? process.env['ERPNEXT_BASE_URL'] ?? '';
  const explicitMode = overrides?.mode ?? (process.env['ERPNEXT_ADAPTER_MODE'] as ErpNextAdapterMode | undefined);
  const mode: ErpNextAdapterMode = explicitMode ?? (baseUrl ? 'api' : 'fixture');

  return {
    mode,
    baseUrl: baseUrl.replace(/\/$/, ''),
    company: overrides?.company ?? process.env['ERPNEXT_COMPANY'] ?? 'Pharma Collective GmbH',
    ...(overrides?.apiKey ?? process.env['ERPNEXT_API_KEY']
      ? { apiKey: overrides?.apiKey ?? process.env['ERPNEXT_API_KEY']! }
      : {}),
    ...(overrides?.apiSecret ?? process.env['ERPNEXT_API_SECRET']
      ? { apiSecret: overrides?.apiSecret ?? process.env['ERPNEXT_API_SECRET']! }
      : {}),
    timeoutMs: overrides?.timeoutMs ?? 30_000,
  };
}

export class ErpNextApiClient {
  constructor(private readonly config: ErpNextAdapterConfig) {}

  async ping(): Promise<{ ok: boolean; latencyMs: number; message: string }> {
    const start = Date.now();
    try {
      await this.getList<{ name: string }>('Company', 'limit_page_length=1');
      return { ok: true, latencyMs: Date.now() - start, message: 'ERPNext API reachable' };
    } catch (err) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        message: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async getList<T>(doctype: string, query = ''): Promise<T[]> {
    const encoded = encodeURIComponent(doctype);
    const path = `/api/resource/${encoded}${query ? `?${query}` : ''}`;
    const payload = await this.fetchJson<ErpNextListResponse<T>>(path);
    return payload.data ?? [];
  }

  private async fetchJson<T>(path: string): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (this.config.apiKey && this.config.apiSecret) {
      headers['Authorization'] = `token ${this.config.apiKey}:${this.config.apiSecret}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(url, { headers, signal: controller.signal });
      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`ERPNext API ${response.status}: ${body.slice(0, 200)}`);
      }
      return (await response.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }
}
