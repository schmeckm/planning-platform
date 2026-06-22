/**
 * planning-core / zod-schemas.ts
 *
 * Zod schemas for runtime validation of canonical domain types.
 * Use these to validate API inputs, adapter outputs, and message payloads.
 */

import { z } from 'zod';

export const OrderPrioritySchema = z.enum(['CRITICAL', 'HIGH', 'NORMAL', 'LOW']);
export const OrderStatusSchema = z.enum([
  'DRAFT', 'RELEASED', 'IN_PROCESS', 'COMPLETED', 'BLOCKED', 'CANCELLED',
]);
export const OperationTypeSchema = z.enum([
  'SETUP', 'RUN', 'TEARDOWN', 'CLEANING', 'INSPECTION',
  'HOLD', 'TRANSPORT', 'QC_SAMPLING', 'RELEASE', 'STORAGE',
]);
export const ResourceTypeSchema = z.enum([
  'MACHINE', 'LABOR', 'VESSEL', 'CLEANROOM', 'STORAGE',
  'ANALYTICAL_INSTRUMENT', 'VIRTUAL',
]);
export const BatchStatusSchema = z.enum([
  'PLANNED', 'IN_PRODUCTION', 'QC_HOLD', 'QA_HOLD',
  'RELEASED', 'REJECTED', 'EXPIRED', 'QUARANTINE',
]);
export const SchedulingStatusSchema = z.enum([
  'FEASIBLE', 'INFEASIBLE', 'SOFT_VIOLATION', 'UNSCHEDULED', 'PENDING',
]);

export const PlanningOperationSchema = z.object({
  id: z.string().min(1),
  orderId: z.string().min(1),
  sequence: z.number().int().nonnegative(),
  type: OperationTypeSchema,
  description: z.string(),
  resourceId: z.string().optional(),
  durationMinutes: z.number().positive(),
  setupMinutes: z.number().nonnegative(),
  teardownMinutes: z.number().nonnegative(),
  minLagMinutes: z.number().nonnegative(),
  maxLagMinutes: z.number().optional(),
  scheduledStart: z.coerce.date().optional(),
  scheduledFinish: z.coerce.date().optional(),
});

export const PlanningOrderSchema = z.object({
  id: z.string().min(1),
  externalId: z.string().optional(),
  sourceSystem: z.string().optional(),
  materialId: z.string().min(1),
  batchId: z.string().optional(),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  priority: OrderPrioritySchema,
  status: OrderStatusSchema,
  earliestStart: z.coerce.date(),
  latestFinish: z.coerce.date(),
  durationMinutes: z.number().positive(),
  operations: z.array(PlanningOperationSchema),
  tags: z.record(z.string()),
  patientId: z.string().optional(),
  destinationCountry: z.string().length(2).optional(),
  schedulingStatus: SchedulingStatusSchema,
  scheduledStart: z.coerce.date().optional(),
  scheduledFinish: z.coerce.date().optional(),
  metadata: z.record(z.unknown()),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const PlanningResourceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: ResourceTypeSchema,
  calendarId: z.string().optional(),
  capacity: z.number().positive(),
  parallelCapacity: z.number().int().positive(),
  oee: z.number().min(0).max(1),
  qualifiedMaterials: z.array(z.string()),
  attributes: z.record(z.union([z.string(), z.number(), z.boolean()])),
});

export const PlanningBatchSchema = z.object({
  id: z.string().min(1),
  materialId: z.string().min(1),
  quantity: z.number().nonnegative(),
  unit: z.string().min(1),
  status: BatchStatusSchema,
  manufactureDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
  releaseDate: z.coerce.date().optional(),
  availableFrom: z.coerce.date(),
  locationId: z.string().optional(),
  patientId: z.string().optional(),
  approvedCountries: z.array(z.string().length(2)).optional(),
  inspectionLotStatus: z.enum(['OPEN', 'RELEASED', 'REJECTED', 'SKIPPED']).optional(),
  attributes: z.record(z.union([z.string(), z.number(), z.boolean()])),
});

export const PlanningMaterialSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  unit: z.string().min(1),
  minRemainingShelfLifeDays: z.number().optional(),
  shelfLifeDays: z.number().optional(),
  storageCondition: z.string().optional(),
  requiresBatchRelease: z.boolean(),
  isPatientSpecific: z.boolean(),
  attributes: z.record(z.union([z.string(), z.number(), z.boolean()])),
});

export type PlanningOrderInput = z.infer<typeof PlanningOrderSchema>;
export type PlanningResourceInput = z.infer<typeof PlanningResourceSchema>;
export type PlanningBatchInput = z.infer<typeof PlanningBatchSchema>;
export type PlanningMaterialInput = z.infer<typeof PlanningMaterialSchema>;
