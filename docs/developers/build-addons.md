# Build Addons & Modules

This guide explains **how** to extend PCP — the same extension types most open-source platforms document for integrators and partner developers.

## Choose your extension type

| You want to… | Build this | Guide |
|---|---|---|
| Add one planning rule | **Constraint plugin** | [Writing a constraint](/constraints/writing) |
| Add a bundle of rules for an industry | **Industry pack** | [Build your own pack](/industries/custom) |
| Connect SAP, MES, LIMS, CSV | **Adapter** | [Build an adapter](/adapters/custom) |
| Add live shop-floor visibility | **Operational module** | [Shopfloor module](/modules/shopfloor) |
| Fix a bug or improve docs | **PR to main repo** | [Contribute](/developers/contribute) |

**Rule of thumb:** one new rule → constraint; three or more related rules for a new vertical → industry pack.

---

## 1 — Constraint plugin (smallest addon)

Constraints implement `PlanningConstraint`: evaluate orders/resources, return severity, and `explain()` for planners.

```typescript
// packages/planning-pharma/src/constraints/hold-time.constraint.ts (pattern)
export class HoldTimeConstraint implements PlanningConstraint {
  readonly id = 'pharma.hold-time'
  readonly version = '1.0.0'
  readonly severity = 'BLOCKING' as const

  async evaluate(ctx: ConstraintContext): Promise<ConstraintResult> { /* … */ }
  explain(result: ConstraintResult): string { /* human-readable */ }
  readonly testCases = [ /* ≥3 cases */ ]
}
```

**Checklist:**

- [ ] Registered in pack `index.ts`
- [ ] Tests in `*.test.ts` (≥80% coverage on new files)
- [ ] Docs in `docs/industries/` or constraints section
- [ ] `explain()` readable by a planner, not only developers

→ [Plugin interface](/constraints/interface) · [Scoring & severity](/constraints/scoring) · [Testing](/constraints/testing)

---

## 2 — Industry pack (addon bundle)

An industry pack is an npm package `@PCP/planning-<industry>` that groups constraints and documents domain tags.

```bash
mkdir packages/planning-<industry>
```

Structure:

```
packages/planning-<industry>/
├── src/
│   ├── constraints/
│   └── index.ts          # exports all constraints
├── TAGS.md               # documents order/resource tags
├── package.json
└── README.md
```

**Deliverables for merge:**

- Constraints + tests
- `docs/industries/<industry>.md`
- Tag namespace documented (`pharma.*`, `food.*`, …)
- PR label `industry-pack` + domain reviewer

→ [Build your own pack](/industries/custom) · [Pharma reference](/industries/pharma)

---

## 3 — Adapter (integration addon)

Adapters implement `PlanningDataAdapter` — fetch and **map** external data into canonical types. No business rules in the adapter.

```typescript
export class MyErpAdapter implements PlanningDataAdapter {
  readonly systemId: string
  readonly systemType = 'MY_ERP'

  async fetchOrders(filter: OrderFilter): Promise<Order[]> { /* map fields */ }
  async fetchResources(filter: ResourceFilter): Promise<Resource[]> { /* … */ }
  // calendars, inventory, batches …
}
```

**Checklist:**

- [ ] Field mapping table in docs (source → canonical)
- [ ] Documented limitations (fields that cannot map)
- [ ] Integration tests with mock or anonymized fixture
- [ ] No direct calls from `planning-core` to your ERP client

→ [Adapters overview](/adapters/overview) · [Build an adapter](/adapters/custom)

---

## 4 — Operational module (e.g. shopfloor)

Operational modules add **runtime** capabilities beyond master-data adapters — e.g. MQTT shopfloor boards.

Pattern:

- Package under `packages/planning-<module>`
- API routes under `apps/backend`
- Cockpit view under `cockpit/src/views/` (feature-flagged)
- Shadow ingest only — no unreviewed writes to MES

→ [Shopfloor transparency](/modules/shopfloor) · [Modules overview](/modules/)

---

## 5 — UI extension (Cockpit / Portal)

The Portal embeds the Cockpit for planning views. New screens typically:

1. Add a route in `cockpit/src/router/`
2. Register in feature catalog / nav (permission-gated)
3. Call OPP API (`/api/pcp/v1`) or HAE API (`/api/v1`) — never bypass auth
4. Match [icon conventions](/conventions/icons) (Lucide, no emoji in product UI)

Large UI contributions should align with maintainers early (GitHub Discussion).

---

## Local development loop

```bash
cd open-planning-platform
pnpm install
pnpm validate:hae
pnpm --filter @PCP/backend dev          # :3100
pnpm dev:docs                           # :5200
# From repo root:
npm run build:backend && ./scripts/start.ps1 portal  # Portal + HAE
```

Run before PR: `pnpm test` · `pnpm lint` · `pnpm typecheck`

→ [Getting started](/guide/getting-started) · [IT guide (clone, CI)](https://github.com/schmeckm/planningplatform/blob/main/docs/IT.md)

---

## Publishing your addon

| Stay private (fork) | Contribute upstream (recommended) |
|---|---|
| Fast for one site | Community maintenance, reviews, visibility |
| You carry merge cost on upgrades | Semver + changelog covers breaking changes |
| Good for experimental PoC | Required for GMP-validated shared rules |

Upstream contributions use [Conventional Commits](/conventions/commits) and [PR process](/conventions/pr-process).
