# Hard Allocation Engine Adapter

The `HardAllocationEngineAdapter` connects the existing Hard Allocation Engine (HAE) PostgreSQL database directly to the OPP constraint engine — no HTTP roundtrip, no authentication overhead.

This adapter is the integration point between **Level 1** (the production HAE system) and **Level 2** (the OPP framework).

## Architecture

```
OPP Constraint Engine
        ↓
PlanningService (apps/backend)
        ↓
HardAllocationEngineAdapter     ← reads from HAE PostgreSQL
        ↓
hap_packaging_orders            ← HAE normalized tables
hap_packaging_lines
hap_materials
hap_batches
hap_line_qualifications
hap_shift_calendars
```

The adapter is **read-only**. It never writes to HAE tables.

## Field Mapping

### Orders (`hap_packaging_orders` → `PlanningOrder`)

| HAE Field | OPP Field | Notes |
|---|---|---|
| `packaging_order_id` | `id` | Branded `OrderId` |
| `sap_order_number` | `externalId` | Optional |
| `material_number` | `materialId` | Branded `MaterialId` |
| `quantity` | `quantity` | Parsed as number |
| `priority` | `priority` | 1=CRITICAL, 2=HIGH, 3=NORMAL, 4+=LOW |
| `lifecycle_stage` | `status` | PLANNED→DRAFT, RELEASED→RELEASED, etc. |
| `planned_start_date` | `earliestStart` | |
| `requested_delivery_date` | `latestFinish` | Falls back to `planned_end_date` |
| `planned_duration_hours × 60` | `durationMinutes` | |
| `production_line` | `operations[0].resourceId` | Creates one RUN operation |
| `batch_id` | `batchId` | Optional |

### Resources (`hap_packaging_lines` → `PlanningResource`)

| HAE Field | OPP Field | Notes |
|---|---|---|
| `line_id` | `id` | Branded `ResourceId` |
| `line_name` | `name` | |
| `default_oee` | `oee` | |
| `hap_line_qualifications.package_type` | `qualifiedMaterials` | |

### Batches (`hap_batches` → `PlanningBatch`)

| HAE Field | OPP Field |
|---|---|
| `batch_id` | `id` |
| `material_number` | `materialId` |
| `quantity` | `quantity` |
| `status` | `status` (RELEASED, QA\_HOLD, QC\_HOLD, etc.) |
| `expiry_date` | `expiryDate` |
| `release_date` | `releaseDate` |

## Usage

### Start OPP API with HAE database

```bash
# Uses the same connection string as the HAE backend
ALLOCATION_DATABASE_URL=postgresql://hap:hap-local-dev@127.0.0.1:5432/hap \
node open-planning-platform/apps/backend/dist/index.js
```

The adapter is automatically registered when `ALLOCATION_DATABASE_URL` is set.

### Load HAE data and run simulation via API

```bash
# Load all orders, resources, materials, batches from HAE into OPP
curl -X POST http://localhost:3100/api/v1/simulations/load-adapter \
  -H "Content-Type: application/json" \
  -d '{"adapterId": "hae.postgres"}'

# Run constraint simulation on loaded data
curl -X POST http://localhost:3100/api/v1/simulations \
  -H "Content-Type: application/json" \
  -d '{"name": "HAE Live Simulation", "triggeredBy": "planner"}'
```

### Programmatic usage

```typescript
import { createHaeAdapter } from '@PCP/planning-adapters'
import { ConstraintRegistry, ConstraintEngine } from '@PCP/planning-constraints'
import { PharmaHoldTimeConstraint } from '@PCP/planning-pharma'

// Create adapter — reads from HAE database
const adapter = createHaeAdapter(process.env.ALLOCATION_DATABASE_URL)

// Verify connection
const health = await adapter.testConnection()
console.log(health.healthy, health.latencyMs) // true, ~5

// Load data
const [orders, resources, materials] = await Promise.all([
  adapter.fetchOrders({ plant: '1000', statuses: ['RELEASED'] }),
  adapter.fetchResources(),
  adapter.fetchMaterials(),
])

// Evaluate with OPP constraints
const registry = new ConstraintRegistry()
registry.register(new PharmaHoldTimeConstraint())
const engine = new ConstraintEngine(registry)

const result = await engine.evaluate({ orders, context: { resources, materials, ... } })
console.log(result.summary)
// { feasible: 8, infeasible: 2, blockersFired: 3 }
```

## Filter Options

```typescript
await adapter.fetchOrders({
  plant: '1000',                    // HAE plant_id
  statuses: ['RELEASED', 'PLANNED'], // lifecycle_stage filter
  dueBefore: new Date('2026-08-01'), // requested_delivery_date filter
})
```

## Connection String

The adapter uses `ALLOCATION_DATABASE_URL` (or `DATABASE_URL` as fallback) — the same variable the HAE backend uses. No additional configuration needed.

## Extending the Mapping

To map additional HAE fields, extend `HardAllocationEngineAdapter`:

```typescript
import { HardAllocationEngineAdapter } from '@PCP/planning-adapters'

class MyHaeAdapter extends HardAllocationEngineAdapter {
  async fetchOrders() {
    const orders = await super.fetchOrders()
    // Add additional mapping here
    return orders.map(o => ({
      ...o,
      tags: { ...o.tags, 'myco.customField': '...' },
    }))
  }
}
```
