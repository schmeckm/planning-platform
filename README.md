# Pharma Collective Platform — Module: Planning

> **Modular · Extensible · Open** — A manufacturing scheduling kernel designed like the Linux Kernel.

---

## The Linux Kernel Concept for Planning

The Linux Kernel is small, stable, and generic. Industry-specific functionality lives in **loadable modules** — contributed, versioned, and independently maintained.

The Pharma Collective Platform applies the same principle to manufacturing planning:

```
┌─────────────────────────────────────────────────────────────────┐
│                     Planning Kernel (Core)                      │
│  Orders · Resources · Calendars · Materials · Batches           │
│  Constraints · Simulation Runs · Scheduling Results · Audit     │
└─────────────────────────────────────────────────────────────────┘
         ↑ Plugin Interface (IConstraintPlugin)
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ Pharma Pack    │ │ CGT Pack       │ │ Semiconductor  │
│ Batch Release  │ │ Chain of       │ │ Pack (future)  │
│ Hold Time      │ │ Identity       │ │                │
│ RMSL Check     │ │ Vein-to-Vein   │ │                │
└────────────────┘ └────────────────┘ └────────────────┘
         ↑ Adapter Interface (IPlanningAdapter)
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ SAP S/4HANA    │ │ ERPNext        │ │ Mock / HAE     │
│ Adapter v0.2   │ │ Adapter v0.1   │ │ Adapters       │
└────────────────┘ └────────────────┘ └────────────────┘
```

**Core principle**: The planning kernel never knows about vendor-specific ERP fields or proprietary planning concepts.
Everything is mapped to the **canonical data model** before entering the kernel.

---

## Repository Structure

```
open-planning-platform/
├── packages/
│   ├── planning-core/          # Canonical data model, interfaces, repositories
│   ├── planning-constraints/   # Plugin framework + built-in generic constraints
│   ├── planning-pharma/        # Pharma manufacturing industry pack
│   ├── planning-cgt/           # Cell & Gene Therapy industry pack
│   ├── planning-adapters/      # ERP/MES/LIMS adapter layer
│   ├── planning-shopfloor/     # Live line transparency (MQTT + board)
│   ├── planning-sdk/           # TypeScript SDK (canonical type re-exports)
│   └── planning-scenarios/     # Demo scenarios (scaffold)
├── apps/
│   ├── backend/                # Express REST API with Swagger
│   └── frontend/               # Vue.js scheduling board
├── docs/                       # VitePress documentation site
├── docker/
│   └── postgres/init.sql       # PostgreSQL schema
├── docker-compose.yml
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── README.md
```

---

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 9+
- Docker & Docker Compose (optional)

### Development Mode

```bash
# From inside open-planning-platform/
pnpm install

# Start the API (port 3100)
pnpm dev:backend

# Start the web board (port 5173)
pnpm dev:frontend

# Start VitePress docs (port 5200)
pnpm dev:docs
```

Then open:
- **Scheduling Board**: http://localhost:5173
- **Swagger UI**: http://localhost:3100/docs
- **Health Check**: http://localhost:3100/api/pcp/v1/health
- **Docs (dev)**: http://localhost:5200

### Docker Mode

```bash
# OPP Postgres uses host port 5433 (avoids conflict with HAE Postgres on 5432)
cp apps/backend/.env.example apps/backend/.env
docker compose up -d postgres redis
pnpm --filter @PCP/backend db:migrate
pnpm --filter @PCP/backend db:seed

pnpm install
pnpm --filter @PCP/backend... build
docker compose up -d

# Full embedded UI (HAE monorepo must be build context for frontend)
docker compose --profile embedded up -d --build

# Standalone / vendor layout (after pnpm sync:vendor)
docker compose --profile standalone up -d --build
```

→ [HAE integration guide](docs/developers/hae-integration.md) for `HAE_MONOREPO_ROOT`, submodules, and `vendor/` layout.  
→ [Repository extraction](docs/developers/repo-extraction.md) for `pnpm export:standalone` and GitHub split (PR 9).

---

## MVP Walkthrough

### 1. Load Mock Pharma Data

```bash
curl -X POST http://localhost:3100/api/pcp/v1/simulations/load-adapter \
  -H "Content-Type: application/json" \
  -d '{ "adapterId": "mock.pharma" }'
```

This loads:
- 4 materials (API, Finished Good, CAR-T, mAb)
- 6 resources (Granulation Lines, Bioreactor, CGT Suite, QC Lab)
- 5 batches (released, QA-hold, QC-hold, CGT patient-specific)
- 5 orders (pharma + CGT, mixing feasible and blocked scenarios)

### 2. Run Constraint Evaluation

```bash
curl -X POST http://localhost:3100/api/pcp/v1/simulations \
  -H "Content-Type: application/json" \
  -d '{ "name": "MVP Demo Simulation", "triggeredBy": "planner" }'
```

The engine evaluates **13 constraints** across all orders:
- ATP Availability Check
- Resource Capacity Check
- Remaining Shelf Life (RMSL)
- GMP Batch Release Status
- Hold Time Check
- Country Batch Release (TRIC)
- Cleaning Validation Matrix
- Campaign Sequencing (soft)
- QA Inspection Lot Status
- Chain of Identity (CGT)
- Vein-to-Vein Deadline (CGT)
- Cryogenic Storage Capacity (CGT)
- Courier Shipment Window (CGT)

### 3. View Results

```bash
curl http://localhost:3100/api/pcp/v1/simulations | jq .
```

Expected scheduling outcomes:
| Order | Scenario | Expected Result |
|---|---|---|
| ORD-PH-001 | Good pharma order | FEASIBLE |
| ORD-PH-002 | QA_HOLD batch | INFEASIBLE (batch release blocker) |
| ORD-PH-003 | Capacity overflow | INFEASIBLE (resource capacity blocker) |
| ORD-CGT-001 | Matching patient IDs | FEASIBLE |
| ORD-CGT-002 | QC_HOLD CGT batch | INFEASIBLE (batch release + CoI) |

### 4. Check Constraint Plugins

```bash
# List all registered plugins
curl http://localhost:3100/api/pcp/v1/constraints | jq .

# Run self-tests
curl -X POST http://localhost:3100/api/pcp/v1/constraints/self-test | jq .
```

---

## Implementing a New Constraint Plugin

Every constraint must implement `IConstraintPlugin`:

```typescript
import type { IConstraintPlugin, ConstraintContext, ConstraintMetadata } from '@PCP/planning-constraints';
import { buildPassResult, buildFailResult } from '@PCP/planning-constraints';
import { asConstraintId } from '@PCP/planning-core';

const META: ConstraintMetadata = {
  id: asConstraintId('pharma.cleaning.validation'),
  version: '1.0.0',
  name: 'Cleaning Validation Matrix Check',
  description: 'Verifies that the cleaning procedure for the previous product is validated for the next product.',
  domain: 'PHARMA',
  defaultSeverity: 'BLOCKER',
  validationRefs: [
    { type: 'URS', id: 'URS-PH-010', description: 'Cleaning validation before product changeover' },
  ],
  author: 'Your Name',
  license: 'Apache-2.0',
  tags: ['pharma', 'cleaning', 'changeover'],
};

export class PharmaCleanoingValidationConstraint implements IConstraintPlugin {
  readonly metadata = META;

  async evaluate(ctx: ConstraintContext) {
    // Your logic here
    return buildPassResult(META, 'Cleaning validation check passed.', {});
  }

  async selfTest() {
    // Test cases here
    return { pluginId: META.id, pluginVersion: META.version, passed: true, testsPassed: 1, testsFailed: 0, failedTests: [], durationMs: 0 };
  }
}
```

Then register it:
```typescript
import { globalRegistry } from '@PCP/planning-constraints';
globalRegistry.register(new PharmaCleanoingValidationConstraint());
```

---

## Implementing a New Adapter

```typescript
import type { IPlanningAdapter } from '@PCP/planning-adapters';
import { asMaterialId, asOrderId } from '@PCP/planning-core';

export class MyErpAdapter implements IPlanningAdapter {
  readonly metadata = {
    id: 'my.erp',
    name: 'My ERP Adapter',
    version: '1.0.0',
    sourceSystem: 'MY-ERP',
    description: 'Maps My ERP data to canonical planning model.',
    author: 'You',
  };

  async fetchOrders() {
    const erpData = await myErpApiCall();
    // Map ERP fields → canonical PlanningOrder
    return erpData.map(o => ({
      id: asOrderId(`MYERP-${o.orderNumber}`),
      externalId: o.orderNumber,
      materialId: asMaterialId(o.itemCode),
      // ... map remaining fields
    }));
  }
  // ... other methods
}
```

---

## Constraint Interface Contract

```
IConstraintPlugin
├── metadata: ConstraintMetadata
│   ├── id: ConstraintId          (globally unique, e.g. 'pharma.batch.release')
│   ├── version: string           (semantic versioning)
│   ├── domain: ConstraintDomain  (GENERIC | PHARMA | CGT | ...)
│   ├── defaultSeverity: BLOCKER | WARNING | RECOMMENDATION | INFO
│   └── validationRefs: URS | FS | DS | TP | TC (GxP traceability)
├── evaluate(ctx): Promise<ConstraintEvaluationResult>
│   └── Returns: { passed, severity, score, message, explanation, correctionHint }
└── selfTest(): Promise<ConstraintSelfTestResult>
    └── Returns: { passed, testsPassed, testsFailed, failedTests }
```

---

## Canonical Data Model

The kernel only speaks these types — never ERP-specific schemas:

| Type | Description |
|---|---|
| `PlanningOrder` | The central schedulable unit |
| `PlanningOperation` | A step within an order (Setup/Run/Teardown/Hold/…) |
| `PlanningResource` | Machine, vessel, cleanroom, labor, storage |
| `PlanningMaterial` | Product / component definition |
| `PlanningBatch` | Manufactured or procured batch |
| `InventoryPosition` | ATP stock by location |
| `WorkingCalendar` | Shifts and exceptions |
| `SimulationRun` | Isolated planning snapshot |
| `ConstraintEvaluationResult` | Per-order per-constraint result |
| `AuditEntry` | GxP-ready audit trail entry |

---

## Validation Framework (GxP Readiness)

Every constraint plugin carries `validationRefs`:

```typescript
validationRefs: [
  { type: 'URS', id: 'URS-PH-001', description: 'User Requirement Specification' },
  { type: 'FS',  id: 'FS-PH-010',  description: 'Functional Specification' },
  { type: 'DS',  id: 'DS-PH-010',  description: 'Design Specification' },
  { type: 'TC',  id: 'TC-PH-010-001', description: 'Test Case reference' },
]
```

The `selfTest()` method on every plugin generates IQ/OQ/PQ-ready test evidence.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Language | TypeScript 5 (strict mode) |
| Backend | Node.js 20 + Express 4 |
| Monorepo | pnpm workspaces |
| Validation | Zod |
| Frontend | Vue.js 3 + Pinia |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| API Docs | Swagger UI / OpenAPI 3.0 |
| Testing | Vitest |
| Containers | Docker Compose |

---

## CI

| Workflow | Ort (Monorepo) | Zweck |
|---|---|---|
| Planning Platform CI | `.github/workflows/planning-platform-ci.yml` | Lint, package tests, `tsc -b --force` |
| Simulation Tests | `.github/workflows/planning-platform-simulation.yml` | Constraint-/Adapter-Vitest-Suite |

Standalone-Templates: `open-planning-platform/.github/workflows/`.  
Migrationslog: [MIGRATION.md](MIGRATION.md)

---

## Roadmap

> Detailed roadmap: [docs/community/roadmap.md](docs/community/roadmap.md) · Changelog: [docs/community/changelog.md](docs/community/changelog.md)  
> **Stand:** 2026-06-22 · Spur B (PostgreSQL + ERP adapters + HAE bridge) largely complete.

### MVP ✓ completed

- [x] Canonical data model
- [x] Constraint plugin interface
- [x] ATP, Resource Capacity, RMSL constraints
- [x] GMP Batch Release, Hold Time constraints (Pharma Pack)
- [x] Chain of Identity, Vein-to-Vein constraints (CGT Pack)
- [x] Mock adapter with realistic pharma + CGT data
- [x] SAP S/4HANA adapter v0.2 (fixture demo + OData live mode)
- [x] REST API with Swagger (`/api/pcp/v1/*`, port 3100)
- [x] Vue.js scheduling board with swimlane + timeline view
- [x] Constraint Explorer with self-test runner (`POST /constraints/self-test`)
- [x] Docker Compose (Postgres host port **5433**, Redis, backend)

### Phase 2 — in progress (8/9 constraint items done)

- [x] PostgreSQL persistence layer (OPP shadow store: `pcp_*` tables)
- [x] HAE PostgreSQL adapter (`hae.postgres` — read-only `hap_*` bridge)
- [x] ERPNext adapter v0.1 (fixture + Frappe REST API)
- [x] Cleaning validation matrix constraint
- [x] Campaign sequencing constraint
- [x] Country/batch release check (TRIC)
- [x] QA inspection lot status constraint
- [x] Cryogenic storage capacity constraint (CGT)
- [x] Courier/shipment window constraint (CGT)
- [ ] SAP PP/DS adapter (sequence-dependent setup, pegging)

### Phase 3 — planned

- [ ] CP-SAT solver integration in OPP (HAE OR-Tools sidecar on `:8010` exists; OPP bridge pending)
- [ ] AI knowledge layer (pgvector + SOP retrieval)
- [ ] Neo4j knowledge graph for constraint explanations
- [ ] Community contribution templates
- [x] GitHub Actions CI for plugin validation (`planning-platform-ci.yml`, simulation tests, export smoke)

---

## Contributing

See [docs/community/contributing.md](docs/community/contributing.md) for the constraint plugin PR template and required artifacts.

Each community constraint pull request must include:
1. TypeScript implementation of `IConstraintPlugin`
2. `selfTest()` with at least 3 test cases
3. Validation references (URS/FS/DS/TC)
4. `documentationUrl` pointing to explanation
5. Sample data demonstrating pass and fail scenarios

---

## License

Apache-2.0 — Open for commercial and non-commercial use.
