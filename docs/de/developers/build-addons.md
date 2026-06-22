# Addons & Module bauen

So erweiterst du PCP — dieselben Erweiterungstypen, die Open-Source-Plattformen für Integratoren und Partner dokumentieren.

## Welchen Typ brauchst du?

| Ziel | Baue | Guide |
|---|---|---|
| Eine Planungsregel hinzufügen | **Constraint-Plugin** | [Constraint schreiben](/de/constraints/writing) |
| Regelpaket für eine Branche | **Industry Pack** | [Eigenes Pack](/de/industries/custom) |
| SAP, MES, LIMS, CSV anbinden | **Adapter** | [Adapter bauen](/de/adapters/custom) |
| Live-Shopfloor-Sicht | **Operatives Modul** | [Shopfloor-Modul](/de/modules/shopfloor) |
| Bugfix oder Doku | **PR ins Hauptrepo** | [Beitragen](/de/developers/contribute) |

**Faustregel:** eine neue Regel → Constraint; drei oder mehr zusammenhängende Regeln für eine neue Branche → Industry Pack.

---

## 1 — Constraint-Plugin (kleinstes Addon)

Constraints implementieren `PlanningConstraint`: Aufträge/Ressourcen bewerten, Severity zurückgeben, `explain()` für Planer.

```typescript
export class HoldTimeConstraint implements PlanningConstraint {
  readonly id = 'pharma.hold-time'
  readonly version = '1.0.0'
  readonly severity = 'BLOCKING' as const

  async evaluate(ctx: ConstraintContext): Promise<ConstraintResult> { /* … */ }
  explain(result: ConstraintResult): string { /* verständlich */ }
  readonly testCases = [ /* ≥3 Fälle */ ]
}
```

**Checkliste:**

- [ ] Im Pack-`index.ts` registriert
- [ ] Tests in `*.test.ts` (≥80 % Coverage bei neuen Dateien)
- [ ] Doku in `docs/industries/` oder Constraints-Abschnitt
- [ ] `explain()` für Planer lesbar, nicht nur für Entwickler

→ [Plugin-Interface](/de/constraints/interface) · [Schweregrade](/de/constraints/scoring) · [Tests](/de/constraints/testing)

---

## 2 — Industry Pack (Addon-Bündel)

Ein npm-Package `@PCP/planning-<industry>` mit Constraints und dokumentierten Domain-Tags.

```bash
mkdir packages/planning-<industry>
```

Struktur:

```
packages/planning-<industry>/
├── src/constraints/
├── src/index.ts
├── TAGS.md
├── package.json
└── README.md
```

**Für den Merge:**

- Constraints + Tests
- `docs/industries/<industry>.md`
- Tag-Namespace dokumentiert
- PR-Label `industry-pack` + Domain-Reviewer

→ [Eigenes Pack](/de/industries/custom) · [Pharma-Referenz](/de/industries/pharma)

---

## 3 — Adapter (Integrations-Addon)

`PlanningDataAdapter` implementieren — Daten holen und ins **kanonische Modell** mappen. Keine Business-Regeln im Adapter.

```typescript
export class MyErpAdapter implements PlanningDataAdapter {
  readonly systemId: string
  readonly systemType = 'MY_ERP'

  async fetchOrders(filter: OrderFilter): Promise<Order[]> { /* Mapping */ }
  // Ressourcen, Kalender, Bestand …
}
```

**Checkliste:**

- [ ] Mapping-Tabelle Quelle → kanonisch in der Doku
- [ ] Dokumentierte Limitierungen (nicht abbildbare Felder)
- [ ] Integrationstests mit Mock oder anonymisiertem Fixture
- [ ] Kein direkter ERP-Aufruf aus `planning-core`

→ [Adapter-Übersicht](/de/adapters/overview) · [Adapter bauen](/de/adapters/custom)

---

## 4 — Operatives Modul (z. B. Shopfloor)

Runtime-Fähigkeiten jenseits von Stammdaten-Adaptern — z. B. MQTT-Shopfloor-Boards.

- Package unter `packages/planning-<module>`
- API unter `apps/backend`
- Cockpit-View unter `cockpit/src/views/` (Feature-Flag)
- Nur Shadow-Ingest — keine ungeprüften MES-Schreibzugriffe

→ [Shopfloor-Transparenz](/de/modules/shopfloor) · [Module-Übersicht](/de/modules/)

---

## 5 — UI-Erweiterung (Cockpit / Portal)

Typischer Ablauf:

1. Route in `cockpit/src/router/`
2. Feature-Catalog / Nav (berechtigungsgesteuert)
3. OPP-API (`/api/pcp/v1`) oder HAE-API (`/api/v1`) — Auth nicht umgehen
4. [Icon-Konventionen](/de/conventions/icons) (Lucide, kein Emoji in der Produkt-UI)

Größere UI-Beiträge vorab mit Maintainers abstimmen (GitHub Discussion).

---

## Lokale Entwicklung

```bash
cd open-planning-platform
pnpm install
pnpm validate:hae
pnpm --filter @PCP/backend dev
pnpm dev:docs
# Repo-Root:
npm run build:backend && ./scripts/start.ps1 portal
```

Vor dem PR: `pnpm test` · `pnpm lint` · `pnpm typecheck`

→ [Erste Schritte](/de/guide/getting-started) · [IT-Guide](https://github.com/schmeckm/planningplatform/blob/main/docs/IT.md)

---

## Addon veröffentlichen

| Privat (Fork) | Upstream (empfohlen) |
|---|---|
| Schnell für eine Site | Community-Wartung, Review, Sichtbarkeit |
| Merge-Kosten bei Upgrades selbst tragen | Semver + Changelog für Breaking Changes |
| Gut für experimentelle PoCs | Pflicht für validierte, geteilte GMP-Regeln |

Upstream: [Conventional Commits](/de/conventions/commits) und [PR-Prozess](/de/conventions/pr-process).
