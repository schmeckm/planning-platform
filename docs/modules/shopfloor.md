# Shopfloor Transparency Module

The **Shopfloor Module** (`@PCP/planning-shopfloor`) gives planners live visibility into packaging lines — the same operational transparency as the legacy HAE portal, integrated into the Open Planning Platform.

It is an **operational module**, not a planning data adapter:

| Concern | Package / layer |
|---------|-------------------|
| Live MQTT ingest, topic bindings, message shadow store | `@PCP/planning-shopfloor` + HAE backend |
| Line board UI (OEE, adherence, WIP, disturbances) | Cockpit embed at `/planning/shopfloor-board` |
| MQTT admin (broker, bindings, simulation) | Cockpit embed at `/planning/admin` → tab **Shopfloor MQTT** |
| ERP master data for simulations | `@PCP/planning-adapters` |

## Features (parity with legacy portal)

### 1. Shopfloor Addon Board

**Route:** `/planning/shopfloor-board`  
**Feature ID:** `shopfloor-addon-board`  
**Section:** Reporting

Live dashboard per packaging line:

- Line state (RUNNING, SETUP, TEARDOWN, IDLE, DOWN)
- Active WIP order with phase and plan-vs-actual
- OEE and schedule adherence (MQTT or derived fallback)
- Quantity progress and scrap
- Planned and unplanned disturbances
- Auto-refresh every 3 seconds
- MQTT broker connection status

### 2. MQTT Administration

**Route:** `/planning/admin` → tab **Shopfloor MQTT**  
**Feature ID:** `admin-system` (governance — always on for portal admins)

Full configuration and simulation:

- Broker URL, namespace, QoS, credentials
- Topic pattern and event types
- Resource bindings (packaging lines, work centers)
- Subscribe / unsubscribe per binding
- WIP order simulation (one-shot and live stream)
- Optional publish to real broker + shadow inject

## Architecture

```
MQTT Broker
     │
     ▼
HAE mqttIngestService  ──►  shopfloorMqttMessages (shadow)
     │
     ▼
shopfloorBoardService  ◄──  productionLines, packagingOrders, lineCalendars
     │
     ▼
GET /api/v1/shopfloor/board
     │
     ├── Legacy proxy  /api/v1/shopfloor/*  (cockpit UI today)
     └── PCP API       /api/pcp/v1/shopfloor/*  (OPP framework surface)
     │
     ▼
ShopfloorAddonBoardView  (/planning/shopfloor-board)
```

**Shadow-planning rule:** MQTT ingest and simulation write only to the message shadow store. Planning master data is read-only.

## API surfaces

### PCP API (recommended for new integrations)

Base path: `/api/pcp/v1/shopfloor`

| Endpoint | Description |
|----------|-------------|
| `GET /module` | Module metadata and feature list |
| `GET /health` | HAE shopfloor bridge health |
| `GET /board` | Aggregated line board |
| `GET/PUT /mqtt/config` | Broker configuration |
| `GET /mqtt/resources` | Bindable resources |
| `POST /mqtt/topics/preview` | Topic preview |
| `GET/POST/PUT/DELETE /mqtt/bindings` | Topic bindings |
| `GET /mqtt/status` | Connection state |
| `POST /mqtt/reconnect` | Force reconnect |
| `GET /mqtt/messages` | Shadow message log |
| `GET /mqtt/simulation/*` | WIP simulation endpoints |

### Legacy HAE API (used by embedded cockpit UI)

Base path: `/api/v1/shopfloor` — proxied through OPP API to the HAE backend on port 8000.

## Enable the module

1. Start HAE backend (port 8000) with MQTT ingest:

```bash
MQTT_ENABLED=true
MQTT_BROKER_URL=mqtt://localhost:1883
```

2. Start OPP stack:

```bash
cd open-planning-platform
pnpm install
pnpm dev:backend   # port 3100
pnpm dev:frontend   # port 5173
```

3. Enable feature `shopfloor-addon-board` for users (default: on for all roles).

4. Open **Reporting → Shopfloor Addon Board** or navigate to `/planning/shopfloor-board`.

## Package structure

```
packages/planning-shopfloor/
  src/
    types/shopfloor.types.ts       # Canonical board + MQTT types
    schemas/shopfloor.schemas.ts   # Zod validation for API payloads
    interfaces/shopfloor-provider.interface.ts
    index.ts
```

The OPP API implements `HaeShopfloorProvider` — a bridge to the existing HAE services. Backend logic remains in HAE for now; the package defines the framework contract.

## Relation to MES adapter

The generic [MES adapter](/adapters/mes) is planned for ERP-style master data. The shopfloor module covers **live operational telemetry** (MQTT). Both complement each other:

- **MES adapter** → canonical resources and orders for simulations
- **Shopfloor module** → live line state for planner transparency

Future work: feed live OEE from shopfloor shadow data into constraint context during simulation runs.

## UI components (cockpit)

| Component | Path |
|-----------|------|
| `ShopfloorAddonBoardView.vue` | Main board |
| `ShopfloorLineCard.vue` | Per-line card |
| `ShopfloorMqttPanel.vue` | Admin MQTT tab |

These are embedded by OPP web via `apps/frontend/src/cockpit/routes.js` — no duplicate UI in OPP.
