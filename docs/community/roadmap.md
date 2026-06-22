# Roadmap

**Last updated:** 2026-06-22

## Phase 1 — Foundation ✓ completed

**Goal:** Stable core, first industry pack, first working end-to-end slice.

- [x] Canonical data model (`Order`, `Operation`, `Resource`, `Calendar`, `Batch`, `Inventory`)
- [x] Constraint plugin interface (`IConstraintPlugin`, `ConstraintEngine`, `ConstraintRegistry`)
- [x] Generic constraints: ATP, resource capacity, remaining shelf life
- [x] Pharma industry pack: batch release, hold time
- [x] CGT industry pack: chain of identity, vein-to-vein deadline
- [x] Mock adapter (`mock.pharma`) with pharma + CGT demo scenarios
- [x] REST API with Swagger (`/api/pcp/v1/*`)
- [x] Vue.js scheduling board (Gantt / constraint violations)
- [x] Constraint self-test runner (`POST /api/pcp/v1/constraints/self-test`)
- [x] Docker Compose local development setup
- [x] GitHub Actions CI (HAE monorepo workflows + standalone templates)
- [x] Published workspace packages (`@PCP/planning-core`, `planning-constraints`, `planning-pharma`, `planning-cgt`, `planning-adapters`, …)
- [x] Shopfloor transparency module (`@PCP/planning-shopfloor`) — MQTT ingest, live line board

## Phase 2 — Adapters & Ecosystem (in progress)

**Goal:** Connect real ERP systems and persist planning state. Grow the community.

### Done

- [x] PostgreSQL persistence layer (OPP shadow store: `pcp_orders`, `pcp_resources`, `pcp_simulation_runs`, …)
- [x] Local dev tooling: `db:migrate`, `db:seed`, `verify:persistence`, auto-load `apps/backend/.env`
- [x] HAE PostgreSQL adapter (`hae.postgres` — read-only bridge to `hap_*` tables)
- [x] SAP S/4HANA adapter v0.2 (`sap.s4hana` — fixture + OData production orders, work centers, materials, batches, stock)
- [x] ERPNext adapter v0.1 (`erpnext` — fixture + Frappe REST API)
- [x] Per-order constraint scoring in simulation results (severity-weighted `score` + `metadata.summary`)
- [x] End-to-end verified: HAE Postgres → OPP shadow DB → constraint simulation

### Next

- [ ] SAP PP/DS adapter (sequence-dependent setup matrices, pegging)
- [ ] Cleaning validation matrix constraint (Pharma)
- [ ] Campaign sequencing constraint (Pharma)
- [ ] Country/batch release check — TRIC (Pharma)
- [ ] QA inspection lot status constraint (Pharma)
- [ ] Cryogenic storage capacity constraint (CGT)
- [ ] Courier/shipment window constraint (CGT)
- [ ] Generic MES adapter interface ([Shopfloor MQTT module](/modules/shopfloor))
- [ ] Multi-objective optimization (beyond constraint scoring)
- [ ] AI knowledge layer ("Why was this order blocked?" — natural language)
- [ ] Community constraint registry

## Phase 3 — Validation & GxP

**Goal:** Make the platform usable in GxP-validated environments.

- [ ] Validation framework (IQ/OQ/PQ readiness packs)
- [ ] Electronic signature support (21 CFR Part 11)
- [ ] Version-locked simulation runs (constraint version pinning)
- [ ] Validation report generation
- [ ] Deviation-triggered auto-hold

## Phase 4 — Intelligence

**Goal:** Move from explainable to predictive.

- [ ] CP-SAT solver integration in OPP kernel (Google OR-Tools — HAE sidecar on `:8010` exists today)
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
