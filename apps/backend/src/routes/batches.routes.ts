import { Router } from 'express';
import { planningService } from '../services/planning.service.js';

export const batchesRouter: Router = Router();

batchesRouter.get('/', async (_req, res, next) => {
  try {
    const batches = await planningService.batchRepo.findAll();
    res.json({ data: batches, total: batches.length });
  } catch (err) {
    next(err);
  }
});

