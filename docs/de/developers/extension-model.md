# Erweiterungsmodell — Was du ändern kannst

Die Pharma Collective Platform folgt dem **Linux-Kernel-Muster**: ein kleiner, stabiler Core — alles Branchenspezifische in **Plugins**. Diese Seite ist der Vertrag für Contributors und Integratoren.

## Die Grundregeln

1. **Erweitern, nicht forken** — neues Verhalten gehört in Constraints, Packs, Adapter oder Module.
2. **Shadow-first** — Planungsergebnisse in Shadow-Tabellen; bestehende Produktiv-Schreibpfade nicht ohne explizite, geprüfte Migration ändern.
3. **Abhängigkeiten nur nach unten** — untere Schichten importieren nie von höheren.
4. **Erklärbarkeit** — jeder Constraint beantwortet *warum wurde dieser Auftrag blockiert?* in verständlicher Sprache.
5. **Regulatorische Integrität** — Pharma- und CGT-Constraints werden von Domain-Experten geprüft; Sicherheitsregeln nicht abschwächen, um Tests grün zu bekommen.

## Was du **kannst** ändern (Erweiterungspunkte)

| Erweiterung | Package / Bereich | Typischer Einsatz | Review |
|---|---|---|---|
| **Constraint-Plugin** | `packages/planning-*` | Eine GMP- oder Domänenregel | Domain-Experte + Maintainer |
| **Industry Pack** | `packages/planning-<industry>` | Bündel verwandter Constraints | Domain-Experte + Maintainer |
| **ERP / MES Adapter** | `packages/adapter-*` | Externe Daten → kanonisches Modell | Maintainer |
| **Operatives Modul** | z. B. `planning-shopfloor` | Live-Telemetrie, MQTT-Boards | Maintainer |
| **API-Routen & Services** | `apps/backend` | Neue Read-Endpoints, Simulations-Jobs | Maintainer |
| **Cockpit-UI** | `cockpit/`, Portal-Embed | Neue Views, Dashboards (Feature-Flag) | Maintainer |
| **Dokumentation** | `docs` | Guides, Industry-Seiten, Release Notes | Maintainer |
| **Sample / Mock-Daten** | `data/`, Seeds | Anonymisierte Demo-Daten | Maintainer |
| **HAE Engines** | `engines/` (Root) | Allokation, Sequenzierungs-Optimierer | Maintainer + Regressionsschutz |

Das sind die **vorgesehenen** Anpassungsflächen — vergleichbar mit etablierten OSS-Produkten (Plugins, Connectors, Docs, Community-PRs).

## Was du **nicht** ändern solltest (ohne RFC)

| Bereich | Warum | Stattdessen |
|---|---|---|
| **Kanonische Typen in `planning-core`** | Bricht alle Packs und Adapter | Tags, Metadaten oder RFC für neue Kontextfelder |
| **Constraint-Engine-Schnittstelle** | Bricht alle Plugins | RFC; 2 Core-Maintainer |
| **Severity ausgelieferter GMP-Constraints** | Validierungs-/Audit-Risiko | Domain-Review + Migrationshinweis |
| **Direkte Schreibzugriffe auf ERP/MES-Produktiv** | Regression und GxP-Risiko | Shadow-Tabellen + Export-Adapter |
| **Vendor-Feldnamen im Kernel** | Bindet Core an ein ERP | Mapping im Adapter |
| **Business-Logik im Adapter** | Adapter sind nur Mapping | Regeln in Constraints |
| **Zirkuläre Package-Abhängigkeiten** | CI blockiert | Refactoring in untere Schicht |

## Kernel-Änderungen (`planning-core`)

Kernel-Änderungen sind **selten und bewusst**. Vor dem PR:

1. **GitHub Discussion (RFC)** — Typänderung, betroffene Consumer, Migration.
2. **Keine Plugin-Lösung möglich nachweisen** — warum Constraint, Tag oder Adapter nicht reicht.
3. **Freigabe durch 2 Core-Maintainer** ([Governance](/de/community/governance)).
4. **Migrationshinweise** in Changelog und Release Notes bei Verhaltensänderung.

**Gehört in den Kernel:** `Order`, `Operation`, `Resource`, `Batch`, `SimulationRun`, `AuditEntry` — generische Fertigungskonzepte.

**Gehört nicht hinein:** `SAP_AUFNR`, Batch-Release-QA-Codes, Allergen-Familien, Patient-COI-IDs — das lebt in Packs, Tags oder Adaptern.

## Abhängigkeitshierarchie

```
planning-core
    ↓
planning-constraints
    ↓
planning-pharma · planning-cgt · planning-<deins>
    ↓
planning-adapters
    ↓
apps/backend → apps/frontend → Portal / Cockpit
```

> Kein Package importiert von einer höheren Schicht.

## Vergleich zu proprietären APS

| Proprietäres APS | PCP Open Model |
|---|---|
| Berater implementiert Regel im Kundenfork | Constraint-Plugin im gemeinsamen Pack |
| ERP-Felder in Core-Tabellen | Adapter mappt auf kanonisches Modell |
| Upgrade bricht Anpassungen | Semver + Changelog + Erweiterungspunkte |
| Black-Box-Solver | Erklärbares `ConstraintResult` + Audit Trail |

## Weiter

- [Addons & Module bauen](/de/developers/build-addons)
- [Beitragen](/de/developers/contribute)
- [Architektur](/de/guide/architecture)
- [Datenmodell](/de/guide/data-model)
