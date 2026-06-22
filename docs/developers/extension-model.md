# Extension Model — What You Can Change

Pharma Collective Platform follows the **Linux-kernel pattern**: a small, stable core and everything industry-specific lives in **plugins**. This page is the contract for contributors and integrators.

## The golden rules

1. **Extend, don't fork** — new behaviour belongs in constraints, packs, adapters, or modules.
2. **Shadow-first** — planning results go to shadow tables; never change existing production write paths without an explicit, reviewed migration.
3. **Downward dependencies only** — lower layers never import from higher layers.
4. **Explainability** — every constraint must answer *why was this order blocked?* in plain language.
5. **Regulatory integrity** — pharma and CGT constraints are reviewed by domain experts; do not weaken safety rules to make tests pass.

## What you **can** change (extension points)

| Extension | Package / area | Typical use | Review |
|---|---|---|---|
| **Constraint plugin** | `packages/planning-*` | One GMP or domain rule | Domain expert + maintainer |
| **Industry pack** | `packages/planning-<industry>` | Bundle of related constraints | Domain expert + maintainer |
| **ERP / MES adapter** | `packages/adapter-*` | Map external data → canonical model | Maintainer |
| **Operational module** | e.g. `planning-shopfloor` | Live telemetry, MQTT boards | Maintainer |
| **API routes & services** | `apps/backend` | New read endpoints, simulation jobs | Maintainer |
| **Cockpit UI** | `cockpit/`, embedded in Portal | New views, dashboards (feature-flagged) | Maintainer |
| **Documentation** | `docs` | Guides, industry pages, release notes | Maintainer |
| **Sample / mock data** | `data/`, seeds | Anonymized demo datasets | Maintainer |
| **HAE engines** | `engines/` (root) | Allocation, sequencing optimizers | Maintainer + regression care |

These are the **intended** customization surfaces — same model as mature OSS products (plugins, connectors, docs, community PRs).

## What you **should not** change (without RFC)

| Area | Why | Instead |
|---|---|---|
| **`planning-core` canonical types** | Breaks every pack and adapter | Extend via tags, metadata, or new constraint context fields after RFC |
| **Constraint engine interface** | Breaks all plugins | Propose RFC; needs 2 core maintainers |
| **Severity of shipped GMP constraints** | Validation / audit impact | Domain expert review + migration note |
| **Direct writes to ERP/MES production** | Regression and GxP risk | Shadow tables + export adapters |
| **Vendor field names in kernel** | Locks the core to one ERP | Map in adapter layer |
| **Business logic inside adapters** | Adapters are mapping only | Move rules to constraints |
| **Circular package dependencies** | CI blocks merges | Refactor to lower layer |

## Kernel changes (`planning-core`) — when and how

Kernel changes are **rare and deliberate**. Before opening a PR:

1. **Open a GitHub Discussion** (RFC) describing the type change, consumers affected, and migration.
2. **Prove no plugin-only solution** — show why a constraint, tag, or adapter cannot solve it.
3. **Get approval from 2 core maintainers** before merge ([Governance](/community/governance)).
4. **Ship migration notes** in changelog + release notes if behaviour changes.

**Belongs in the kernel:** `Order`, `Operation`, `Resource`, `Batch`, `SimulationRun`, `AuditEntry` — generic manufacturing concepts.

**Does not belong:** `SAP_AUFNR`, batch release QA codes, allergen families, patient COI identifiers — those live in packs, tags, or adapters.

## Dependency hierarchy

```
planning-core
    ↓
planning-constraints
    ↓
planning-pharma · planning-cgt · planning-<yours>
    ↓
planning-adapters
    ↓
apps/backend → apps/frontend → Portal / Cockpit
```

> No package may import from a layer above it.

## Comparison to proprietary APS

| Proprietary APS | PCP open model |
|---|---|
| Consultant implements rule in customer fork | Constraint plugin in shared pack |
| ERP-specific fields in core tables | Adapter maps to canonical model |
| Upgrade breaks customizations | Semver + changelog + extension points |
| Black-box solver | Explainable `ConstraintResult` + audit trail |

## Next steps

- [Build addons & modules](/developers/build-addons) — hands-on paths
- [Contribute](/developers/contribute) — PR flow and checklist
- [Architecture](/guide/architecture) — package reference
- [Data model](/guide/data-model) — canonical types
