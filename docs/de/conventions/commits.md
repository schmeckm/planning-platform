# Commit-Nachrichten

Die Open Planning Platform verwendet [Conventional Commits](https://www.conventionalcommits.org/).

## Format

```
<typ>(<scope>): <beschreibung>

[optionaler Körper]

[optionaler Footer]
```

## Typen

| Typ | Wann verwenden |
|---|---|
| `feat` | Neuer Constraint, Adapter, Industrie-Pack oder Feature |
| `fix` | Bugfix |
| `docs` | Nur Dokumentation |
| `refactor` | Code-Umstrukturierung, kein Verhaltensänderung |
| `test` | Tests hinzufügen oder aktualisieren |
| `chore` | Tooling, Abhängigkeiten, CI-Konfiguration |
| `perf` | Performance-Verbesserung |

## Scopes

Den Paket- oder Bereichsnamen verwenden:

```
planning-core, planning-constraints, planning-pharma, planning-cgt,
planning-adapters, api, web, docs, ci
```

## Beispiele

```
feat(planning-pharma): add PharmaHoldTimeConstraint (URS-PH-002)

Implements the hold time check for intermediate materials.
Returns BLOCKER when the gap between predecessor end and proposed
start exceeds the validated minimum hold time (minLagMinutes).

Refs: #142
```

```
fix(planning-constraints): ConstraintEngine handles empty predecessor list correctly
```

```
docs(docs): add German translation for constraints section
```

```
chore(ci): enforce selfTest() coverage threshold for constraint packages
```

## Warum Conventional Commits?

- **Automatisches Changelog** — Release-Notes werden aus der Commit-Historie generiert
- **Klarer Scope** — Reviewer sehen sofort, welches Paket betroffen ist
- **Breaking-Change-Erkennung** — `BREAKING CHANGE:` im Footer löst Major-Version-Bump aus
