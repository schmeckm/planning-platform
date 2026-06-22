# Changelog

All notable changes are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/).

For readable release stories, see [Release Notes](/community/release-notes/).

## [0.1.0] — 2026-06-21

### Added

- `planning-core` — canonical data model: `Order`, `Operation`, `Resource`, `Calendar`, `Material`, `Batch`, `InventoryLevel`, `AuditEntry`, `SimulationRun`
- `planning-constraints` — `PlanningConstraint` interface, `ConstraintEngine`, `ConstraintRegistry`, `ConstraintTestCase` runner
- `planning-pharma` — pharma industry pack: `BatchReleaseConstraint`, `CleaningValidationConstraint`, `HoldTimeConstraint`, `RMSLConstraint`, `CampaignSequencingConstraint`, `DeviationCheckConstraint`
- `planning-cgt` — CGT industry pack: `ChainOfIdentityConstraint`, `VeinToVeinConstraint`, `CryogenicStorageConstraint`, `ApheresisWindowConstraint`
- `planning-adapters` — `PlanningDataAdapter` interface, `CsvAdapter`, `ExcelAdapter`
- `apps/backend` — Express REST API: `/api/v1/simulations`, `/api/v1/orders`, `/api/v1/resources`, `/api/v1/constraints`
- `apps/frontend` — Vue.js scheduling board with Gantt view and constraint violation panel
- `docs` — VitePress documentation site (this site)
- Docker Compose setup for local development (PostgreSQL + Redis)
- Monorepo setup with pnpm workspaces and TypeScript project references

## [Unreleased]

### Added

- PostgreSQL persistence for planning entities (`pcp_orders`, `pcp_resources`, `pcp_materials`, `pcp_batches`, `pcp_inventory`, `pcp_simulation_runs`)
- `pnpm --filter @PCP/backend db:migrate` and `db:seed` (supports `--adapter=mock.pharma|hae.postgres`)
- Health endpoint reports `persistence: postgresql | in-memory`
- Integration tests for Postgres repositories (when `PCP_DATABASE_URL` is set)

### Changed

- `PCP_DATABASE_URL` and `ALLOCATION_DATABASE_URL` are strictly separated (OPP shadow vs HAE read adapter)

### Added (prior unreleased)

- `@PCP/planning-shopfloor` — operational module for live line transparency (MQTT ingest, shadow message store, board aggregation)
- PCP API routes `/api/pcp/v1/shopfloor/*` with `HaeShopfloorProvider` bridge to HAE backend
- Documentation: [Shopfloor Transparency Module](/modules/shopfloor) (EN + DE)
- Cockpit embed: Shopfloor Addon Board + MQTT admin tab (parity with legacy HAE portal)
