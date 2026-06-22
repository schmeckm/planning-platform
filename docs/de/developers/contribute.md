# Beitragen

PCP ist ein **Planungs-Commons** — wie erfolgreiche OSS-Startups setzen wir auf klare Beitragspfade, Review-Qualität und gemeinsame Verantwortung.

## Wer trägt bei?

| Rolle | Typische Beiträge |
|---|---|
| **Fertigungsplaner** | Constraint-Ideen, Testfälle, Doku, Domain-Review |
| **APS-Entwickler** | Constraints, Engine-Integration, Performance |
| **ERP-/MES-Integrator** | Adapter, Mapping-Doku, Beispiel-Payloads |
| **QA / Validierung** | Requirement-IDs, Audit-Szenarien, Release-Review |
| **Forschung** | Algorithmen, Benchmarks (via Constraints oder HAE) |

Commit-Rechte sind **nicht** Voraussetzung — **Fork + PR** ist der Standardweg.

## Schnellstart (erster PR)

1. [Erweiterungsmodell](/de/developers/extension-model) lesen — wissen, was wohin gehört.
2. Arbeit wählen — GitHub Issues mit Label `good-first-issue`.
3. Branch von `main` — z. B. `feat/pharma-hold-time` oder `docs/adapter-sap-felder`.
4. Mit Tests und Doku entwickeln ([Checkliste](#beitrags-checkliste)).
5. PR mit [Template](https://github.com/schmeckm/planningplatform/blob/main/.github/pull_request_template.md).
6. Review beantworten — Domain-Experten für GMP/CGT, Maintainer für Architektur.

```bash
git clone https://github.com/schmeckm/planningplatform.git
cd planningplatform/open-planning-platform
pnpm install
pnpm test
```

## Beitrags-Checkliste

Vor dem Review-Request:

### Code
- [ ] TypeScript **strict** — kein `any`
- [ ] `pnpm test`, `pnpm lint`, `pnpm typecheck` grün
- [ ] JSDoc für öffentliche APIs

### Constraints & Packs
- [ ] `explain()` planerverständlich
- [ ] ≥3 `testCases` pro neuem Constraint
- [ ] Regulatorischer Bezug oder Business-Zweck dokumentiert
- [ ] Domain-Review für GMP/CGT

### Adapter
- [ ] Mapping-Tabelle Quelle → kanonisch
- [ ] Keine Business-Logik im Adapter

### Dokumentation
- [ ] Nutzersichtbare Änderung in `docs`
- [ ] [Dokumentationsanforderungen](/de/conventions/documentation) erfüllt

### Prozess
- [ ] [Conventional Commits](/de/conventions/commits)
- [ ] PR-Template vollständig
- [ ] Breaking Changes + Migration beschrieben

Details: [Mitwirken](/de/community/contributing) · [PR & Review](/de/conventions/pr-process)

## Review-Erwartungen

| PR-Typ | Reviewer |
|---|---|
| Neuer Constraint / Pack | 1 Domain-Experte + 1 Maintainer |
| Neuer Adapter | 1 Maintainer |
| Kernel / Schnittstelle | 2 Core-Maintainer + RFC |
| Nur Doku | 1 Maintainer |
| Bugfix | 1 Maintainer |

**Lazy Consensus:** Routine-Vorschläge gelten nach 7 Tagen ohne Widerspruch als angenommen ([Governance](/de/community/governance)).

## Releases & dein Beitrag

Gemergte Arbeit erscheint in **Semver-Releases**:

1. [Changelog](/de/community/changelog) — technische Änderungen
2. [Release Notes](/de/community/release-notes/) — Narrative für Nutzer
3. Git-Tag + GitHub Release

Contributors werden bei nutzersichtbaren Features in Release Notes genannt. Maintainer folgen der [Release-Notes-Konvention](/de/conventions/release-notes).

## Community-Werte

- **Offenheit** — Planungswissen ist Commons, kein Consulting-Moat
- **Erklärbarkeit** — Planer und QA müssen Entscheidungen verstehen
- **Regulatorische Integrität** — Sicherheits-Constraints sind nicht verhandelbar
- **Respektvolle Zusammenarbeit** — gute Absicht annehmen, direkt kommunizieren

## Hilfe

| Kanal | Für |
|---|---|
| [GitHub Issues](https://github.com/schmeckm/planningplatform/issues) | Bugs, Feature-Requests |
| [GitHub Discussions](https://github.com/schmeckm/planningplatform/discussions) | RFCs, Architekturfragen |
| [Roadmap](/de/community/roadmap) | Geplante Arbeit, Duplikate vermeiden |

## Verwandt

- [Addons bauen](/de/developers/build-addons)
- [Erweiterungsmodell](/de/developers/extension-model)
- [Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/)
