import type { ProductionSequencingConfig, ProductionSequencingMode } from './production-sequencing.types.js';

export function resolveProductionSequencingConfig(
  overrides?: Partial<ProductionSequencingConfig>,
): ProductionSequencingConfig {
  const baseUrl = overrides?.baseUrl ?? process.env['PRODUCTION_SEQUENCING_BASE_URL'] ?? '';
  const explicitMode = overrides?.mode ?? (process.env['PRODUCTION_SEQUENCING_MODE'] as ProductionSequencingMode | undefined);
  const mode: ProductionSequencingMode =
    explicitMode ?? (baseUrl.length > 0 ? 'api' : 'fixture');

  return {
    mode,
    baseUrl,
    plant: overrides?.plant ?? process.env['PRODUCTION_SEQUENCING_PLANT'] ?? 'PLANT-01',
    timeoutMs: overrides?.timeoutMs ?? 15_000,
  };
}

/** Generic REST client placeholder for future live ERP scheduling APIs. */
export class ProductionSequencingApiClient {
  constructor(private readonly config: ProductionSequencingConfig) {}

  async ping(): Promise<{ ok: boolean; message: string; latencyMs: number }> {
    if (!this.config.baseUrl) {
      return { ok: false, message: 'PRODUCTION_SEQUENCING_BASE_URL is not configured.', latencyMs: 0 };
    }
    const start = Date.now();
    try {
      const res = await fetch(`${this.config.baseUrl.replace(/\/$/, '')}/health`, {
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
      return {
        ok: res.ok,
        message: res.ok ? 'Production sequencing API reachable.' : `HTTP ${res.status}`,
        latencyMs: Date.now() - start,
      };
    } catch (err) {
      return {
        ok: false,
        message: `Connection failed: ${String(err)}`,
        latencyMs: Date.now() - start,
      };
    }
  }
}
