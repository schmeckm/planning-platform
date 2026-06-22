/**
 * apps/backend – PlanningService
 *
 * Application-layer service that wires together:
 *   Adapters → Repositories → ConstraintEngine → SimulationRepository
 *
 * This is the main entry point for the API layer.
 */

import {
  InMemoryOrderRepository,
  InMemoryResourceRepository,
  InMemoryMaterialRepository,
  InMemoryBatchRepository,
  InMemorySimulationRepository,
  PostgresSimulationRepository,
} from '@PCP/planning-core';
import type {
  PlanningOrder,
  SimulationRun,
  InventoryPosition,
  OrderId,
} from '@PCP/planning-core';
import type { ISimulationRepository } from '@PCP/planning-core';
import {
  ConstraintRegistry,
  ConstraintEngine,
  AtpAvailabilityConstraint,
  ResourceCapacityConstraint,
  RemainingShelfLifeConstraint,
} from '@PCP/planning-constraints';
import { pharmaConstraints } from '@PCP/planning-pharma';
import { cgtConstraints } from '@PCP/planning-cgt';
import { MockPharmaAdapter, createHaeAdapter } from '@PCP/planning-adapters';
import type { IPlanningAdapter } from '@PCP/planning-adapters';
import { randomUUID } from 'node:crypto';

function createSimulationRepository(): ISimulationRepository {
  const dbUrl = process.env['PCP_DATABASE_URL']
    ?? process.env['ALLOCATION_DATABASE_URL']
    ?? process.env['DATABASE_URL'];
  if (dbUrl) {
    try {
      const repo = new PostgresSimulationRepository(dbUrl);
      console.info('[PlanningService] PostgreSQL simulation repository enabled');
      return repo;
    } catch (err) {
      console.warn('[PlanningService] PostgreSQL simulation repo failed, using in-memory:', String(err));
    }
  }
  return new InMemorySimulationRepository();
}

export class PlanningService {
  readonly orderRepo = new InMemoryOrderRepository();
  readonly resourceRepo = new InMemoryResourceRepository();
  readonly materialRepo = new InMemoryMaterialRepository();
  readonly batchRepo = new InMemoryBatchRepository();
  readonly simulationRepo: ISimulationRepository;
  readonly registry = new ConstraintRegistry();
  readonly engine: ConstraintEngine;

  /** In-memory inventory store – keyed by `materialId::locationId` */
  private readonly inventoryStore = new Map<string, InventoryPosition>();

  private readonly adapters = new Map<string, IPlanningAdapter>();

  constructor() {
    this.simulationRepo = createSimulationRepository();

    // Register built-in generic constraints
    this.registry.register(new AtpAvailabilityConstraint());
    this.registry.register(new ResourceCapacityConstraint());
    this.registry.register(new RemainingShelfLifeConstraint());

    // Register pharma pack
    this.registry.registerMany(pharmaConstraints);

    // Register CGT pack
    this.registry.registerMany(cgtConstraints);

    this.engine = new ConstraintEngine(this.registry);

    // Register known adapters
    this.adapters.set('mock.pharma', new MockPharmaAdapter());

    // Register HAE adapter if database URL is configured
    const haeDbUrl = process.env['ALLOCATION_DATABASE_URL'] ?? process.env['DATABASE_URL'];
    if (haeDbUrl) {
      try {
        const haeAdapter = createHaeAdapter(haeDbUrl);
        this.adapters.set('hae.postgres', haeAdapter);
        console.info('[PlanningService] HAE PostgreSQL adapter registered (hae.postgres)');
      } catch (err) {
        console.warn('[PlanningService] HAE adapter could not be initialized:', String(err));
      }
    }
  }

  async loadFromAdapter(adapterId: string): Promise<{ loaded: number; adapter: string; breakdown: Record<string, number> }> {
    const adapter = this.adapters.get(adapterId);
    if (!adapter) {
      throw new Error(`Unknown adapter: "${adapterId}". Available: ${[...this.adapters.keys()].join(', ')}`);
    }

    const [orders, resources, materials, batches, inventory] = await Promise.all([
      adapter.fetchOrders().catch(() => []),
      adapter.fetchResources().catch(() => []),
      adapter.fetchMaterials().catch(() => []),
      adapter.fetchBatches().catch(() => []),
      adapter.fetchInventory().catch(() => []),
    ]);

    // Persist into repositories
    await Promise.all([
      this.orderRepo.saveMany(orders),
      ...resources.map(r => this.resourceRepo.save(r)),
      ...materials.map(m => this.materialRepo.save(m)),
      ...batches.map(b => this.batchRepo.save(b)),
    ]);

    // Upsert inventory positions (keyed by material + location)
    for (const pos of inventory) {
      const key = `${pos.materialId}::${pos.locationId}`;
      this.inventoryStore.set(key, pos);
    }

    console.info(
      `[PlanningService] Loaded from "${adapter.metadata.name}": ` +
        `${orders.length} orders, ${resources.length} resources, ` +
        `${materials.length} materials, ${batches.length} batches, ` +
        `${inventory.length} inventory positions`,
    );

    return {
      loaded: orders.length + resources.length + materials.length + batches.length + inventory.length,
      adapter: adapter.metadata.name,
      breakdown: {
        orders: orders.length,
        resources: resources.length,
        materials: materials.length,
        batches: batches.length,
        inventoryPositions: inventory.length,
      },
    };
  }

  async runSimulation(opts: {
    name: string;
    orderIds?: OrderId[];
    constraintIds?: string[];
    triggeredBy?: string;
  }): Promise<SimulationRun> {
    const allOrders = await this.orderRepo.findAll();
    const orders: PlanningOrder[] =
      opts.orderIds && opts.orderIds.length > 0
        ? allOrders.filter(o => opts.orderIds!.includes(o.id))
        : allOrders;

    const [resources, batches, materials] = await Promise.all([
      this.resourceRepo.findAll(),
      this.batchRepo.findAll(),
      this.materialRepo.findAll(),
    ]);

    const inventory = Array.from(this.inventoryStore.values());

    const output = await this.engine.evaluate({
      orders,
      context: {
        resources,
        batches,
        materials,
        inventory,
        evaluationTime: new Date(),
        extensions: {},
      },
      ...(opts.constraintIds?.length ? { constraintIds: opts.constraintIds } : {}),
      ...(opts.triggeredBy ? { triggeredBy: opts.triggeredBy } : {}),
    });

    // Persist updated scheduling status on orders
    await Promise.all(
      output.results.map(result => {
        const base = orders.find(o => o.id === result.orderId)!;
        return this.orderRepo.save({
          ...base,
          schedulingStatus: result.schedulingStatus,
          ...(result.scheduledStart ? { scheduledStart: result.scheduledStart } : {}),
          ...(result.scheduledFinish ? { scheduledFinish: result.scheduledFinish } : {}),
        });
      }),
    );

    const simRun: SimulationRun = {
      id: output.simRunId,
      name: opts.name,
      triggeredBy: opts.triggeredBy ?? 'api',
      startedAt: output.startedAt,
      finishedAt: output.finishedAt,
      status: 'COMPLETED',
      orderIds: orders.map(o => o.id),
      results: output.results,
      auditTrail: [
        {
          id: randomUUID(),
          simRunId: output.simRunId,
          timestamp: new Date(),
          actor: opts.triggeredBy ?? 'api',
          action: 'SIMULATION_COMPLETED',
          entityType: 'SimulationRun',
          entityId: output.simRunId,
          after: output.summary,
        },
      ],
      metadata: { summary: output.summary, durationMs: output.durationMs },
    };

    await this.simulationRepo.save(simRun);
    return simRun;
  }

  getAdapters() {
    return [...this.adapters.values()].map(a => a.metadata);
  }
}

/** Singleton service instance shared across routes. */
export const planningService = new PlanningService();
