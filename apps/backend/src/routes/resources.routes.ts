import { Router } from 'express';
import { planningService } from '../services/planning.service.js';

export const resourcesRouter: Router = Router();

resourcesRouter.get('/', async (_req, res, next) => {
  try {
    const resources = await planningService.resourceRepo.findAll();
    res.json({ data: resources, total: resources.length });
  } catch (err) {
    next(err);
  }
});

