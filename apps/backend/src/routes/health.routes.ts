import { Router } from 'express';
import { planningService } from '../services/planning.service.js';

export const healthRouter: Router = Router();

healthRouter.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    version: '0.1.0',
    uptime: process.uptime(),
    registeredConstraints: planningService.registry.getAll().length,
    timestamp: new Date().toISOString(),
  });
});

