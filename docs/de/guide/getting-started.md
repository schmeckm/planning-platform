# Erste Schritte

Diese Anleitung führt durch die lokale Installation der Pharma Collective Platform in ca. 15 Minuten.

## Voraussetzungen

| Werkzeug | Mindestversion | Zweck |
|---|---|---|
| Node.js | 20.x | Backend & Tooling |
| pnpm | 9.x | Monorepo-Paketmanager |
| Docker & Docker Compose | 24.x | PostgreSQL + Redis |
| Python | 3.11+ | CP-SAT-Solver-Worker (optional) |

## Installation

### 1. Repository klonen

```bash
git clone https://github.com/schmeckm/planningplatform.git
cd open-planning-platform
```

### 2. Abhängigkeiten installieren

```bash
pnpm install
```

Installiert alle Pakete des Monorepo-Workspaces gleichzeitig.

### 3. Infrastruktur starten

```bash
docker compose up -d
```

Startet:
- **PostgreSQL** auf Port `5432` — transaktionale Planungsdaten
- **Redis** auf Port `6379` — Job-Queue und Live-Planungs-Cache

### 4. Datenbank initialisieren

```bash
pnpm --filter @PCP/backend db:migrate
pnpm --filter @PCP/backend db:seed
```

Der Seed-Befehl lädt Pharma-Beispieldaten: Aufträge, Ressourcen, Chargen und Kalender.

### 5. API starten

```bash
pnpm --filter @PCP/backend dev
```

Die API läuft auf `http://localhost:3000`. Die Swagger-Oberfläche ist unter `http://localhost:3000/api-docs` erreichbar.

### 6. Frontend starten (optional)

```bash
pnpm --filter @PCP/frontend dev
```

Das Planungsboard läuft auf `http://localhost:5173`.

### 7. Shopfloor-Linien-Transparenz (optional)

Mit dem vollständigen **Hard Allocation Engine (HAE)**-Stack neben OPP steht Live-Einblick in Verpackungslinien über MQTT bereit — dieselben Views wie im legacy Portal:

| View | Route | Zweck |
|------|-------|--------|
| Shopfloor Addon Board | `/planning/shopfloor-board` | Live OEE, Adherence, WIP, Störungen |
| MQTT-Admin | `/planning/admin` → Tab **Shopfloor MQTT** | Broker, Topic-Bindings, Simulation |

**Voraussetzungen:**

1. HAE Allocation API auf Port **8000** (MQTT-Ingest startet mit dem Server)
2. OPP API auf Port **3100** (Proxy für `/api/v1/shopfloor/*` → HAE)
3. Umgebungsvariablen am HAE-Backend:

```bash
MQTT_ENABLED=true
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_NAMESPACE=hap/pharma
```

**Shopfloor-Modul prüfen:**

```bash
curl http://localhost:3100/api/pcp/v1/shopfloor/module
curl http://localhost:3100/api/pcp/v1/shopfloor/board
```

Vollständige Dokumentation: [Shopfloor-Transparenz-Modul](/de/modules/shopfloor).

## Installation prüfen

Erste Constraint-Auswertung starten:

```bash
curl -X POST http://localhost:3000/api/v1/simulations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Erster Simulationslauf",
    "orders": ["ORD-001", "ORD-002", "ORD-003"],
    "constraints": ["atp-check", "resource-capacity", "hold-time"]
  }'
```

Die Antwort enthält Constraint-Auswertungen:

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
        { "id": "resource-capacity", "severity": "WARNING",
          "message": "R-04 zu 94% ausgelastet" }
      ]
    }
  ]
}
```

## Projektstruktur

```
planningplatform/
├── open-planning-platform/
│   ├── packages/
│   │   ├── planning-core/        # Kanonisches Datenmodell & Domain-Typen
│   │   ├── planning-constraints/ # Plugin-Interface & Constraint-Engine
│   │   ├── planning-pharma/      # Pharma-Industrie-Pack
│   │   ├── planning-cgt/         # Cell & Gene Therapy Pack
│   │   ├── planning-adapters/    # ERP/MES-Adapter-Interfaces
│   │   └── planning-shopfloor/   # Live-Linien-Transparenz (MQTT + Board)
│   ├── apps/
│   │   ├── api/                  # Express REST API
│   │   ├── web/                  # Vue.js Planungsboard
│   │   └── docs/                 # Diese Dokumentationsseite
│   └── docs/                     # Architektur- & Design-Dokumente
├── portal/                       # Platform-Portal (Landing, Auth)
└── cockpit/                      # Planungs-Cockpit UI
```

## Nächste Schritte

- [Architektur verstehen](/de/guide/architecture) — wie die Pakete zusammenhängen
- [Ersten Constraint schreiben](/de/constraints/writing) — eigene Planungsregel hinzufügen
- [Industrie-Packs durchsuchen](/de/industries/pharma) — vorgefertigte Pharma-Constraints nutzen
- [System anbinden](/de/adapters/overview) — ERP/MES-Daten ins kanonische Modell mappen
- [Shopfloor-Linien-Transparenz](/de/modules/shopfloor) — Live-MQTT-Ingest, Linien-Board und Admin-UI

## Fehlerbehebung

**`pnpm install` schlägt unter Windows fehl**

pnpm global installieren:
```bash
npm install -g pnpm
```

**Docker-Container starten nicht**

Prüfen, ob die Ports 5432 und 6379 bereits belegt sind:
```bash
docker compose ps
docker compose logs postgres
```

**Seed-Daten werden nicht geladen**

Migration zuerst ausführen:
```bash
pnpm --filter @PCP/backend db:migrate
pnpm --filter @PCP/backend db:seed
```
