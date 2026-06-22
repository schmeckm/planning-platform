# Architecture

## Package Overview

Pharma Collective Platform is organized as a **pnpm monorepo**. Each package has a single, well-defined responsibility. Packages may only depend on packages "below" them in the dependency graph — no circular dependencies are allowed.

```
planning-core          (no internal dependencies)
       │
planning-constraints   (depends on: planning-core)
       │
planning-pharma        (depends on: planning-core, planning-constraints)
planning-cgt           (depends on: planning-core, planning-constraints)
       │
planning-adapters      (depends on: planning-core)
planning-shopfloor     (operational module — live line transparency via MQTT)
       │
apps/backend               (depends on: all packages)
apps/frontend               (UI only, talks to API via HTTP)
```

## planning-core

The kernel. Contains only generic, industry-neutral planning concepts.

**What belongs here:**
- `Order` — a manufacturing request
- `Operation` — a step within an order
- `Resource` — a machine, line, room, person, or equipment
- `Calendar` — availability and shift patterns for a resource
- `Material` — input and output materials
- `Batch` — a specific produced quantity with traceability
- `ConstraintResult` — the output of a constraint evaluation
- `SimulationRun` — a set of orders evaluated against a set of constraints
- `AuditEntry` — immutable record of every planning decision

**What does NOT belong here:**
- Vendor-specific field names
- Industry-specific business rules
- ERP connection logic

## planning-constraints

The plugin engine. Defines the interface every constraint must implement and provides the engine that evaluates them.

```typescript
// Every constraint implements this interface
interface PlanningConstraint {
  readonly id: string
  readonly version: string
  readonly severity: 'BLOCKING' | 'WARNING' | 'SCORING' | 'RECOMMENDATION'

  evaluate(context: ConstraintContext): Promise<ConstraintResult>
  explain(result: ConstraintResult): string
  readonly testCases: ReadonlyArray<ConstraintTestCase>
}
```

The `ConstraintEngine` accepts an ordered list of constraints and evaluates them against a set of orders and resources. Results are aggregated into a `SimulationRun`.

## planning-pharma

The pharma industry pack. Contains constraints specific to GMP manufacturing.

Examples:
- `BatchReleaseConstraint` — order cannot be scheduled if batch is not QA released
- `CleaningValidationConstraint` — product family changeover requires valid cleaning
- `HoldTimeConstraint` — intermediate materials have maximum hold times
- `CampaignSequencingConstraint` — same product batches prefer consecutive scheduling
- `RMSLConstraint` — remaining material shelf life must cover the operation duration

## planning-cgt

The Cell & Gene Therapy pack. Contains constraints for personalized medicine manufacturing.

Examples:
- `ChainOfIdentityConstraint` — patient-specific materials must never be mixed
- `VeinToVeinTimelineConstraint` — total manufacturing window is fixed by patient need date
- `CryogenicStorageConstraint` — limited slots for frozen intermediate storage
- `ApheresisSchedulingConstraint` — apheresis date drives all downstream operations

## planning-adapters

Adapter interfaces. Every external system (ERP, MES, LIMS) must implement an adapter that maps its data into the canonical model. **The core never calls external systems directly.**

```typescript
interface PlanningDataAdapter {
  readonly systemId: string
  fetchOrders(filter: OrderFilter): Promise<Order[]>
  fetchResources(filter: ResourceFilter): Promise<Resource[]>
  fetchCalendars(resourceIds: string[]): Promise<Calendar[]>
  fetchInventory(materialIds: string[]): Promise<InventoryLevel[]>
}
```

## planning-shopfloor

Operational module for **live line transparency**. Unlike adapters (ERP master data), shopfloor exposes real-time MQTT telemetry to planners.

- `IShopfloorProvider` — board aggregation, MQTT config, shadow message store
- Canonical types: `ShopfloorBoard`, `ShopfloorLineBoard`, `ShopfloorMqttConfig`
- UI embedded from cockpit: `/planning/shopfloor-board` + admin MQTT tab
- API: `/api/pcp/v1/shopfloor/*` (PCP) and `/api/v1/shopfloor/*` (legacy HAE proxy)

See [Shopfloor Module](/modules/shopfloor) for full feature list and setup.

## Dependency Rule

> **No package may import from a package above it in the hierarchy.**

This ensures that `planning-core` can be used without any industry pack, and an adapter cannot contain business logic.

## Data Flow

```
External System (ERP/MES)
        │
        ▼ Adapter maps to canonical model
planning-core types
        │
        ▼ Constraint Engine evaluates
planning-constraints
        │
        ▼ Industry packs add domain rules
planning-pharma / planning-cgt
        │
        ▼ API assembles simulation run
apps/backend → SimulationRun with ConstraintResults
        │
        ▼
apps/frontend → Scheduling Board (Gantt + Violations)
        │
        ▼
apps/frontend → Shopfloor Board (live line KPIs via MQTT shadow)
```
