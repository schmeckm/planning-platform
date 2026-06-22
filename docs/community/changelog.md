# Changelog

All notable changes are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/).

For readable release stories, see [Release Notes](/community/release-notes/).

## [0.1.0] — 2026-06-21

### Added

- `planning-core` — canonical data model: `Order`, `Operation`, `Resource`, `Calendar`, `Material`, `Batch`, `InventoryLevel`, `AuditEntry`, `SimulationRun`
- `planning-constraints` — `PlanningConstraint` interface, `ConstraintEngine`, `ConstraintRegistry`, `ConstraintTestCase` runner
- `planning-pharma` — pharma industry pack: `BatchReleaseConstraint`, `HoldTimeConstraint`
- `planning-cgt` — CGT industry pack: `ChainOfIdentityConstraint`, `VeinToVeinDeadlineConstraint`
- `planning-adapters` — `IPlanningAdapter`, `MockPharmaAdapter`
- `apps/backend` — Express REST API: `/api/v1/simulations`, `/api/v1/orders`, `/api/v1/resources`, `/api/v1/constraints`
- `apps/frontend` — Vue.js scheduling board with Gantt view and constraint violation panel
- `docs` — VitePress documentation site (this site)
- Docker Compose setup for local development (PostgreSQL + Redis)
- Monorepo setup with pnpm workspaces and TypeScript project references

## [Unreleased]

### Added

- `load-backend-env.mjs` — auto-loads `apps/backend/.env` for `db:migrate`, `db:seed`, and dev server
- HAE adapter registration fix — `PlanningService` loads `.env` before singleton init (`9b71a3c`)
- Docker Compose Postgres host port **5433** (avoids conflict with HAE Postgres on 5432)
- Documentation refresh: roadmap, getting started, HAE adapter guide
- SAP S/4HANA adapter v0.2 (`sap.s4hana`) — fixture demo mode + OData live mode for orders, work centers, materials, batches, stock
- ERPNext adapter v0.1 (`erpnext`) — fixture demo mode + Frappe REST API for Work Orders, Workstations, Items, Batches, Bin
- HAE PostgreSQL adapter (`hae.postgres`) — read-only bridge to `hap_*` tables
- `pnpm --filter @PCP/planning-adapters verify:sap` — SAP OData connectivity check
- `@PCP/planning-adapters` fixture tests: 36 total (22 mock + 8 SAP + 6 ERPNext)

### Added (prior unreleased)

- `pnpm --filter @PCP/backend db:migrate`, `db:seed`, `verify:persistence` (adapters: `mock.pharma`, `hae.postgres`, `sap.s4hana`, `erpnext`)
- Health endpoint reports `persistence`, registered `adapters`, constraint count
- Integration tests for Postgres repositories (when `PCP_DATABASE_URL` is set)
- `@PCP/planning-shopfloor` — MQTT ingest, shadow message store, board aggregation
- PCP API routes `/api/pcp/v1/shopfloor/*` with HAE proxy bridge

### Changed

- `PCP_DATABASE_URL` and `ALLOCATION_DATABASE_URL` are strictly separated (OPP shadow vs HAE read adapter)
- SAP adapter status upgraded from stub to v0.2 (fixture + OData)
- Getting-started docs: port 3100, `/api/pcp/v1/*`, Postgres port 5433, Windows `127.0.0.1` note
