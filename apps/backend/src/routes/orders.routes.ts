import { Router } from 'express';
import { z } from 'zod';
import { planningService } from '../services/planning.service.js';
import {
  asOrderId,
  asMaterialId,
  asBatchId,
  asOperationId,
} from '@PCP/planning-core';
import { randomUUID } from 'node:crypto';

export const ordersRouter: Router = Router();

const CreateOrderSchema = z.object({
  materialId: z.string().min(1),
  batchId: z.string().optional(),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  priority: z.enum(['CRITICAL', 'HIGH', 'NORMAL', 'LOW']).default('NORMAL'),
  earliestStart: z.coerce.date(),
  latestFinish: z.coerce.date(),
  durationMinutes: z.number().positive().default(480),
  patientId: z.string().optional(),
  tags: z.record(z.string()).default({}),
  metadata: z.record(z.unknown()).default({}),
});

ordersRouter.get('/', async (req, res, next) => {
  try {
    const filter = {
      ...(req.query['schedulingStatus']
        ? { schedulingStatus: [req.query['schedulingStatus'] as never] }
        : {}),
      ...(req.query['materialId']
        ? { materialId: asMaterialId(req.query['materialId'] as string) }
        : {}),
    };
    const orders = await planningService.orderRepo.findAll(filter);
    res.json({ data: orders, total: orders.length });
  } catch (err) {
    next(err);
  }
});

ordersRouter.get('/:id', async (req, res, next) => {
  try {
    const order = await planningService.orderRepo.findById(asOrderId(req.params['id']!));
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json(order);
  } catch (err) {
    next(err);
  }
});

ordersRouter.post('/', async (req, res, next) => {
  try {
    const body = CreateOrderSchema.parse(req.body);
    const now = new Date();
    const orderId = asOrderId(randomUUID());

    const order = await planningService.orderRepo.save({
      id: orderId,
      materialId: asMaterialId(body.materialId),
      ...(body.batchId ? { batchId: asBatchId(body.batchId) } : {}),
      quantity: body.quantity,
      unit: body.unit,
      priority: body.priority,
      status: 'RELEASED',
      earliestStart: body.earliestStart,
      latestFinish: body.latestFinish,
      durationMinutes: body.durationMinutes,
      operations: [],
      ...(body.patientId ? { patientId: body.patientId } : {}),
      tags: body.tags,
      schedulingStatus: 'PENDING',
      metadata: body.metadata,
      createdAt: now,
      updatedAt: now,
    });

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

ordersRouter.delete('/:id', async (req, res, next) => {
  try {
    await planningService.orderRepo.delete(asOrderId(req.params['id']!));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

