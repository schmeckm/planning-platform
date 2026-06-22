import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import {
  shopfloorBoardQuerySchema,
  shopfloorCreateBindingsSchema,
  shopfloorMessagesQuerySchema,
  shopfloorMqttConfigUpdateSchema,
  shopfloorPreviewTopicsSchema,
  shopfloorSimulationRunSchema,
  shopfloorSimulationStreamSchema,
} from '@PCP/planning-shopfloor';
import { haeShopfloorProvider } from '../services/shopfloor.service.js';

export const shopfloorRouter: Router = Router();

function ctxFrom(req: Request) {
  return {
    userId: req.authUser?.sub ?? (req.headers['x-user-id'] as string | undefined) ?? 'SYSTEM',
    userRole: (req.headers['x-user-role'] as string | undefined) ?? 'ADMIN',
    userName: (req.headers['x-user-name'] as string | undefined) ?? 'OPP',
  };
}

function handleError(err: unknown, _req: Request, res: Response, next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({ error: { message: err.errors[0]?.message ?? 'Validation failed' } });
    return;
  }
  next(err);
}

shopfloorRouter.get('/health', async (_req, res, next) => {
  try {
    const result = await haeShopfloorProvider.testConnection();
    res.status(result.healthy ? 200 : 503).json({ data: result });
  } catch (err) {
    next(err);
  }
});

shopfloorRouter.get('/board', async (req, res, next) => {
  try {
    const parsed = shopfloorBoardQuerySchema.parse(req.query);
    const filter: { plantId?: string; lineId?: string } = {};
    if (parsed.plantId !== undefined) filter.plantId = parsed.plantId;
    if (parsed.lineId !== undefined) filter.lineId = parsed.lineId;
    const data = await haeShopfloorProvider.getBoard(filter);
    res.json({ data });
  } catch (err) {
    handleError(err, req, res, next);
  }
});

shopfloorRouter.get('/mqtt/config', async (req, res, next) => {
  try {
    const data = await haeShopfloorProvider.getConfig(ctxFrom(req));
    res.json({ data });
  } catch (err) {
    handleError(err, req, res, next);
  }
});

shopfloorRouter.put('/mqtt/config', async (req, res, next) => {
  try {
    const parsed = shopfloorMqttConfigUpdateSchema.parse(req.body ?? {});
    const input: Partial<import('@PCP/planning-shopfloor').ShopfloorMqttConfig> & { password?: string | null } = {};
    if (parsed.namespace !== undefined) input.namespace = parsed.namespace;
    if (parsed.brokerUrl !== undefined) input.brokerUrl = parsed.brokerUrl;
    if (parsed.enabled !== undefined) input.enabled = parsed.enabled;
    if (parsed.qos !== undefined) input.qos = parsed.qos;
    if (parsed.username !== undefined) input.username = parsed.username;
    if (parsed.password !== undefined) input.password = parsed.password;
    if (parsed.topicPattern !== undefined) input.topicPattern = parsed.topicPattern;
    if (parsed.eventTypes !== undefined) input.eventTypes = parsed.eventTypes;
    const data = await haeShopfloorProvider.updateConfig(input, ctxFrom(req));
    res.json({ data });
  } catch (err) {
    handleError(err, req, res, next);
  }
});

shopfloorRouter.get('/mqtt/resources', async (_req, res, next) => {
  try {
    const data = await haeShopfloorProvider.listResources();
    res.json({ data });
  } catch (err) {
    handleError(err, _req, res, next);
  }
});

shopfloorRouter.post('/mqtt/topics/preview', async (req, res, next) => {
  try {
    const input = shopfloorPreviewTopicsSchema.parse(req.body ?? {});
    const data = await haeShopfloorProvider.previewTopics(input);
    res.json({ data });
  } catch (err) {
    handleError(err, req, res, next);
  }
});

shopfloorRouter.get('/mqtt/bindings', async (_req, res, next) => {
  try {
    const data = await haeShopfloorProvider.listBindings();
    res.json({ data });
  } catch (err) {
    handleError(err, _req, res, next);
  }
});

shopfloorRouter.post('/mqtt/bindings', async (req, res, next) => {
  try {
    const input = shopfloorCreateBindingsSchema.parse(req.body ?? {});
    const data = await haeShopfloorProvider.createBindings(input, ctxFrom(req));
    res.json({ data });
  } catch (err) {
    handleError(err, req, res, next);
  }
});

shopfloorRouter.put('/mqtt/bindings/:bindingId', async (req, res, next) => {
  try {
    const data = await haeShopfloorProvider.updateBinding(req.params.bindingId ?? '', req.body ?? {}, ctxFrom(req));
    res.json({ data });
  } catch (err) {
    handleError(err, req, res, next);
  }
});

shopfloorRouter.delete('/mqtt/bindings/:bindingId', async (req, res, next) => {
  try {
    const data = await haeShopfloorProvider.deleteBinding(req.params.bindingId ?? '', ctxFrom(req));
    res.json({ data });
  } catch (err) {
    handleError(err, req, res, next);
  }
});

shopfloorRouter.post('/mqtt/bindings/regenerate', async (req, res, next) => {
  try {
    const data = await haeShopfloorProvider.regenerateTopics(ctxFrom(req));
    res.json({ data });
  } catch (err) {
    handleError(err, req, res, next);
  }
});

shopfloorRouter.get('/mqtt/status', async (_req, res, next) => {
  try {
    const data = await haeShopfloorProvider.getStatus();
    res.json({ data });
  } catch (err) {
    handleError(err, _req, res, next);
  }
});

shopfloorRouter.post('/mqtt/reconnect', async (_req, res, next) => {
  try {
    const data = await haeShopfloorProvider.reconnect();
    res.json({ data });
  } catch (err) {
    handleError(err, _req, res, next);
  }
});

shopfloorRouter.get('/mqtt/messages', async (req, res, next) => {
  try {
    const parsed = shopfloorMessagesQuerySchema.parse(req.query);
    const filter: { limit?: number; resourceId?: string; topic?: string } = {};
    if (parsed.limit !== undefined) filter.limit = parsed.limit;
    if (parsed.resourceId !== undefined) filter.resourceId = parsed.resourceId;
    if (parsed.topic !== undefined) filter.topic = parsed.topic;
    const data = await haeShopfloorProvider.listMessages(filter);
    res.json({ data });
  } catch (err) {
    handleError(err, req, res, next);
  }
});

shopfloorRouter.get('/mqtt/simulation/topic-catalog', async (_req, res, next) => {
  try {
    const data = await haeShopfloorProvider.getTopicCatalog();
    res.json({ data });
  } catch (err) {
    handleError(err, _req, res, next);
  }
});

shopfloorRouter.get('/mqtt/simulation/wip-orders', async (req, res, next) => {
  try {
    const lineId = typeof req.query.lineId === 'string' ? req.query.lineId : null;
    const data = await haeShopfloorProvider.listWipOrders(lineId);
    res.json({ data });
  } catch (err) {
    handleError(err, req, res, next);
  }
});

shopfloorRouter.post('/mqtt/simulation/preview', async (req, res, next) => {
  try {
    const input = shopfloorSimulationRunSchema.parse(req.body ?? {});
    const data = await haeShopfloorProvider.previewSimulation(input);
    res.json({ data });
  } catch (err) {
    handleError(err, req, res, next);
  }
});

shopfloorRouter.post('/mqtt/simulation/run', async (req, res, next) => {
  try {
    const input = shopfloorSimulationRunSchema.parse(req.body ?? {});
    const data = await haeShopfloorProvider.runSimulation(input, ctxFrom(req));
    res.json({ data });
  } catch (err) {
    handleError(err, req, res, next);
  }
});

shopfloorRouter.post('/mqtt/simulation/stream/start', async (req, res, next) => {
  try {
    const input = shopfloorSimulationStreamSchema.parse(req.body ?? {});
    const data = await haeShopfloorProvider.startStreamSimulation(input, ctxFrom(req));
    res.json({ data });
  } catch (err) {
    handleError(err, req, res, next);
  }
});

shopfloorRouter.post('/mqtt/simulation/stream/stop', async (_req, res, next) => {
  try {
    const data = await haeShopfloorProvider.stopStreamSimulation();
    res.json({ data });
  } catch (err) {
    handleError(err, _req, res, next);
  }
});

shopfloorRouter.get('/mqtt/simulation/stream/status', async (_req, res, next) => {
  try {
    const data = await haeShopfloorProvider.getStreamStatus();
    res.json({ data });
  } catch (err) {
    handleError(err, _req, res, next);
  }
});

shopfloorRouter.get('/module', (_req, res) => {
  res.json({
    data: {
      id: haeShopfloorProvider.metadata.id,
      moduleId: 'planning-shopfloor',
      features: [
        {
          id: 'shopfloor-addon-board',
          path: '/planning/shopfloor-board',
          section: 'reporting',
          description: 'Live packaging line board with OEE, adherence, WIP and disturbances',
        },
        {
          id: 'admin-system',
          tab: 'shopfloor',
          path: '/planning/admin',
          description: 'MQTT broker config, topic bindings, WIP simulation',
        },
      ],
      api: {
        pcp: '/api/pcp/v1/shopfloor',
        legacy: '/api/v1/shopfloor',
      },
    },
  });
});
