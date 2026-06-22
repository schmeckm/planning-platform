# PR & Review-Prozess

Alle Beiträge zur Open Planning Platform durchlaufen einen Pull-Request-Prozess. Er stellt sicher, dass jeder Constraint, jeder Adapter und jedes Industrie-Pack die Qualitäts- und Dokumentationsstandards erfüllt.

## PR-Typen

| Typ | Scope | Erforderliche Reviewer |
|---|---|---|
| `feat` | Neuer Constraint / Adapter / Industrie-Pack | 1 Domain-Experte + 1 Core-Maintainer |
| `fix` | Bugfix in bestehendem Constraint | 1 Core-Maintainer |
| `docs` | Nur Dokumentation | 1 Core-Maintainer |
| `refactor` | Interne Umstrukturierung, kein Verhaltensänderung | 1 Core-Maintainer |
| `chore` | Tooling, Abhängigkeiten, CI | 1 Core-Maintainer |

## PR-Template (Pflicht)

```markdown
## Zusammenfassung

<!-- Ein Absatz: Was fügt dieser PR hinzu oder behebt er? -->

## Typ
- [ ] Neuer Constraint
- [ ] Neues Industrie-Pack
- [ ] Neuer Adapter
- [ ] Bugfix
- [ ] Dokumentation
- [ ] Refactoring

## Constraint-Details (für neue Constraints)

**Constraint-ID:** `pharma.operation.hold-time`
**Schweregrad:** BLOCKER / WARNING / RECOMMENDATION
**Geschäftszweck:** <!-- Warum gibt es diese Regel? Welches Problem löst sie? -->
**Regulatorische Referenz:** <!-- ICH Q7 §8.3, GMP Annex 15, 21 CFR Part 211 usw. -->
**Anforderungs-ID:** <!-- URS-PH-042 -->

## Checkliste

### Code
- [ ] TypeScript Strict Mode — kein `any`
- [ ] Alle öffentlichen Funktionen haben JSDoc
- [ ] `selfTest()` implementiert mit ≥ 3 Testfällen
- [ ] `evaluate()` wirft unter keinen Umständen eine Exception

### Tests
- [ ] Alle selfTests bestehen (`pnpm test`)
- [ ] Testfall-Namen sind lesbar und stabil (GxP-Dokumente)

### Dokumentation
- [ ] Eintrag in `/de/constraints/builtin.md` (oder Industrie-Pack-Seite)
- [ ] Geschäftszweck im Code-Kommentar dokumentiert
- [ ] Regulatorische Referenz angegeben (falls zutreffend)
- [ ] Validierungsreferenzen in `metadata.validationRefs`

### GxP-Validierung (für Pharma / CGT)
- [ ] Anforderungs-ID (URS/FS/DS) zugewiesen
- [ ] Testfall-Namen entsprechen Akzeptanzkriterien
- [ ] IQ/OQ/PQ-Bereitschaft berücksichtigt
```

## Review-Checkliste für Reviewer

Bei einem neuen Constraint prüfen:

1. **Interface-Konformität** — implementiert `IConstraintPlugin` korrekt?
2. **Schweregrad-Angemessenheit** — ist BLOCKER gerechtfertigt, oder sollte es WARNING sein?
3. **Erklärbarkeit** — gibt `explanation` dem Planer umsetzbare Information?
4. **Test-Qualität** — sind die Testfälle aussagekräftig, nicht nur Token-Tests?
5. **selfTest() vollständig** — 3 Testfälle, alle bestehend?
6. **Kein Core-Missbrauch** — verwendet der Constraint nur `ConstraintContext`, keine internen APIs?
7. **Dokumentation** — ist der Geschäftszweck für jemanden aus einem anderen Unternehmen verständlich?

## Versionierung

Constraint-Versionen folgen **Semantic Versioning**:

- `PATCH` (1.0.0 → 1.0.1) — Bugfix, Verhalten in bestandenen Fällen unverändert
- `MINOR` (1.0.0 → 1.1.0) — Neues Verhalten hinzugefügt, keine Breaking Changes
- `MAJOR` (1.0.0 → 2.0.0) — Constraint blockiert jetzt Fälle, die er vorher passierte (Breaking)

**Niemals einen Constraint in einem PATCH-Release restriktiver machen.**
