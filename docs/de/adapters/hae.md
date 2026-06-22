# Hard Allocation Engine Adapter

Der `HardAllocationEngineAdapter` verbindet die bestehende Hard Allocation Engine (HAE) PostgreSQL-Datenbank direkt mit der OPP Constraint-Engine — kein HTTP-Roundtrip, kein Authentifizierungsaufwand.

Dieser Adapter ist der Integrationspunkt zwischen **Ebene 1** (das produktive HAE-System) und **Ebene 2** (das OPP-Framework).

## Architektur

```
OPP Constraint-Engine
        ↓
PlanningService (apps/backend)
        ↓
HardAllocationEngineAdapter     ← liest aus HAE PostgreSQL
        ↓
hap_packaging_orders            ← normalisierte HAE-Tabellen
hap_packaging_lines
hap_materials
hap_batches
hap_line_qualifications
hap_shift_calendars
```

Der Adapter ist **read-only**. Er schreibt nie in HAE-Tabellen.

## Feldmapping

### Aufträge (`hap_packaging_orders` → `PlanningOrder`)

| HAE-Feld | OPP-Feld | Hinweis |
|---|---|---|
| `packaging_order_id` | `id` | Branded `OrderId` |
| `sap_order_number` | `externalId` | Optional |
| `material_number` | `materialId` | Branded `MaterialId` |
| `quantity` | `quantity` | Als Zahl geparst |
| `priority` | `priority` | 1=CRITICAL, 2=HIGH, 3=NORMAL, 4+=LOW |
| `lifecycle_stage` | `status` | PLANNED→DRAFT, RELEASED→RELEASED, etc. |
| `planned_start_date` | `earliestStart` | |
| `requested_delivery_date` | `latestFinish` | Fallback: `planned_end_date` |
| `planned_duration_hours × 60` | `durationMinutes` | |
| `production_line` | `operations[0].resourceId` | Erzeugt eine RUN-Operation |

### Ressourcen (`hap_packaging_lines` → `PlanningResource`)

| HAE-Feld | OPP-Feld |
|---|---|
| `line_id` | `id` |
| `line_name` | `name` |
| `default_oee` | `oee` |
| `hap_line_qualifications.package_type` | `qualifiedMaterials` |

### Chargen (`hap_batches` → `PlanningBatch`)

| HAE-Feld | OPP-Feld |
|---|---|
| `batch_id` | `id` |
| `material_number` | `materialId` |
| `status` | `status` (RELEASED, QA\_HOLD, etc.) |
| `expiry_date` | `expiryDate` |

## Verwendung

### OPP API mit HAE-Datenbank starten

```bash
ALLOCATION_DATABASE_URL=postgresql://hap:hap-local-dev@127.0.0.1:5432/hap \
node open-planning-platform/apps/backend/dist/index.js
```

Der Adapter wird automatisch registriert, wenn `ALLOCATION_DATABASE_URL` gesetzt ist.

### HAE-Daten laden und Simulation starten

```bash
# Aufträge, Ressourcen, Materialien, Chargen aus HAE in OPP laden
curl -X POST http://localhost:3100/api/v1/simulations/load-adapter \
  -H "Content-Type: application/json" \
  -d '{"adapterId": "hae.postgres"}'

# Constraint-Simulation auf geladenen Daten ausführen
curl -X POST http://localhost:3100/api/v1/simulations \
  -H "Content-Type: application/json" \
  -d '{"name": "HAE Live Simulation", "triggeredBy": "planer"}'
```

## Start-Script Integration

```powershell
# Portal + OPP API mit HAE-Adapter
.\scripts\start.ps1 portal -WithDocs
```

Das Start-Script setzt `ALLOCATION_DATABASE_URL` automatisch aus der `.env`-Datei.
