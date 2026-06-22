/**
 * planning-core / repository.interface.ts
 *
 * Generic repository contracts. Concrete implementations can use
 * PostgreSQL, in-memory maps, Redis, or any other backing store.
 */

import type {
  PlanningOrder,
  PlanningResource,
  PlanningMaterial,
  PlanningBatch,
  SimulationRun,
  OrderId,
  ResourceId,
  MaterialId,
  BatchId,
  SimRunId,
  SchedulingStatus,
} from '../types/canonical.types.js';

export interface IOrderRepository {
  findById(id: OrderId): Promise<PlanningOrder | null>;
  findAll(filter?: OrderFilter): Promise<PlanningOrder[]>;
  save(order: PlanningOrder): Promise<PlanningOrder>;
  saveMany(orders: PlanningOrder[]): Promise<PlanningOrder[]>;
  delete(id: OrderId): Promise<void>;
}

export interface OrderFilter {
  status?: PlanningOrder['status'][];
  schedulingStatus?: SchedulingStatus[];
  materialId?: MaterialId;
  tags?: Record<string, string>;
  dueBefore?: Date;
  dueAfter?: Date;
}

export interface IResourceRepository {
  findById(id: ResourceId): Promise<PlanningResource | null>;
  findAll(): Promise<PlanningResource[]>;
  save(resource: PlanningResource): Promise<PlanningResource>;
}

export interface IMaterialRepository {
  findById(id: MaterialId): Promise<PlanningMaterial | null>;
  findAll(): Promise<PlanningMaterial[]>;
  save(material: PlanningMaterial): Promise<PlanningMaterial>;
}

export interface IBatchRepository {
  findById(id: BatchId): Promise<PlanningBatch | null>;
  findByMaterial(materialId: MaterialId): Promise<PlanningBatch[]>;
  findAll(): Promise<PlanningBatch[]>;
  save(batch: PlanningBatch): Promise<PlanningBatch>;
}

export interface ISimulationRepository {
  findById(id: SimRunId): Promise<SimulationRun | null>;
  findAll(): Promise<SimulationRun[]>;
  save(run: SimulationRun): Promise<SimulationRun>;
}
