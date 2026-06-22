import { z } from 'zod';

export const shopfloorResourceTypeSchema = z.enum(['packaging-line', 'work-center']);

export const shopfloorEventTypeSchema = z.enum([
  'status', 'progress', 'confirmation', 'alarm',
  'line-status', 'schedule-adherence', 'oee', 'scrap', 'phase-event',
]);

export const shopfloorSimulationScenarioSchema = z.enum(['on-schedule', 'delayed', 'high-scrap']);

export const shopfloorMqttConfigUpdateSchema = z.object({
  namespace: z.string().min(1).optional(),
  brokerUrl: z.string().min(1).optional(),
  enabled: z.boolean().optional(),
  qos: z.number().int().min(0).max(2).optional(),
  username: z.string().nullable().optional(),
  password: z.string().nullable().optional(),
  topicPattern: z.string().min(1).optional(),
  eventTypes: z.array(shopfloorEventTypeSchema).min(1).optional(),
});

export const shopfloorCreateBindingsSchema = z.object({
  resourceType: shopfloorResourceTypeSchema,
  resourceIds: z.array(z.string().min(1)).min(1),
  eventTypes: z.array(shopfloorEventTypeSchema).optional(),
  subscribed: z.boolean().optional(),
});

export const shopfloorPreviewTopicsSchema = z.object({
  namespace: z.string().optional(),
  topicPattern: z.string().optional(),
  resourceType: shopfloorResourceTypeSchema,
  resourceIds: z.array(z.string().min(1)).min(1),
  eventTypes: z.array(shopfloorEventTypeSchema).optional(),
});

export const shopfloorSimulationRunSchema = z.object({
  lineId: z.string().optional(),
  orderIds: z.array(z.string()).optional(),
  eventTypes: z.array(z.string()).optional(),
  scenario: shopfloorSimulationScenarioSchema.optional(),
  publishToBroker: z.boolean().optional(),
  injectShadow: z.boolean().optional(),
  syncBindings: z.boolean().optional(),
});

export const shopfloorSimulationStreamSchema = shopfloorSimulationRunSchema.extend({
  orderId: z.string().optional(),
  intervalSeconds: z.number().int().min(2).max(120).optional(),
});

export const shopfloorBoardQuerySchema = z.object({
  plantId: z.string().optional(),
  lineId: z.string().optional(),
});

export const shopfloorMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).optional(),
  resourceId: z.string().optional(),
  topic: z.string().optional(),
});
