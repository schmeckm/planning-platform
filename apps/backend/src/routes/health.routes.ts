import { Router } from 'express';
import { planningService } from '../services/planning.service.js';

export const healthRouter: Router = Router();

function persistenceMode(): 'postgresql' | 'in-memory' {
  return process.env['PCP_DATABASE_URL'] ? 'postgresql' : 'in-memory';
}

healthRouter.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    version: '0.1.0',
    uptime: process.uptime(),
    persistence: persistenceMode(),
    adapters: planningService.getAdapters().map(a => a.id),
    registeredConstraints: planningService.registry.getAll().length,
    timestamp: new Date().toISOString(),
  });
});
