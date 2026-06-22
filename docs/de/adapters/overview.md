# Adapter-Übersicht

Adapter verbinden externe Systeme (ERP, MES, WMS, LIMS) mit dem kanonischen Datenmodell der Pharma Collective Platform. **Der Planungskern ruft externe Systeme nie direkt auf.**

## Operative Module vs. Adapter

| Schicht | Zweck | Beispiel |
|---------|--------|----------|
| **Adapter** | Stammdaten für Simulationen | SAP-Aufträge, Arbeitsplätze |
| **Operatives Modul** | Live-Betriebsdaten | [Shopfloor MQTT](/de/modules/shopfloor) — OEE, WIP, Störungen |

Live-Telemetrie über MQTT ist im [Shopfloor-Transparenz-Modul](/de/modules/shopfloor) dokumentiert — nicht im generischen MES-Adapter.

## Verfügbare Adapter

| Adapter | Package | Status |
|---------|---------|--------|
| CSV / Excel | `@PCP/adapter-csv` | ✅ Verfügbar |
| MES (Live MQTT) | `@PCP/planning-shopfloor` | ✅ Referenzimplementierung — siehe [Shopfloor-Modul](/de/modules/shopfloor) |
| SAP S/4HANA | `@PCP/adapter-sap-s4` | 🚧 In Entwicklung |
| Production Sequencing | `@PCP/planning-adapters` (`production.sequencing`) | ✅ v0.1 |
| MES (generisch, Stammdaten) | `@PCP/adapter-mes` | 📋 Geplant |

Vollständige englische Übersicht: [Adapters Overview](/adapters/overview)

## Eigenen Adapter bauen

Siehe [Adapter bauen](/de/adapters/custom).
