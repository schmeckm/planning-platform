/**
 * planning-core / canonical.types.ts
 *
 * Canonical data model for the Pharma Collective Platform.
 *
 * Design principle: These types are ERP-agnostic and system-agnostic.
 * Every adapter (SAP, ERPNext, CSV, …) must map INTO these types.
 * The planning kernel only speaks this language.
 */

// ─── Primitive Identifiers ────────────────────────────────────────────────────

export type OrderId    = string & { readonly __brand: 'OrderId' };
export type ResourceId = string & { readonly __brand: 'ResourceId' };
export type MaterialId = string & { readonly __brand: 'MaterialId' };
export type BatchId    = string & { readonly __brand: 'BatchId' };
export type CalendarId = string & { readonly __brand: 'CalendarId' };
export type SimRunId   = string & { readonly __brand: 'SimRunId' };
export type OperationId = string & { readonly __brand: 'OperationId' };
export type ConstraintId = string & { readonly __brand: 'ConstraintId' };

export function asOrderId(id: string): OrderId       { return id as OrderId; }
export function asResourceId(id: string): ResourceId { return id as ResourceId; }
export function asMaterialId(id: string): MaterialId { return id as MaterialId; }
export function asBatchId(id: string): BatchId       { return id as BatchId; }
export function asSimRunId(id: string): SimRunId     { return id as SimRunId; }
export function asOperationId(id: string): OperationId { return id as OperationId; }
export function asConstraintId(id: string): ConstraintId { return id as ConstraintId; }

// ─── Enumerations ─────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'DRAFT'
  | 'RELEASED'
  | 'IN_PROCESS'
  | 'COMPLETED'
  | 'BLOCKED'
  | 'CANCELLED';

export type OrderPriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';

export type OperationType =
  | 'SETUP'
  | 'RUN'
  | 'TEARDOWN'
  | 'CLEANING'
  | 'INSPECTION'
  | 'HOLD'
  | 'TRANSPORT'
  | 'QC_SAMPLING'
  | 'RELEASE'
  | 'STORAGE';

export type ResourceType =
  | 'MACHINE'
  | 'LABOR'
  | 'VESSEL'
  | 'CLEANROOM'
  | 'STORAGE'
  | 'ANALYTICAL_INSTRUMENT'
  | 'VIRTUAL';

export type BatchStatus =
  | 'PLANNED'
  | 'IN_PRODUCTION'
  | 'QC_HOLD'
  | 'QA_HOLD'
  | 'RELEASED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'QUARANTINE';

/** SAP QM inspection lot lifecycle mapped to canonical planning checks. */
export type InspectionLotStatus = 'OPEN' | 'RELEASED' | 'REJECTED' | 'SKIPPED';

export type ConstraintSeverity = 'BLOCKER' | 'WARNING' | 'RECOMMENDATION' | 'INFO';

export type SchedulingStatus =
  | 'FEASIBLE'
  | 'INFEASIBLE'
  | 'SOFT_VIOLATION'
  | 'UNSCHEDULED'
  | 'PENDING';

// ─── Core Domain Entities ─────────────────────────────────────────────────────

/** A planning order – the central schedulable unit. */
export interface PlanningOrder {
  readonly id: OrderId;
  readonly externalId?: string;           // ERP order number (e.g., SAP production order)
  readonly sourceSystem?: string;         // 'SAP', 'ERPNext', 'MOCK', …
  materialId: MaterialId;
  batchId?: BatchId;
  quantity: number;
  unit: string;
  priority: OrderPriority;
  status: OrderStatus;
  /** Earliest allowed start (hard constraint) */
  earliestStart: Date;
  /** Required completion deadline */
  latestFinish: Date;
  /** Estimated duration in minutes */
  durationMinutes: number;
  operations: PlanningOperation[];
  /** Tags for grouping (campaign, product family, customer, …) */
  tags: Record<string, string>;
  /** Patient ID for CGT patient-specific orders */
  patientId?: string;
  /** Destination market (ISO 3166-1 alpha-2) for TRIC / country release checks */
  destinationCountry?: string;
  schedulingStatus: SchedulingStatus;
  scheduledStart?: Date;
  scheduledFinish?: Date;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/** An individual step within a planning order. */
export interface PlanningOperation {
  readonly id: OperationId;
  orderId: OrderId;
  sequence: number;
  type: OperationType;
  description: string;
  resourceId?: ResourceId;
  durationMinutes: number;
  setupMinutes: number;
  teardownMinutes: number;
  /** Must finish before next operation can start (in minutes, 0 = immediate) */
  minLagMinutes: number;
  maxLagMinutes?: number;
  scheduledStart?: Date;
  scheduledFinish?: Date;
}

/** A producible / consumable resource. */
export interface PlanningResource {
  readonly id: ResourceId;
  name: string;
  type: ResourceType;
  calendarId?: CalendarId;
  /** Available capacity units per time unit */
  capacity: number;
  /** Parallel jobs supported simultaneously */
  parallelCapacity: number;
  /** OEE factor 0–1 */
  oee: number;
  /** Qualification matrix: which materials/products this resource can process */
  qualifiedMaterials: MaterialId[];
  attributes: Record<string, string | number | boolean>;
}

/** Canonical material / product definition. */
export interface PlanningMaterial {
  readonly id: MaterialId;
  name: string;
  description: string;
  unit: string;
  /** Minimum remaining shelf life in days required at point of use */
  minRemainingShelfLifeDays?: number;
  /** Total shelf life in days from manufacture */
  shelfLifeDays?: number;
  storageCondition?: string;
  requiresBatchRelease: boolean;
  isPatientSpecific: boolean;
  attributes: Record<string, string | number | boolean>;
}

/** A manufactured or procured batch. */
export interface PlanningBatch {
  readonly id: BatchId;
  materialId: MaterialId;
  quantity: number;
  unit: string;
  status: BatchStatus;
  manufactureDate?: Date;
  expiryDate?: Date;
  releaseDate?: Date;
  availableFrom: Date;
  /** Location/warehouse identifier */
  locationId?: string;
  /** Chain of identity – for CGT patient-specific batches */
  patientId?: string;
  /** Countries where batch is market-released (TRIC / QP release) */
  approvedCountries?: string[];
  /** QM inspection lot status when batch release depends on lab completion */
  inspectionLotStatus?: InspectionLotStatus;
  attributes: Record<string, string | number | boolean>;
}

/** Inventory position for a material at a location. */
export interface InventoryPosition {
  materialId: MaterialId;
  locationId: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  unit: string;
  lastUpdated: Date;
}

/** A working calendar defining resource availability. */
export interface WorkingCalendar {
  readonly id: CalendarId;
  name: string;
  timezone: string;
  shifts: CalendarShift[];
  exceptions: CalendarException[];
}

export interface CalendarShift {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
}

export interface CalendarException {
  date: Date;
  available: boolean;
  reason?: string;
}

// ─── Simulation & Results ─────────────────────────────────────────────────────

/** A planning simulation run – isolated snapshot of the planning state. */
export interface SimulationRun {
  readonly id: SimRunId;
  name: string;
  description?: string;
  triggeredBy: string;
  startedAt: Date;
  finishedAt?: Date;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  orderIds: OrderId[];
  results: SimulationResult[];
  auditTrail: AuditEntry[];
  metadata: Record<string, unknown>;
}

export interface SimulationResult {
  orderId: OrderId;
  schedulingStatus: SchedulingStatus;
  scheduledStart?: Date;
  scheduledFinish?: Date;
  constraintResults: ConstraintEvaluationResult[];
  score?: number;
  explanation: string;
}

// ─── Constraint Result ────────────────────────────────────────────────────────

/** Returned by every constraint plugin after evaluation. */
export interface ConstraintEvaluationResult {
  constraintId: ConstraintId;
  constraintVersion: string;
  severity: ConstraintSeverity;
  passed: boolean;
  score: number;          // 0 (worst) – 1 (perfect)
  message: string;
  /** Human-readable explanation for planners and QA users */
  explanation: string;
  /** Suggested corrective action */
  correctionHint?: string;
  /** Validation references (URS, FS, DS, Test IDs) */
  validationRefs?: ValidationReference[];
  detail: Record<string, unknown>;
}

export interface ValidationReference {
  type: 'URS' | 'FS' | 'DS' | 'TP' | 'TC' | 'DEVIATION';
  id: string;
  description?: string;
}

// ─── Audit Trail ─────────────────────────────────────────────────────────────

export interface AuditEntry {
  readonly id: string;
  simRunId: SimRunId;
  timestamp: Date;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
  electronicSignature?: string;
}
