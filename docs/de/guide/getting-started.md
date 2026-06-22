# Erste Schritte

Diese Anleitung führt durch die lokale Installation der Pharma Collective Platform in ca. 15 Minuten.

## Voraussetzungen

| Werkzeug | Mindestversion | Zweck |
|---|---|---|
| Node.js | 20.x | Backend & Tooling |
| pnpm | 9.x | Monorepo-Paketmanager |
| Docker & Docker Compose | 24.x | PostgreSQL + Redis |
| Python | 3.11+ | CP-SAT-Solver (optional, HAE-Stack) |

## Installation

### 1. Repository klonen

**Standalone OPP** (nur Kernel):

```bash
git clone https://github.com/schmeckm/planning-platform.git
cd planning-platform
```

**Im HAE-Monorepo** (voller Werks-Stack):

```bash
git clone --recurse-submodules https://github.com/schmeckm/planningplatform.git
cd planningplatform/open-planning-platform
```

### 2. Abhängigkeiten installieren

```bash
pnpm install
```

### 3. Umgebung konfigurieren

```bash
cp apps/backend/.env.example apps/backend/.env
```

Wichtige Variablen in `apps/backend/.env`:

| Variable | Zweck |
|---|---|
| `PCP_DATABASE_URL` | OPP-Shadow-DB (`pcp_*`) — Standard `127.0.0.1:5433` |
| `ALLOCATION_DATABASE_URL` | HAE-Read-Adapter (`hae.postgres`) — optional, z. B. `127.0.0.1:5432/hap` |

Skripte (`db:migrate`, `db:seed`, `dev`) laden diese Datei automatisch.

### 4. Infrastruktur starten

```bash
docker compose up -d postgres redis
```

Startet:

- **PostgreSQL** auf Host-Port **5433** (Container 5432) — kein Konflikt mit HAE-Postgres auf 5432
- **Redis** auf Port **6379**

> Unter Windows `127.0.0.1` statt `localhost` in DB-URLs verwenden (IPv6-Routing).

### 5. Datenbank initialisieren

```bash
pnpm --filter @PCP/backend db:migrate
pnpm --filter @PCP/backend db:seed
# optional:
pnpm --filter @PCP/backend verify:persistence
```

Der Seed-Befehl lädt Mock-Pharma-Daten in die **OPP-Shadow-Datenbank**.

Aus der HAE-Werksdatenbank laden (benötigt `ALLOCATION_DATABASE_URL`):

```bash
pnpm --filter @PCP/backend db:seed -- --adapter=hae.postgres
```

### 6. API starten

```bash
pnpm --filter @PCP/backend dev
```

- API: `http://127.0.0.1:3100/api/pcp/v1/health`
- Swagger: `http://127.0.0.1:3100/docs`

Typische Adapter: `mock.pharma`, `sap.s4hana`, `erpnext`, plus `hae.postgres` wenn `ALLOCATION_DATABASE_URL` gesetzt ist.

### 7. Frontend starten (optional)

```bash
pnpm --filter @PCP/frontend dev
```

Planungsboard: `http://localhost:5173` (HAE-Monorepo-Pfade oder `vendor/`-Sync für Embedded-Modus).

### 8. Shopfloor-Linien-Transparenz (optional)

Mit dem vollständigen **Hard Allocation Engine (HAE)**-Stack neben OPP:

| View | Route | Zweck |
|------|-------|--------|
| Shopfloor Addon Board | `/planning/shopfloor-board` | Live OEE, Adherence, WIP, Störungen |
| MQTT-Admin | `/planning/admin` → Tab **Shopfloor MQTT** | Broker, Topic-Bindings, Simulation |

**Voraussetzungen:**

1. HAE Allocation API auf Port **8000** (`/health`)
2. OPP API auf Port **3100** (Shopfloor-Proxy → HAE)
3. Optional MQTT-Env am HAE-Backend

```bash
curl http://127.0.0.1:3100/api/pcp/v1/shopfloor/module
```

Dokumentation: [Shopfloor-Transparenz-Modul](/de/modules/shopfloor).

## Installation prüfen

```bash
curl http://127.0.0.1:3100/api/pcp/v1/health

curl -X POST http://127.0.0.1:3100/api/pcp/v1/simulations/load-adapter \
  -H "Content-Type: application/json" \
  -d '{ "adapterId": "mock.pharma" }'

curl -X POST http://127.0.0.1:3100/api/pcp/v1/simulations \
  -H "Content-Type: application/json" \
  -d '{ "name": "Erste Simulation", "triggeredBy": "planner" }'

curl -X POST http://127.0.0.1:3100/api/pcp/v1/constraints/self-test
```

Erwartete Demo-Ergebnisse (mock.pharma): `ORD-PH-001` FEASIBLE, `ORD-PH-002` INFEASIBLE (QA_HOLD).

### HAE-Integration (Monorepo)

Mit laufendem HAE-Postgres und `ALLOCATION_DATABASE_URL` in `.env`:

```bash
curl -X POST http://127.0.0.1:3100/api/pcp/v1/simulations/load-adapter \
  -H "Content-Type: application/json" \
  -d '{ "adapterId": "hae.postgres" }'
```

→ [HAE PostgreSQL Adapter](/de/adapters/hae-postgres)

## Projektstruktur

```
planning-platform/                 # Standalone OPP-Repo
├── packages/                      # Kernel, Constraints, Adapter
├── apps/backend/                  # REST API (:3100)
├── apps/frontend/                 # Vue-Planungsboard (:5173)
└── docs/                          # VitePress
```

Im HAE-Monorepo liegt der gleiche Baum unter `open-planning-platform/` als Git-Submodule.

## Nächste Schritte

- [Roadmap](/de/community/roadmap)
- [Architektur](/de/guide/architecture)
- [SAP S/4HANA Adapter](/de/adapters/sap-s4) · [ERPNext](/de/adapters/erpnext) · [HAE Postgres](/de/adapters/hae-postgres)

## Fehlerbehebung

**Port 5432 bereits belegt**

OPP-Docker-Postgres nutzt Host-Port **5433**. `PCP_DATABASE_URL=...@127.0.0.1:5433/opp`.

**`db:migrate`: `PCP_DATABASE_URL` fehlt**

`apps/backend/.env.example` → `.env` kopieren.

**`hae.postgres` fehlt in `/health`**

`ALLOCATION_DATABASE_URL` in `.env` setzen und Backend neu starten.

**Veraltete Shell-Variablen**

```powershell
Remove-Item Env:PCP_DATABASE_URL, Env:JWT_SECRET -ErrorAction SilentlyContinue
```

**Docker startet nicht**

```bash
docker compose ps
docker compose logs postgres
```
