/**
 * PostgreSQL JSONB repositories for canonical planning entities.
 */

import pg from 'pg';
import type {
  PlanningOrder,
  PlanningResource,
  PlanningMaterial,
  PlanningBatch,
  InventoryPosition,
  OrderId,
  ResourceId,
  MaterialId,
  BatchId,
} from '../types/canonical.types.js';
import type {
  IOrderRepository,
  IResourceRepository,
  IMaterialRepository,
  IBatchRepository,
  OrderFilter,
} from '../interfaces/repository.interface.js';
import { reviveBatch, reviveInventory, reviveOrder } from './postgres-jsonb.helpers.js';

export const PCP_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS pcp_simulation_runs (
  id UUID PRIMARY KEY,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pcp_simulation_runs_created
  ON pcp_simulation_runs (created_at DESC);

CREATE TABLE IF NOT EXISTS pcp_orders (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pcp_resources (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pcp_materials (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pcp_batches (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pcp_inventory (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

export class PostgresPlanningStore {
  readonly pool: pg.Pool;
  readonly orderRepo: PostgresOrderRepository;
  readonly resourceRepo: PostgresResourceRepository;
  readonly materialRepo: PostgresMaterialRepository;
  readonly batchRepo: PostgresBatchRepository;
  readonly inventoryStore: PostgresInventoryStore;
  private initialized = false;

  constructor(connectionString: string) {
    this.pool = new pg.Pool({ connectionString });
    this.orderRepo = new PostgresOrderRepository(this.pool);
    this.resourceRepo = new PostgresResourceRepository(this.pool);
    this.materialRepo = new PostgresMaterialRepository(this.pool);
    this.batchRepo = new PostgresBatchRepository(this.pool);
    this.inventoryStore = new PostgresInventoryStore(this.pool);
  }

  async ensureSchema(): Promise<void> {
    if (this.initialized) return;
    await this.pool.query(PCP_SCHEMA_SQL);
    this.initialized = true;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export class PostgresOrderRepository implements IOrderRepository {
  constructor(private readonly pool: pg.Pool) {}

  private async ensureSchema(): Promise<void> {
    await this.pool.query(PCP_SCHEMA_SQL);
  }

  async findById(id: OrderId): Promise<PlanningOrder | null> {
    await this.ensureSchema();
    const result = await this.pool.query<{ payload: PlanningOrder }>(
      'SELECT payload FROM pcp_orders WHERE id = $1',
      [id],
    );
    const row = result.rows[0];
    return row ? (reviveOrder(row.payload as unknown as Record<string, unknown>) as unknown as PlanningOrder) : null;
  }

  async findAll(filter?: OrderFilter): Promise<PlanningOrder[]> {
    await this.ensureSchema();
    const result = await this.pool.query<{ payload: PlanningOrder }>(
      'SELECT payload FROM pcp_orders ORDER BY updated_at DESC',
    );
    let orders = result.rows.map(row =>
      reviveOrder(row.payload as unknown as Record<string, unknown>) as unknown as PlanningOrder,
    );

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
    await this.ensureSchema();
    const updated = { ...order, updatedAt: new Date() };
    await this.pool.query(
      `INSERT INTO pcp_orders (id, payload, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`,
      [order.id, JSON.stringify(updated)],
    );
    return updated;
  }

  async saveMany(orders: PlanningOrder[]): Promise<PlanningOrder[]> {
    return Promise.all(orders.map(o => this.save(o)));
  }

  async delete(id: OrderId): Promise<void> {
    await this.ensureSchema();
    await this.pool.query('DELETE FROM pcp_orders WHERE id = $1', [id]);
  }
}

abstract class PostgresJsonEntityRepository<T extends { id: string }> {
  constructor(
    protected readonly pool: pg.Pool,
    protected readonly table: string,
  ) {}

  protected async ensureSchema(): Promise<void> {
    await this.pool.query(PCP_SCHEMA_SQL);
  }

  async findById(id: string): Promise<T | null> {
    await this.ensureSchema();
    const result = await this.pool.query<{ payload: T }>(
      `SELECT payload FROM ${this.table} WHERE id = $1`,
      [id],
    );
    return result.rows[0]?.payload ?? null;
  }

  async findAll(): Promise<T[]> {
    await this.ensureSchema();
    const result = await this.pool.query<{ payload: T }>(
      `SELECT payload FROM ${this.table} ORDER BY updated_at DESC`,
    );
    return result.rows.map(row => row.payload);
  }

  async save(entity: T): Promise<T> {
    await this.ensureSchema();
    await this.pool.query(
      `INSERT INTO ${this.table} (id, payload, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`,
      [entity.id, JSON.stringify(entity)],
    );
    return entity;
  }
}

export class PostgresResourceRepository
  extends PostgresJsonEntityRepository<PlanningResource>
  implements IResourceRepository
{
  constructor(pool: pg.Pool) {
    super(pool, 'pcp_resources');
  }

  override async findById(id: ResourceId): Promise<PlanningResource | null> {
    return super.findById(id);
  }
}

export class PostgresMaterialRepository
  extends PostgresJsonEntityRepository<PlanningMaterial>
  implements IMaterialRepository
{
  constructor(pool: pg.Pool) {
    super(pool, 'pcp_materials');
  }

  override async findById(id: MaterialId): Promise<PlanningMaterial | null> {
    return super.findById(id);
  }
}

export class PostgresBatchRepository
  extends PostgresJsonEntityRepository<PlanningBatch>
  implements IBatchRepository
{
  constructor(pool: pg.Pool) {
    super(pool, 'pcp_batches');
  }

  override async findById(id: BatchId): Promise<PlanningBatch | null> {
    const raw = await super.findById(id);
    return raw ? (reviveBatch(raw as unknown as Record<string, unknown>) as unknown as PlanningBatch) : null;
  }

  override async findAll(): Promise<PlanningBatch[]> {
    const rows = await super.findAll();
    return rows.map(row => reviveBatch(row as unknown as Record<string, unknown>) as unknown as PlanningBatch);
  }

  async findByMaterial(materialId: MaterialId): Promise<PlanningBatch[]> {
    const batches = await this.findAll();
    return batches.filter(b => b.materialId === materialId);
  }

  override async save(batch: PlanningBatch): Promise<PlanningBatch> {
    return super.save(batch);
  }
}

/** Persists inventory positions keyed as materialId::locationId */
export class PostgresInventoryStore {
  constructor(private readonly pool: pg.Pool) {}

  private async ensureSchema(): Promise<void> {
    await this.pool.query(PCP_SCHEMA_SQL);
  }

  async loadAll(): Promise<InventoryPosition[]> {
    await this.ensureSchema();
    const result = await this.pool.query<{ payload: InventoryPosition }>(
      'SELECT payload FROM pcp_inventory ORDER BY updated_at DESC',
    );
    return result.rows.map(row =>
      reviveInventory(row.payload as unknown as Record<string, unknown>) as unknown as InventoryPosition,
    );
  }

  async replaceAll(positions: InventoryPosition[]): Promise<void> {
    await this.ensureSchema();
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM pcp_inventory');
      for (const pos of positions) {
        const id = `${pos.materialId}::${pos.locationId}`;
        await client.query(
          `INSERT INTO pcp_inventory (id, payload, updated_at)
           VALUES ($1, $2::jsonb, NOW())`,
          [id, JSON.stringify(pos)],
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async upsert(pos: InventoryPosition): Promise<void> {
    await this.ensureSchema();
    const id = `${pos.materialId}::${pos.locationId}`;
    await this.pool.query(
      `INSERT INTO pcp_inventory (id, payload, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`,
      [id, JSON.stringify(pos)],
    );
  }
}
