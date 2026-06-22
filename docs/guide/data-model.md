# Canonical Data Model

The canonical data model is the language of `planning-core`. All external systems must be translated into this model before the scheduling engine processes them.

All IDs use **branded types** — a TypeScript pattern that prevents accidentally mixing an `OrderId` with a `ResourceId`, even though both are strings at runtime.

## Core Entities

### PlanningOrder

A manufacturing request — what needs to be produced, in what quantity, and by when.

```typescript
import type { PlanningOrder, OrderId, MaterialId } from '@PCP/planning-core'
import { asOrderId, asMaterialId } from '@PCP/planning-core'

const order: PlanningOrder = {
  id: asOrderId('ORD-001'),
  externalId: '0001234567',       // ERP order number
  sourceSystem: 'SAP',
  materialId: asMaterialId('MAT-AMOX-500'),
  quantity: 1000,
  unit: 'KG',
  priority: 'HIGH',
  status: 'RELEASED',
  earliestStart: new Date('2026-07-01T06:00:00Z'),
  latestFinish: new Date('2026-07-05T22:00:00Z'),
  durationMinutes: 480,
  operations: [],                 // see PlanningOperation
  tags: {
    'sap.plant': '1000',
    'pharma.batchClassification': 'EXHIBIT',
  },
  schedulingStatus: 'PENDING',
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
}
```

**Order status lifecycle:** `DRAFT → RELEASED → IN_PROCESS → COMPLETED`

**Scheduling status:** Set by the constraint engine — `PENDING | FEASIBLE | SOFT_VIOLATION | INFEASIBLE | UNSCHEDULED`

### PlanningOperation

A single step within an order (e.g., "Dispensing", "Granulation", "Drying", "Filling").

```typescript
interface PlanningOperation {
  id: OperationId
  orderId: OrderId
  sequence: number
  type: OperationType        // SETUP | RUN | TEARDOWN | HOLD | INSPECTION | QC_SAMPLING | ...
  description: string
  resourceId?: ResourceId
  durationMinutes: number
  setupMinutes: number
  teardownMinutes: number
  /** Operations must wait this long before the next can start (hold time) */
  minLagMinutes: number
  maxLagMinutes?: number     // max hold time — relevant for ICH Q7
  scheduledStart?: Date
  scheduledFinish?: Date
}
```

### PlanningResource

A machine, room, line, vessel, or piece of equipment.

```typescript
interface PlanningResource {
  id: ResourceId
  name: string
  type: ResourceType         // MACHINE | VESSEL | CLEANROOM | LABOR | ANALYTICAL_INSTRUMENT | ...
  calendarId?: CalendarId
  capacity: number           // available capacity units per time unit
  parallelCapacity: number   // simultaneous jobs supported
  oee: number               // Overall Equipment Effectiveness 0–1
  qualifiedMaterials: MaterialId[]  // qualification matrix
  attributes: Record<string, string | number | boolean>
}
```

### WorkingCalendar

Working time and availability for a resource.

```typescript
interface WorkingCalendar {
  id: CalendarId
  name: string
  timezone: string           // IANA timezone, e.g. 'Europe/Berlin'
  shifts: CalendarShift[]
  exceptions: CalendarException[]  // holidays, planned downtime
}

interface CalendarShift {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6  // 0 = Sunday
  startTime: string   // 'HH:MM'
  endTime: string     // 'HH:MM'
}
```

### PlanningBatch

A manufactured or procured batch with full traceability.

```typescript
interface PlanningBatch {
  id: BatchId
  materialId: MaterialId
  quantity: number
  unit: string
  status: BatchStatus  // PLANNED | IN_PRODUCTION | QC_HOLD | QA_HOLD | RELEASED | REJECTED | EXPIRED
  manufactureDate?: Date
  expiryDate?: Date
  releaseDate?: Date
  availableFrom: Date
  patientId?: string   // CGT: patient-specific batches
  attributes: Record<string, string | number | boolean>
}
```

### InventoryPosition

Current stock of a material at a location.

```typescript
interface InventoryPosition {
  materialId: MaterialId
  locationId: string
  quantityOnHand: number
  quantityReserved: number
  quantityAvailable: number   // = onHand - reserved
  unit: string
  lastUpdated: Date
}
```

## Extensibility via `tags` and `attributes`

Every core entity has an extension mechanism. Use it to store system-specific metadata without polluting the canonical model:

```typescript
// System-specific metadata stays in tags — the core model stays clean
const order: PlanningOrder = {
  id: asOrderId('ORD-001'),
  // ...canonical fields...
  tags: {
    'sap.plant': '1000',
    'sap.mrpController': 'P01',
    'pharma.batchClassification': 'EXHIBIT',
    'campaign.id': 'CAMP-2026-Q3',
  },
}
```

**Tag namespacing convention:**
- `sap.*` — SAP-specific fields
- `pharma.*` — pharmaceutical regulatory metadata
- `cgt.*` — cell & gene therapy fields
- `mes.*` — MES system fields
- `lims.*` — LIMS system fields

## Simulation & Audit

Every planning run is recorded as a `SimulationRun` with a full `AuditTrail`, supporting GxP traceability requirements.

```typescript
interface SimulationRun {
  id: SimRunId
  name: string
  triggeredBy: string         // user or system that triggered this run
  startedAt: Date
  status: 'RUNNING' | 'COMPLETED' | 'FAILED'
  orderIds: OrderId[]
  results: SimulationResult[]
  auditTrail: AuditEntry[]    // immutable record of all decisions
}
```
