# Roadmap

## Phase 1 — Foundation ✓ completed

**Goal:** Stable core, first industry pack, first working end-to-end slice.

- [x] Canonical data model (`Order`, `Operation`, `Resource`, `Calendar`, `Batch`, `Inventory`)
- [x] Constraint plugin interface (`PlanningConstraint`, `ConstraintEngine`)
- [x] Pharma industry pack (batch release, cleaning validation, hold time, RMSL)
- [x] CGT industry pack (chain of identity, vein-to-vein, cryo storage)
- [x] CSV adapter (for development and testing)
- [x] REST API with Swagger
- [x] Vue.js scheduling board (basic Gantt + constraint violations)
- [x] Docker Compose local development setup
- [x] Automated constraint test runner CI integration (`.github/workflows/opp-ci.yml`)
- [x] Published npm packages (`@PCP/planning-core`, `@PCP/planning-constraints`, `@PCP/planning-pharma`, `@PCP/planning-cgt`, `@PCP/planning-adapters`) — builds and type-checks pass
- [x] Shopfloor transparency module (`@PCP/planning-shopfloor`) — MQTT ingest bridge, live line board, admin UI

## Phase 2 — Adapters & Ecosystem

**Goal:** Connect real ERP systems. Grow the community.

- [x] PostgreSQL persistence layer (OPP shadow store: orders, simulations, inventory)
- [x] HAE PostgreSQL adapter (`hae.postgres` — reads `hap_*` tables)
- [x] SAP S/4HANA adapter v0.2 (`sap.s4hana` — fixture + OData production orders, work centers, materials, batches, stock)
- [ ] SAP PP/DS adapter (sequence-dependent setup matrices, pegging)
- [ ] Generic MES adapter interface ([reference: Shopfloor MQTT module](/modules/shopfloor))
- [ ] ERPNext adapter
- [ ] Constraint scoring & multi-objective optimization
- [ ] AI knowledge layer ("Why was this order blocked?" — natural language)
- [ ] Community constraint registry (discover constraints from the community)

## Phase 3 — Validation & GxP

**Goal:** Make the platform usable in GxP-validated environments.

- [ ] Validation framework (IQ/OQ/PQ readiness)
- [ ] Electronic signature support (21 CFR Part 11)
- [ ] Version-locked simulation runs (constraint version pinning)
- [ ] Validation report generation
- [ ] Country/batch release rules (TRIC, EU QP release)
- [ ] Deviation-triggered auto-hold

## Phase 4 — Intelligence

**Goal:** Move from explainable to predictive.

- [ ] CP-SAT solver integration (Google OR-Tools) for constraint optimization
- [ ] OEE-based resource scoring ([live OEE from shopfloor shadow data](/modules/shopfloor))
- [ ] Demand forecast integration
- [ ] Scenario comparison ("What-If" planning)
- [ ] pgvector integration for SOP/URS document retrieval
- [ ] Neo4j knowledge graph for constraint relationships

## What's NOT on the Roadmap

- Full ERP functionality (PCP is a scheduling layer, not an ERP)
- Black-box solvers without explainability
- Closed-source industry packs
- Vendor-specific data models in the core

## Suggesting Roadmap Items

Open a GitHub Discussion tagged `roadmap` with:
- The business problem you're solving
- Which industry and regulatory context
- Whether you'd be willing to contribute the implementation
