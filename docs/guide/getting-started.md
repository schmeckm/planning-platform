# Getting Started

This guide walks you through setting up Pharma Collective Platform locally in about 15 minutes.

## Prerequisites

| Tool | Minimum Version | Purpose |
|---|---|---|
| Node.js | 20.x | Backend & tooling |
| pnpm | 9.x | Monorepo package manager |
| Docker & Docker Compose | 24.x | PostgreSQL + Redis |
| Python | 3.11+ | CP-SAT solver worker (optional, HAE stack) |

## Installation

### 1. Clone the repository

**Standalone OPP** (kernel only):

```bash
git clone https://github.com/schmeckm/planning-platform.git
cd planning-platform
```

**Embedded in HAE monorepo** (full plant stack):

```bash
git clone --recurse-submodules https://github.com/schmeckm/planningplatform.git
cd planningplatform/open-planning-platform
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure environment

```bash
cp apps/backend/.env.example apps/backend/.env
```

Key variables in `apps/backend/.env`:

| Variable | Purpose |
|---|---|
| `PCP_DATABASE_URL` | OPP shadow database (`pcp_*` tables) — default `127.0.0.1:5433` |
| `ALLOCATION_DATABASE_URL` | HAE read adapter (`hae.postgres`) — optional, e.g. `127.0.0.1:5432/hap` |

Scripts (`db:migrate`, `db:seed`, `dev`) auto-load this file.

### 4. Start Infrastructure

```bash
docker compose up -d postgres redis
```

This starts:

- **PostgreSQL** on host port **5433** (container 5432) — avoids conflict with HAE Postgres on 5432
- **Redis** on port **6379**

> On Windows, use `127.0.0.1` in database URLs instead of `localhost` (IPv6 routing).

### 5. Initialize the Database

```bash
pnpm --filter @PCP/backend db:migrate
pnpm --filter @PCP/backend db:seed
# optional verification:
pnpm --filter @PCP/backend verify:persistence
```

The seed command loads mock pharma data into the **OPP shadow database**.

To load from the HAE plant database instead (requires `ALLOCATION_DATABASE_URL`):

```bash
pnpm --filter @PCP/backend db:seed -- --adapter=hae.postgres
```

### 6. Start the API

```bash
pnpm --filter @PCP/backend dev
```

- API: `http://127.0.0.1:3100/api/pcp/v1/health`
- Swagger: `http://127.0.0.1:3100/docs`

Registered adapters (typical): `mock.pharma`, `sap.s4hana`, `erpnext`, and `hae.postgres` when `ALLOCATION_DATABASE_URL` is set.

### 7. Start the Frontend (optional)

```bash
pnpm --filter @PCP/frontend dev
```

Scheduling board: `http://localhost:5173` (requires HAE monorepo paths or `vendor/` sync for embedded mode).

### 8. Shopfloor line transparency (optional)

When running the full **Hard Allocation Engine (HAE)** stack alongside OPP:

| View | Route | Purpose |
|------|-------|---------|
| Shopfloor Addon Board | `/planning/shopfloor-board` | Live OEE, adherence, WIP, disturbances |
| MQTT admin | `/planning/admin` → tab **Shopfloor MQTT** | Broker config, topic bindings, simulation |

**Requirements:**

1. HAE allocation API on port **8000** (`/health`)
2. OPP API on port **3100** (proxies shopfloor routes to HAE)
3. Optional MQTT env on HAE: `MQTT_ENABLED`, `MQTT_BROKER_URL`, `MQTT_NAMESPACE`

```bash
curl http://127.0.0.1:3100/api/pcp/v1/shopfloor/module
```

Full documentation: [Shopfloor Transparency Module](/modules/shopfloor).

## Verify the Installation

```bash
# Health
curl http://127.0.0.1:3100/api/pcp/v1/health

# Load demo data
curl -X POST http://127.0.0.1:3100/api/pcp/v1/simulations/load-adapter \
  -H "Content-Type: application/json" \
  -d '{ "adapterId": "mock.pharma" }'

# Run constraint evaluation (7 plugins)
curl -X POST http://127.0.0.1:3100/api/pcp/v1/simulations \
  -H "Content-Type: application/json" \
  -d '{ "name": "First simulation", "triggeredBy": "planner" }'

# Constraint self-tests
curl -X POST http://127.0.0.1:3100/api/pcp/v1/constraints/self-test
```

Expected demo outcomes (mock.pharma): `ORD-PH-001` FEASIBLE, `ORD-PH-002` INFEASIBLE (QA_HOLD), capacity blockers on other orders.

### HAE integration (monorepo)

With HAE Postgres running and `ALLOCATION_DATABASE_URL` in `.env`:

```bash
curl -X POST http://127.0.0.1:3100/api/pcp/v1/simulations/load-adapter \
  -H "Content-Type: application/json" \
  -d '{ "adapterId": "hae.postgres" }'
```

→ [HAE PostgreSQL Adapter](/adapters/hae-postgres)

## Project Structure

```
planning-platform/                 # Standalone OPP repo
├── packages/
│   ├── planning-core/             # Canonical data model
│   ├── planning-constraints/      # Plugin framework
│   ├── planning-pharma/           # Pharma pack
│   ├── planning-cgt/              # CGT pack
│   ├── planning-adapters/         # ERP/MES adapters
│   └── planning-shopfloor/      # MQTT line transparency
├── apps/
│   ├── backend/                   # Express REST API (:3100)
│   └── frontend/                  # Vue scheduling board (:5173)
├── docs/                          # VitePress site
└── docker/postgres/init.sql
```

In the HAE monorepo, the same tree lives under `open-planning-platform/` as a Git submodule.

## Next Steps

- [Roadmap](/community/roadmap) — MVP complete, Phase 2 in progress
- [Architecture](/guide/architecture) — package relationships
- [Write your first Constraint](/constraints/writing)
- [SAP S/4HANA Adapter](/adapters/sap-s4) · [ERPNext](/adapters/erpnext) · [HAE Postgres](/adapters/hae-postgres)
- [Shopfloor module](/modules/shopfloor)

## Troubleshooting

**Port 5432 already in use**

OPP Docker Postgres maps to host port **5433**. Use `PCP_DATABASE_URL=...@127.0.0.1:5433/opp`.

**`db:migrate` fails with missing `PCP_DATABASE_URL`**

Copy `apps/backend/.env.example` → `apps/backend/.env`, or export the variable in your shell.

**`hae.postgres` missing from `/health`**

Set `ALLOCATION_DATABASE_URL` in `.env` and restart the backend (`pnpm --filter @PCP/backend dev`).

**Stale shell environment variables**

Remove overrides: `Remove-Item Env:PCP_DATABASE_URL, Env:JWT_SECRET -ErrorAction SilentlyContinue`

**Docker containers don't start**

```bash
docker compose ps
docker compose logs postgres
```

**Seed data not loading**

Run migration before seed:

```bash
pnpm --filter @PCP/backend db:migrate
pnpm --filter @PCP/backend db:seed
```
