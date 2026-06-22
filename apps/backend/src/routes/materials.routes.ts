import { Router } from 'express';
import { planningService } from '../services/planning.service.js';

export const materialsRouter: Router = Router();

materialsRouter.get('/', async (_req, res, next) => {
  try {
    const materials = await planningService.materialRepo.findAll();
    res.json({ data: materials, total: materials.length });
  } catch (err) {
    next(err);
  }
});

