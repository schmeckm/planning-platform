import { Router } from 'express';
import { planningService } from '../services/planning.service.js';

export const adaptersRouter: Router = Router();

adaptersRouter.get('/', (_req, res) => {
  const data = planningService.getAdapters();
  res.json({ data, total: data.length });
});
