# Shopfloor-Transparenz-Modul

Das **Shopfloor-Modul** (`@PCP/planning-shopfloor`) gibt der Planung Live-Einblick in Verpackungslinien — dieselbe operative Transparenz wie im legacy HAE-Portal, integriert in die Open Planning Platform.

Es ist ein **operatives Modul**, kein Planungsdaten-Adapter:

| Thema | Package / Schicht |
|-------|-------------------|
| Live-MQTT-Ingest, Topic-Bindings, Shadow-Message-Store | `@PCP/planning-shopfloor` + HAE-Backend |
| Linien-Board (OEE, Adherence, WIP, Störungen) | Cockpit-Embed unter `/planning/shopfloor-board` |
| MQTT-Admin (Broker, Bindings, Simulation) | Cockpit-Embed unter `/planning/admin` → Tab **Shopfloor MQTT** |
| ERP-Stammdaten für Simulationen | `@PCP/planning-adapters` |

## Features (Parität zum legacy Portal)

### 1. Shopfloor Addon Board

**Route:** `/planning/shopfloor-board`  
**Feature-ID:** `shopfloor-addon-board`  
**Sektion:** Reporting

Live-Dashboard pro Verpackungslinie:

- Linienstatus (RUNNING, SETUP, TEARDOWN, IDLE, DOWN)
- Aktiver WIP-Auftrag mit Phase und Plan-vs-Ist
- OEE und Termintreue (MQTT oder abgeleiteter Fallback)
- Mengenfortschritt und Ausschuss
- Geplante und ungeplante Störungen
- Auto-Refresh alle 3 Sekunden
- MQTT-Broker-Verbindungsstatus

### 2. MQTT-Administration

**Route:** `/planning/admin` → Tab **Shopfloor MQTT**  
**Feature-ID:** `admin-system` (Governance — für Portal-Admins immer aktiv)

Vollständige Konfiguration und Simulation:

- Broker-URL, Namespace, QoS, Zugangsdaten
- Topic-Muster und Event-Typen
- Ressourcen-Bindings (Verpackungslinien, Arbeitsplätze)
- Subscribe / Unsubscribe pro Binding
- WIP-Auftragssimulation (Einmal und Live-Stream)
- Optional Publish an echten Broker + Shadow-Inject

## Architektur

```
MQTT Broker
     │
     ▼
HAE mqttIngestService  ──►  shopfloorMqttMessages (Shadow)
     │
     ▼
shopfloorBoardService  ◄──  productionLines, packagingOrders, lineCalendars
     │
     ▼
GET /api/v1/shopfloor/board
     │
     ├── Legacy-Proxy  /api/v1/shopfloor/*  (Cockpit-UI heute)
     └── PCP API       /api/pcp/v1/shopfloor/*  (OPP-Framework-Oberfläche)
     │
     ▼
ShopfloorAddonBoardView  (/planning/shopfloor-board)
```

**Shadow-Planning-Regel:** MQTT-Ingest und Simulation schreiben nur in den Message-Shadow-Store. Planungs-Stammdaten sind read-only.

## API-Oberflächen

### PCP API (empfohlen für neue Integrationen)

Basispfad: `/api/pcp/v1/shopfloor`

| Endpoint | Beschreibung |
|----------|--------------|
| `GET /module` | Modul-Metadaten und Feature-Liste |
| `GET /health` | Health des HAE-Shopfloor-Bridges |
| `GET /board` | Aggregiertes Linien-Board |
| `GET/PUT /mqtt/config` | Broker-Konfiguration |
| `GET /mqtt/resources` | Bindbare Ressourcen |
| `POST /mqtt/topics/preview` | Topic-Vorschau |
| `GET/POST/PUT/DELETE /mqtt/bindings` | Topic-Bindings |
| `GET /mqtt/status` | Verbindungsstatus |
| `POST /mqtt/reconnect` | Reconnect erzwingen |
| `GET /mqtt/messages` | Shadow-Message-Log |
| `GET /mqtt/simulation/*` | WIP-Simulations-Endpunkte |

### Legacy HAE API (vom eingebetteten Cockpit genutzt)

Basispfad: `/api/v1/shopfloor` — über OPP API an das HAE-Backend (Port 8000) weitergeleitet.

## Modul aktivieren

1. HAE-Backend (Port 8000) mit MQTT-Ingest starten:

```bash
MQTT_ENABLED=true
MQTT_BROKER_URL=mqtt://localhost:1883
```

2. OPP-Stack starten:

```bash
cd open-planning-platform
pnpm install
pnpm dev:backend   # Port 3100
pnpm dev:frontend   # Port 5173
```

3. Feature `shopfloor-addon-board` für Benutzer aktivieren (Standard: für alle Rollen an).

4. **Reporting → Shopfloor Addon Board** öffnen oder `/planning/shopfloor-board` aufrufen.

## Package-Struktur

```
packages/planning-shopfloor/
  src/
    types/shopfloor.types.ts       # Kanonische Board- + MQTT-Typen
    schemas/shopfloor.schemas.ts   # Zod-Validierung für API-Payloads
    interfaces/shopfloor-provider.interface.ts
    index.ts
```

Die OPP API implementiert `HaeShopfloorProvider` — eine Bridge zu den bestehenden HAE-Services. Die Backend-Logik bleibt vorerst in HAE; das Package definiert den Framework-Vertrag.

## Bezug zum MES-Adapter

Der generische [MES-Adapter](/de/adapters/mes) ist für ERP-artige Stammdaten geplant. Das Shopfloor-Modul deckt **Live-Betriebsdaten** (MQTT) ab. Beides ergänzt sich:

- **MES-Adapter** → kanonische Ressourcen und Aufträge für Simulationen
- **Shopfloor-Modul** → Live-Linienstatus für Planungstransparenz

Geplant: Live-OEE aus Shopfloor-Shadow-Daten in den Constraint-Kontext von Simulationen einspeisen.

## UI-Komponenten (Cockpit)

| Komponente | Pfad |
|-----------|------|
| `ShopfloorAddonBoardView.vue` | Haupt-Board |
| `ShopfloorLineCard.vue` | Linien-Karte |
| `ShopfloorMqttPanel.vue` | MQTT-Admin-Tab |

Diese werden von OPP web über `apps/frontend/src/cockpit/routes.js` eingebettet — keine doppelte UI in OPP.
