# Getting Started

This guide walks you through setting up Pharma Collective Platform locally in about 15 minutes.

## Prerequisites

| Tool | Minimum Version | Purpose |
|---|---|---|
| Node.js | 20.x | Backend & tooling |
| pnpm | 9.x | Monorepo package manager |
| Docker & Docker Compose | 24.x | PostgreSQL + Redis |
| Python | 3.11+ | CP-SAT solver worker (optional) |

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/schmeckm/planningplatform.git
cd open-planning-platform
```

### 2. Install Dependencies

```bash
pnpm install
```

This installs all packages in the monorepo workspace simultaneously.

### 3. Start Infrastructure

```bash
docker compose up -d
```

This starts:
- **PostgreSQL** on port `5432` — transactional planning data
- **Redis** on port `6379` — job queue and live planning cache

### 4. Initialize the Database

```bash
pnpm --filter @PCP/backend db:migrate
pnpm --filter @PCP/backend db:seed
```

The seed command loads sample pharma mock data: orders, resources, batches, and calendars.

### 5. Start the API

```bash
pnpm --filter @PCP/backend dev
```

API runs at `http://localhost:3000`. Swagger UI is available at `http://localhost:3000/api-docs`.

### 6. Start the Frontend (optional)

```bash
pnpm --filter @PCP/frontend dev
```

Scheduling board runs at `http://localhost:5173`.

### 7. Shopfloor line transparency (optional)

When running the full **Hard Allocation Engine (HAE)** stack alongside OPP, you get live packaging-line visibility via MQTT — the same views as the legacy portal:

| View | Route | Purpose |
|------|-------|---------|
| Shopfloor Addon Board | `/planning/shopfloor-board` | Live OEE, adherence, WIP, disturbances |
| MQTT admin | `/planning/admin` → tab **Shopfloor MQTT** | Broker config, topic bindings, simulation |

**Requirements:**

1. HAE allocation API on port **8000** (MQTT ingest starts with the server)
2. OPP API on port **3100** (proxies `/api/v1/shopfloor/*` to HAE)
3. Environment variables on the HAE backend:

```bash
MQTT_ENABLED=true
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_NAMESPACE=hap/pharma
```

**Verify the shopfloor module:**

```bash
curl http://localhost:3100/api/pcp/v1/shopfloor/module
curl http://localhost:3100/api/pcp/v1/shopfloor/board
```

Full documentation: [Shopfloor Transparency Module](/modules/shopfloor).

## Verify the Installation

Run your first constraint evaluation:

```bash
curl -X POST http://localhost:3000/api/v1/simulations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "First simulation",
    "orders": ["ORD-001", "ORD-002", "ORD-003"],
    "constraints": ["atp-check", "resource-capacity", "hold-time"]
  }'
```

You should receive a simulation result with constraint evaluations:

```json
{
  "simulationId": "sim-abc123",
  "status": "COMPLETED",
  "results": [
    {
      "orderId": "ORD-001",
      "feasible": true,
      "constraints": [
        { "id": "atp-check", "severity": "OK" },
        { "id": "resource-capacity", "severity": "WARNING", "message": "R-04 at 94% utilization" }
      ]
    }
  ]
}
```

## Project Structure

```
planningplatform/
├── open-planning-platform/
│   ├── packages/
│   │   ├── planning-core/        # Canonical data model & domain types
│   │   ├── planning-constraints/ # Plugin interface & constraint engine
│   │   ├── planning-pharma/      # Pharma industry pack
│   │   ├── planning-cgt/         # Cell & Gene Therapy pack
│   │   ├── planning-adapters/    # ERP/MES adapter interfaces
│   │   └── planning-shopfloor/   # Live line transparency (MQTT ingest + board)
│   ├── apps/
│   │   ├── api/                  # Express REST API
│   │   ├── web/                  # Vue.js scheduling board
│   │   └── docs/                 # This documentation site
│   └── docs/                     # Architecture & design docs
├── portal/                       # Platform portal (landing, auth)
└── cockpit/                      # Planning cockpit UI
```

## Next Steps

- [Understand the Architecture](/guide/architecture) — how the packages relate to each other
- [Write your first Constraint](/constraints/writing) — add a custom planning rule
- [Browse Industry Packs](/industries/pharma) — use pre-built pharma constraints
- [Connect an ERP](/adapters/overview) — map ERP or MES data into the canonical model
- [Shopfloor line transparency](/modules/shopfloor) — live MQTT ingest, line board, and admin UI

## Troubleshooting

**`pnpm install` fails on Windows**

Make sure you have `pnpm` installed globally:
```bash
npm install -g pnpm
```

**Docker containers don't start**

Check that ports 5432 and 6379 are not already in use:
```bash
docker compose ps
docker compose logs postgres
```

**Seed data not loading**

Run the migration first before seeding:
```bash
pnpm --filter @PCP/backend db:migrate
pnpm --filter @PCP/backend db:seed
```
