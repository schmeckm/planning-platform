import { Router } from 'express';
import { planningService } from '../services/planning.service.js';

export const constraintsRouter: Router = Router();

constraintsRouter.get('/', (_req, res) => {
  res.json({
    data: planningService.registry.listMetadata(),
    total: planningService.registry.getAll().length,
  });
});

constraintsRouter.post('/self-test', async (_req, res, next) => {
  try {
    const plugins = planningService.registry.getAll();
    const results = await Promise.all(plugins.map(p => p.selfTest()));
    const allPassed = results.every(r => r.passed);
    res.json({
      allPassed,
      totalPlugins: results.length,
      passedPlugins: results.filter(r => r.passed).length,
      failedPlugins: results.filter(r => !r.passed).length,
      results,
    });
  } catch (err) {
    next(err);
  }
});

