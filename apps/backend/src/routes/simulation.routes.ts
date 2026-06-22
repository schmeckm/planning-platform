import { Router } from 'express';
import { z } from 'zod';
import { planningService } from '../services/planning.service.js';
import { asSimRunId } from '@PCP/planning-core';

export const simulationRouter: Router = Router();

const RunSimulationSchema = z.object({
  name: z.string().default('Unnamed Simulation'),
  orderIds: z.array(z.string()).optional(),
  constraintIds: z.array(z.string()).optional(),
  triggeredBy: z.string().default('api'),
});

const LoadAdapterSchema = z.object({
  adapterId: z.string().min(1),
});

simulationRouter.get('/', async (_req, res, next) => {
  try {
    const runs = await planningService.simulationRepo.findAll();
    res.json({ data: runs, total: runs.length });
  } catch (err) {
    next(err);
  }
});

simulationRouter.get('/:id', async (req, res, next) => {
  try {
    const run = await planningService.simulationRepo.findById(
      asSimRunId(req.params['id']!),
    );
    if (!run) {
      res.status(404).json({ error: 'Simulation run not found' });
      return;
    }
    res.json(run);
  } catch (err) {
    next(err);
  }
});

simulationRouter.post('/', async (req, res, next) => {
  try {
    const body = RunSimulationSchema.parse(req.body);
    const run = await planningService.runSimulation({
      name: body.name,
      ...(body.orderIds?.length ? { orderIds: body.orderIds as never } : {}),
      ...(body.constraintIds?.length ? { constraintIds: body.constraintIds } : {}),
      triggeredBy: body.triggeredBy,
    });
    res.json(run);
  } catch (err) {
    next(err);
  }
});

/** Load data from an adapter into the planning repositories. */
simulationRouter.post('/load-adapter', async (req, res, next) => {
  try {
    const { adapterId } = LoadAdapterSchema.parse(req.body);
    const result = await planningService.loadFromAdapter(adapterId);
    res.json({
      message: `Successfully loaded data from "${result.adapter}"`,
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

