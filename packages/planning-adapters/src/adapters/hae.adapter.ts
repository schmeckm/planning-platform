/**
 * Hard Allocation Engine Adapter
 *
 * Bridges the existing HAE PostgreSQL database to the OPP canonical data model.
 * Reads directly from the normalized hap_* tables — no HTTP roundtrip, no auth.
 *
 * This adapter is the integration point between Level 1 (HAE) and Level 2 (OPP).
 * It is intentionally read-only: the planning kernel never writes back to HAE tables.
 *
 * HAE tables used:
 *   hap_packaging_orders  → PlanningOrder
 *   hap_packaging_lines   → PlanningResource (packaging lines)
 *   hap_resources         → PlanningResource (work centers)
 *   hap_materials         → PlanningMaterial
 *   hap_batches           → PlanningBatch
 *   hap_line_qualifications → PlanningResource.qualifiedMaterials
 *   hap_shift_calendars   → WorkingCalendar
 *
 * Connection:
 *   Uses ALLOCATION_DATABASE_URL from the HAE .env file.
 *   The same database the HAE backend uses.
 */

import { Pool } from 'pg';
import {
  asOrderId,
  asResourceId,
  asMaterialId,
  asBatchId,
  asOperationId,
} from '@PCP/planning-core';
import type {
  PlanningOrder,
  PlanningResource,
  PlanningMaterial,
  PlanningBatch,
  InventoryPosition,
  WorkingCalendar,
  CalendarShift,
  OrderStatus,
  OrderPriority,
  BatchStatus,
  SchedulingStatus,
} from '@PCP/planning-core';
import type {
  IPlanningAdapter,
  AdapterMetadata,
  AdapterHealthResult,
  AdapterOrderFilter,
} from '../interfaces/adapter.interface.js';

// ─── HAE Raw Row Types ────────────────────────────────────────────────────────

interface HaePackagingOrderRow {
  packaging_order_id: string;
  sap_order_number: string | null;
  material_number: string;
  quantity: string | number;
  plant_id: string | null;
  production_line: string | null;
  priority: string | number | null;
  status: string | null;
  lifecycle_stage: string | null;
  planned_start_date: string | Date | null;
  planned_end_date: string | Date | null;
  requested_delivery_date: string | Date | null;
  planned_duration_hours: string | number | null;
  sales_order_id: string | null;
  destination_country: string | null;
  batch_id: string | null;
}

interface HaePackagingLineRow {
  line_id: string;
  line_name: string;
  default_oee: string | number | null;
  is_bottleneck: boolean | null;
  capacity_units_per_hour: string | number | null;
}

interface HaeResourceRow {
  resource_id: string;
  resource_name: string;
  resource_type: string | null;
  capacity: string | number | null;
  oee: string | number | null;
}

interface HaeMaterialRow {
  material_number: string;
  material_description: string | null;
  package_type: string | null;
  base_unit_of_measure: string | null;
  shelf_life_days: string | number | null;
  min_remaining_shelf_life_days: string | number | null;
  storage_condition: string | null;
  requires_batch_release: boolean | null;
}

interface HaeBatchRow {
  batch_id: string;
  material_number: string;
  quantity: string | number | null;
  available_quantity: string | number | null;
  unit: string | null;
  quality_status: string | null;
  production_date: string | Date | null;
  expiry_date: string | Date | null;
  storage_location: string | null;
}

interface HaeAtpRow {
  material_number: string;
  storage_location: string | null;
  atp_quantity: string | number | null;
  quantity_on_hand: string | number | null;
  reserved_quantity: string | number | null;
  unit: string | null;
}

interface HaeLineAssignmentRow {
  production_line: string;
  material_number: string;
}

interface HaeLineQualificationRow {
  line_id: string;
  package_type: string;
}

interface HaeShiftRow {
  line_id: string | null;
  resource_id: string | null;
  day_of_week: number;
  shift_start: string;
  shift_end: string;
  timezone: string | null;
  valid_from: string | Date | null;
  valid_to: string | Date | null;
}

interface HaeInventoryRow {
  material_number: string;
  storage_location: string | null;
  unrestricted_stock: string | number | null;
  restricted_stock: string | number | null;
  unit_of_measure: string | null;
  last_updated: string | Date | null;
}

// ─── Adapter ─────────────────────────────────────────────────────────────────

export class HardAllocationEngineAdapter implements IPlanningAdapter {
  readonly metadata: AdapterMetadata = {
    id: 'hae.postgres',
    name: 'Hard Allocation Engine Adapter',
    version: '1.0.0',
    sourceSystem: 'HAE',
    description:
      'Reads planning data from the Hard Allocation Engine PostgreSQL database ' +
      'and maps hap_* tables to the OPP canonical data model. Read-only.',
    author: 'Open Planning Platform Contributors',
  };

  private materialPackageMap: Map<string, string> | null = null;
  private materialsByPackageType: Map<string, string[]> | null = null;

  constructor(private readonly pool: Pool) {}

  /** Maps HAE package_type (Tablet, Capsule, …) → material_number (DP-1000, …). */
  private async ensureMaterialMaps(): Promise<void> {
    if (this.materialPackageMap && this.materialsByPackageType) return;

    const { rows } = await this.pool.query<Pick<HaeMaterialRow, 'material_number' | 'package_type'>>(
      `SELECT material_number, package_type FROM hap_materials ORDER BY material_number`,
    );

    this.materialPackageMap = new Map();
    this.materialsByPackageType = new Map();

    for (const row of rows) {
      if (!row.package_type) continue;
      this.materialPackageMap.set(row.material_number, row.package_type);
      const list = this.materialsByPackageType.get(row.package_type) ?? [];
      list.push(row.material_number);
      this.materialsByPackageType.set(row.package_type, list);
    }
  }

  private resolvePackageTypesToMaterials(packageTypes: string[]): ReturnType<typeof asMaterialId>[] {
    const materialIds = new Set<string>();
    for (const packageType of packageTypes) {
      for (const materialNumber of this.materialsByPackageType?.get(packageType) ?? []) {
        materialIds.add(materialNumber);
      }
    }
    return [...materialIds].map(asMaterialId);
  }

  async testConnection(): Promise<AdapterHealthResult> {
    const t0 = Date.now();
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return {
        healthy: true,
        message: 'HAE PostgreSQL connection successful.',
        latencyMs: Date.now() - t0,
        detail: { database: 'hap', tables: 'hap_packaging_orders, hap_packaging_lines, ...' },
      };
    } catch (err) {
      return {
        healthy: false,
        message: `HAE PostgreSQL connection failed: ${String(err)}`,
        latencyMs: Date.now() - t0,
      };
    }
  }

  async fetchOrders(filter?: AdapterOrderFilter): Promise<PlanningOrder[]> {
    const conditions: string[] = [
      `lifecycle_stage IN ('PLANNED', 'RELEASED', 'IN_PROGRESS')`,
    ];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (filter?.plant) {
      conditions.push(`plant_id = $${paramIdx++}`);
      params.push(filter.plant);
    }
    if (filter?.dueBefore) {
      conditions.push(`requested_delivery_date <= $${paramIdx++}`);
      params.push(filter.dueBefore.toISOString().slice(0, 10));
    }
    if (filter?.statuses?.length) {
      conditions.push(`lifecycle_stage = ANY($${paramIdx++}::text[])`);
      params.push(filter.statuses);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await this.pool.query<HaePackagingOrderRow>(
      `SELECT * FROM hap_packaging_orders ${where} ORDER BY planned_start_date ASC NULLS LAST`,
      params,
    );

    await this.ensureMaterialMaps();
    return rows.map((r) => this.mapOrder(r));
  }

  async fetchResources(): Promise<PlanningResource[]> {
    await this.ensureMaterialMaps();

    const { rows: lines } = await this.pool.query<HaePackagingLineRow>(
      `SELECT * FROM hap_packaging_lines ORDER BY line_id`,
    );
    const { rows: quals } = await this.pool.query<HaeLineQualificationRow>(
      `SELECT line_id, package_type FROM hap_line_qualifications ORDER BY line_id`,
    );

    const qualMap = new Map<string, string[]>();
    for (const q of quals) {
      const list = qualMap.get(q.line_id) ?? [];
      list.push(q.package_type);
      qualMap.set(q.line_id, list);
    }

    const resources: PlanningResource[] = lines.map((l) => {
      const packageTypes = qualMap.get(l.line_id) ?? [];
      return {
        id: asResourceId(l.line_id),
        name: l.line_name,
        type: 'MACHINE' as const,
        capacity: Number(l.capacity_units_per_hour ?? 500),
        parallelCapacity: 1,
        oee: Number(l.default_oee ?? 0.85),
        qualifiedMaterials: this.resolvePackageTypesToMaterials(packageTypes),
        attributes: {
          isBottleneck: String(l.is_bottleneck ?? false),
          sourceTable: 'hap_packaging_lines',
          qualifiedPackageTypes: packageTypes.join(','),
        },
      };
    });

    const resourceById = new Map(resources.map((r) => [r.id as string, r]));

    // Enrich from live order assignments: production_line → material_number
    try {
      const { rows: assignments } = await this.pool.query<HaeLineAssignmentRow>(`
        SELECT DISTINCT production_line, material_number
        FROM hap_packaging_orders
        WHERE production_line IS NOT NULL AND material_number IS NOT NULL
      `);
      for (const assignment of assignments) {
        const resource = resourceById.get(assignment.production_line);
        if (!resource) continue;
        const materialId = asMaterialId(assignment.material_number);
        if (!resource.qualifiedMaterials.includes(materialId)) {
          resource.qualifiedMaterials.push(materialId);
        }
      }
    } catch {
      // Optional enrichment — ignore if table unavailable
    }

    // Also load generic resources (work centers) if the table exists
    try {
      const { rows: res } = await this.pool.query<HaeResourceRow>(
        `SELECT * FROM hap_resources ORDER BY resource_id`,
      );
      for (const r of res) {
        resources.push({
          id: asResourceId(r.resource_id),
          name: r.resource_name,
          type: this.mapResourceType(r.resource_type),
          capacity: Number(r.capacity ?? 1),
          parallelCapacity: 1,
          oee: Number(r.oee ?? 0.85),
          qualifiedMaterials: [],
          attributes: { sourceTable: 'hap_resources' },
        });
      }
    } catch {
      // hap_resources may not exist in all HAE deployments
    }

    return resources;
  }

  async fetchMaterials(): Promise<PlanningMaterial[]> {
    await this.ensureMaterialMaps();

    const { rows } = await this.pool.query<HaeMaterialRow>(
      `SELECT material_number, material_description, package_type FROM hap_materials ORDER BY material_number`,
    );
    return rows.map((r) => ({
      id: asMaterialId(r.material_number),
      name: r.material_description ?? r.material_number,
      description: r.material_description ?? '',
      unit: 'EA',
      requiresBatchRelease: true,
      isPatientSpecific: false,
      attributes: {
        sourceSystem: 'HAE',
        ...(r.package_type ? { packageType: r.package_type } : {}),
      },
    }));
  }

  async fetchBatches(): Promise<PlanningBatch[]> {
    const { rows } = await this.pool.query<HaeBatchRow>(
      `SELECT batch_id, material_number, quantity, available_quantity, unit,
              quality_status, production_date, expiry_date, storage_location
       FROM hap_batches ORDER BY batch_id`,
    );
    return rows.map((r) => ({
      id: asBatchId(r.batch_id),
      materialId: asMaterialId(r.material_number),
      quantity: Number(r.available_quantity ?? r.quantity ?? 0),
      unit: r.unit ?? 'EA',
      status: this.mapBatchStatus(r.quality_status),
      ...(r.production_date ? { manufactureDate: new Date(r.production_date) } : {}),
      ...(r.expiry_date ? { expiryDate: new Date(r.expiry_date) } : {}),
      availableFrom: r.production_date ? new Date(r.production_date) : new Date(),
      ...(r.storage_location ? { locationId: r.storage_location } : {}),
      attributes: { sourceSystem: 'HAE', qualityStatus: r.quality_status ?? 'UNKNOWN' },
    }));
  }

  async fetchInventory(): Promise<InventoryPosition[]> {
    try {
      const { rows } = await this.pool.query<HaeAtpRow>(`
        SELECT material_number,
               COALESCE(storage_location, 'DEFAULT') AS storage_location,
               SUM(COALESCE(atp_quantity, 0)) AS atp_quantity,
               SUM(COALESCE(quantity, 0)) AS quantity_on_hand,
               SUM(COALESCE(reserved_quantity, 0)) AS reserved_quantity,
               MAX(unit) AS unit
        FROM vw_batch_atp
        GROUP BY material_number, COALESCE(storage_location, 'DEFAULT')
        HAVING SUM(COALESCE(atp_quantity, 0)) > 0
      `);
      return rows.map((r) => ({
        materialId: asMaterialId(r.material_number),
        locationId: r.storage_location ?? 'DEFAULT',
        quantityOnHand: Number(r.quantity_on_hand ?? 0),
        quantityReserved: Number(r.reserved_quantity ?? 0),
        quantityAvailable: Number(r.atp_quantity ?? 0),
        unit: r.unit ?? 'EA',
        lastUpdated: new Date(),
      }));
    } catch {
      try {
        const { rows } = await this.pool.query<HaeAtpRow>(`
          SELECT material_number,
                 COALESCE(storage_location, 'DEFAULT') AS storage_location,
                 SUM(COALESCE(available_quantity, quantity, 0)) AS atp_quantity,
                 SUM(COALESCE(quantity, 0)) AS quantity_on_hand,
                 0 AS reserved_quantity,
                 MAX(unit) AS unit
          FROM hap_batches
          WHERE quality_status = 'RELEASED'
          GROUP BY material_number, COALESCE(storage_location, 'DEFAULT')
          HAVING SUM(COALESCE(available_quantity, quantity, 0)) > 0
        `);
        return rows.map((r) => ({
          materialId: asMaterialId(r.material_number),
          locationId: r.storage_location ?? 'DEFAULT',
          quantityOnHand: Number(r.quantity_on_hand ?? 0),
          quantityReserved: 0,
          quantityAvailable: Number(r.atp_quantity ?? 0),
          unit: r.unit ?? 'EA',
          lastUpdated: new Date(),
        }));
      } catch {
        return [];
      }
    }
  }

  async fetchCalendars(): Promise<WorkingCalendar[]> {
    try {
      const { rows } = await this.pool.query<HaeShiftRow>(
        `SELECT * FROM hap_shift_calendars ORDER BY line_id, day_of_week, shift_start`,
      );

      // Group shifts by resource
      const calMap = new Map<string, HaeShiftRow[]>();
      for (const row of rows) {
        const key = row.line_id ?? row.resource_id ?? 'DEFAULT';
        const list = calMap.get(key) ?? [];
        list.push(row);
        calMap.set(key, list);
      }

      const calendars: WorkingCalendar[] = [];
      for (const [resourceId, shifts] of calMap.entries()) {
        calendars.push({
          id: `CAL-${resourceId}` as never,
          name: `Calendar for ${resourceId}`,
          timezone: shifts[0]?.timezone ?? 'Europe/Berlin',
          shifts: shifts.map((s): CalendarShift => ({
            dayOfWeek: s.day_of_week as CalendarShift['dayOfWeek'],
            startTime: s.shift_start,
            endTime: s.shift_end,
          })),
          exceptions: [],
        });
      }

      return calendars;
    } catch {
      // hap_shift_calendars may not exist in all HAE deployments
      return [];
    }
  }

  // ─── Private mapping helpers ────────────────────────────────────────────────

  private mapOrder(r: HaePackagingOrderRow): PlanningOrder {
    const now = new Date();
    const earliestStart = r.planned_start_date ? new Date(r.planned_start_date) : now;
    const latestFinish = r.requested_delivery_date
      ? new Date(r.requested_delivery_date)
      : r.planned_end_date
        ? new Date(r.planned_end_date)
        : new Date(now.getTime() + 14 * 86_400_000);

    const durationHours = Number(r.planned_duration_hours ?? 8);
    const durationMinutes = Math.round(durationHours * 60);

    return {
      id: asOrderId(r.packaging_order_id),
      ...(r.sap_order_number ? { externalId: r.sap_order_number } : {}),
      sourceSystem: 'HAE',
      materialId: asMaterialId(r.material_number),
      ...(r.batch_id ? { batchId: asBatchId(r.batch_id) } : {}),
      quantity: Number(r.quantity ?? 0),
      unit: 'EA',
      priority: this.mapPriority(r.priority),
      status: this.mapOrderStatus(r.lifecycle_stage ?? r.status),
      earliestStart,
      latestFinish,
      durationMinutes,
      operations: r.production_line
        ? [
            {
              id: asOperationId(`${r.packaging_order_id}-OP-010`),
              orderId: asOrderId(r.packaging_order_id),
              sequence: 10,
              type: 'RUN',
              description: 'Production Run',
              resourceId: asResourceId(r.production_line),
              durationMinutes,
              setupMinutes: 30,
              teardownMinutes: 15,
              minLagMinutes: 0,
            },
          ]
        : [],
      tags: {
        'hae.plant': r.plant_id ?? '',
        'hae.salesOrder': r.sales_order_id ?? '',
        'hae.destinationCountry': r.destination_country ?? '',
        ...(this.materialPackageMap?.get(r.material_number)
          ? { 'hae.packageType': this.materialPackageMap.get(r.material_number)! }
          : {}),
        ...(r.production_line ? { 'hae.productionLine': r.production_line } : {}),
      },
      ...(r.destination_country ? { destinationCountry: r.destination_country.toUpperCase() } : {}),
      schedulingStatus: this.mapSchedulingStatus(r.lifecycle_stage ?? r.status),
      metadata: { originalRow: r.packaging_order_id },
      createdAt: now,
      updatedAt: now,
    };
  }

  private mapPriority(priority: string | number | null | undefined): OrderPriority {
    const p = Number(priority ?? 3);
    if (p <= 1) return 'CRITICAL';
    if (p === 2) return 'HIGH';
    if (p === 3) return 'NORMAL';
    return 'LOW';
  }

  private mapOrderStatus(status: string | null | undefined): OrderStatus {
    switch ((status ?? '').toUpperCase()) {
      case 'PLANNED':
      case 'ROUGH_PLANNED':
        return 'DRAFT';
      case 'RELEASED':
        return 'RELEASED';
      case 'IN_PROGRESS':
      case 'IN_PROCESS':
        return 'IN_PROCESS';
      case 'COMPLETED':
      case 'CLOSED':
        return 'COMPLETED';
      case 'BLOCKED':
        return 'BLOCKED';
      case 'CANCELLED':
        return 'CANCELLED';
      default:
        return 'RELEASED';
    }
  }

  private mapSchedulingStatus(status: string | null | undefined): SchedulingStatus {
    switch ((status ?? '').toUpperCase()) {
      case 'IN_PROGRESS':
      case 'IN_PROCESS':
        return 'FEASIBLE';
      case 'BLOCKED':
        return 'INFEASIBLE';
      case 'PLANNED':
      case 'ROUGH_PLANNED':
        return 'UNSCHEDULED';
      default:
        return 'PENDING';
    }
  }

  private mapBatchStatus(status: string | null | undefined): BatchStatus {
    switch ((status ?? '').toUpperCase()) {
      case 'RELEASED':
      case 'UNRESTRICTED':
        return 'RELEASED';
      case 'QA_HOLD':
      case 'QUALITY_HOLD':
        return 'QA_HOLD';
      case 'QC_HOLD':
      case 'INSPECTION':
        return 'QC_HOLD';
      case 'REJECTED':
        return 'REJECTED';
      case 'EXPIRED':
        return 'EXPIRED';
      case 'IN_PRODUCTION':
      case 'IN_PROCESS':
        return 'IN_PRODUCTION';
      case 'QUARANTINE':
        return 'QUARANTINE';
      default:
        return 'PLANNED';
    }
  }

  private mapResourceType(
    type: string | null | undefined,
  ): PlanningResource['type'] {
    switch ((type ?? '').toUpperCase()) {
      case 'MACHINE':
      case 'LINE':
      case 'EQUIPMENT':
        return 'MACHINE';
      case 'LABOR':
      case 'PERSON':
        return 'LABOR';
      case 'VESSEL':
      case 'TANK':
        return 'VESSEL';
      case 'CLEANROOM':
      case 'ROOM':
        return 'CLEANROOM';
      case 'STORAGE':
      case 'WAREHOUSE':
        return 'STORAGE';
      default:
        return 'MACHINE';
    }
  }
}

// ─── Factory: build adapter from env ─────────────────────────────────────────

/**
 * Creates a HardAllocationEngineAdapter using ALLOCATION_DATABASE_URL
 * from the environment (same variable the HAE backend uses).
 *
 * @example
 * import { createHaeAdapter } from '@PCP/planning-adapters'
 * const adapter = createHaeAdapter()
 * const orders = await adapter.fetchOrders()
 */
export function createHaeAdapter(connectionString?: string): HardAllocationEngineAdapter {
  const url =
    connectionString ??
    process.env['ALLOCATION_DATABASE_URL'] ??
    process.env['DATABASE_URL'];

  if (!url) {
    throw new Error(
      'HAE adapter requires ALLOCATION_DATABASE_URL or DATABASE_URL environment variable.',
    );
  }

  const pool = new Pool({ connectionString: url, max: 5 });
  return new HardAllocationEngineAdapter(pool);
}
