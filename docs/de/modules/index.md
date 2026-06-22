# Operative Module

Operative Module erweitern OPP um **Live-Fertigungstransparenz** — getrennt von:

- **Industrie-Packs** — fachliche Constraints (Pharma, CGT, …)
- **Adaptern** — ERP/MES-Stammdaten ins kanonische Modell

Operative Module lesen Telemetrie, aggregieren KPIs und stellen UI-Oberflächen für Planer bereit. Sie nutzen **Shadow-Storage** und schreiben nie in ERP-Produktionstabellen.

## Verfügbare Module

| Modul | Package | UI | API |
|-------|---------|-----|-----|
| [Shopfloor-Transparenz](/de/modules/shopfloor) | `@PCP/planning-shopfloor` | `/planning/shopfloor-board`, MQTT-Admin | `/api/pcp/v1/shopfloor/*` |

## Wann welche Schicht?

```
ERP-Stammdaten     →  IPlanningAdapter     →  Simulationen & Constraints
Live-MQTT-KPIs     →  IShopfloorProvider   →  Planungstransparenz (Board)
```

Siehe [Architektur — planning-shopfloor](/guide/architecture#planning-shopfloor) für das Abhängigkeitsdiagramm.
