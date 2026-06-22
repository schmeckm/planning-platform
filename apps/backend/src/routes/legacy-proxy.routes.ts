/**
 * Legacy HAE API reverse proxy.
 * Forwards /api/v1–v5 and /ws to the Hard Allocation Engine backend.
 */

import { createProxyMiddleware } from 'http-proxy-middleware';
import type { Express } from 'express';

const HAE_TARGET = process.env['HAE_API_URL'] ?? 'http://127.0.0.1:8000';

function createHaeProxy(prefix: string) {
  return createProxyMiddleware({
    target: HAE_TARGET,
    changeOrigin: true,
    ws: true,
    pathRewrite: (path) => `${prefix}${path}`,
  });
}

export function mountLegacyHaeProxy(app: Express): void {
  for (const prefix of ['/api/v1', '/api/v2', '/api/v3', '/api/v4', '/api/v5']) {
    app.use(prefix, createHaeProxy(prefix));
  }
  app.use('/ws', createHaeProxy('/ws'));
  console.info(`[HAE proxy] Forwarding legacy API to ${HAE_TARGET}`);
}
