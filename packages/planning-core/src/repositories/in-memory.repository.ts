/**
 * planning-core / in-memory.repository.ts
 *
 * In-memory reference implementation of all repositories.
 * Suitable for testing, development, and mock-data seeding.
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
} from '../types/canonical.types.js';
import type {
  IOrderRepository,
  IResourceRepository,
  IMaterialRepository,
  IBatchRepository,
  ISimulationRepository,
  OrderFilter,
} from '../interfaces/repository.interface.js';

export class InMemoryOrderRepository implements IOrderRepository {
  private readonly store = new Map<OrderId, PlanningOrder>();

  async findById(id: OrderId): Promise<PlanningOrder | null> {
    return this.store.get(id) ?? null;
  }

  async findAll(filter?: OrderFilter): Promise<PlanningOrder[]> {
    let orders = Array.from(this.store.values());

    if (filter?.status) {
      orders = orders.filter(o => filter.status!.includes(o.status));
    }
    if (filter?.schedulingStatus) {
      orders = orders.filter(o => filter.schedulingStatus!.includes(o.schedulingStatus));
    }
    if (filter?.materialId) {
      orders = orders.filter(o => o.materialId === filter.materialId);
    }
    if (filter?.dueBefore) {
      orders = orders.filter(o => o.latestFinish <= filter.dueBefore!);
    }
    if (filter?.dueAfter) {
      orders = orders.filter(o => o.latestFinish >= filter.dueAfter!);
    }

    return orders;
  }

  async save(order: PlanningOrder): Promise<PlanningOrder> {
    const updated = { ...order, updatedAt: new Date() };
    this.store.set(order.id, updated);
    return updated;
  }

  async saveMany(orders: PlanningOrder[]): Promise<PlanningOrder[]> {
    return Promise.all(orders.map(o => this.save(o)));
  }

  async delete(id: OrderId): Promise<void> {
    this.store.delete(id);
  }
}

export class InMemoryResourceRepository implements IResourceRepository {
  private readonly store = new Map<ResourceId, PlanningResource>();

  async findById(id: ResourceId): Promise<PlanningResource | null> {
    return this.store.get(id) ?? null;
  }

  async findAll(): Promise<PlanningResource[]> {
    return Array.from(this.store.values());
  }

  async save(resource: PlanningResource): Promise<PlanningResource> {
    this.store.set(resource.id, resource);
    return resource;
  }
}

export class InMemoryMaterialRepository implements IMaterialRepository {
  private readonly store = new Map<MaterialId, PlanningMaterial>();

  async findById(id: MaterialId): Promise<PlanningMaterial | null> {
    return this.store.get(id) ?? null;
  }

  async findAll(): Promise<PlanningMaterial[]> {
    return Array.from(this.store.values());
  }

  async save(material: PlanningMaterial): Promise<PlanningMaterial> {
    this.store.set(material.id, material);
    return material;
  }
}

export class InMemoryBatchRepository implements IBatchRepository {
  private readonly store = new Map<BatchId, PlanningBatch>();

  async findById(id: BatchId): Promise<PlanningBatch | null> {
    return this.store.get(id) ?? null;
  }

  async findByMaterial(materialId: MaterialId): Promise<PlanningBatch[]> {
    return Array.from(this.store.values()).filter(b => b.materialId === materialId);
  }

  async findAll(): Promise<PlanningBatch[]> {
    return Array.from(this.store.values());
  }

  async save(batch: PlanningBatch): Promise<PlanningBatch> {
    this.store.set(batch.id, batch);
    return batch;
  }
}

export class InMemorySimulationRepository implements ISimulationRepository {
  private readonly store = new Map<SimRunId, SimulationRun>();

  async findById(id: SimRunId): Promise<SimulationRun | null> {
    return this.store.get(id) ?? null;
  }

  async findAll(): Promise<SimulationRun[]> {
    return Array.from(this.store.values()).sort(
      (a, b) => b.startedAt.getTime() - a.startedAt.getTime(),
    );
  }

  async save(run: SimulationRun): Promise<SimulationRun> {
    this.store.set(run.id, run);
    return run;
  }
}
