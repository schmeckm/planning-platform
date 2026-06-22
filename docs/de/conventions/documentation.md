# Dokumentationsanforderungen

Jeder Constraint, Adapter und jedes Industrie-Pack muss dokumentiert werden. Planungswissen, das nicht dokumentiert ist, ist nicht wirklich geteilt.

## Was dokumentiert werden muss

### Für jeden Constraint

1. **Geschäftszweck** — welches Fertigungsproblem löst diese Regel?
2. **Regulatorische Referenz** — welche Richtlinie oder Norm erfordert dies? (falls zutreffend)
3. **Anforderungs-ID** — Rückverfolgbarkeit zu einem URS/FS/DS-Dokument
4. **Schweregrad-Begründung** — warum BLOCKER und nicht WARNING?
5. **Tag-Dokumentation** — welche `order.tags` oder `resource.tags` liest dieser Constraint?
6. **Beispielverletzung** — wie sehen `message` und `correctionHint` im echten Fall aus?

### Für jeden Adapter

1. **System-Beschreibung** — welches ERP/MES/LIMS wird angebunden?
2. **Feldmapping** — welche Quellfelder werden auf welche kanonischen Modellfelder gemappt?
3. **Authentifizierung** — wie wird die Verbindung konfiguriert?
4. **Einschränkungen** — welche Daten sind nicht verfügbar oder nicht gemappt?

### Für jedes Industrie-Pack

1. **Industrie-Überblick** — was macht Planung in dieser Industrie einzigartig?
2. **Liste der enthaltenen Constraints** mit Links
3. **Beispieldaten** — ein realistischer Mock-Datensatz zum Testen
4. **Erste Schritte** — wie aktiviert man das Pack in einer Simulation?

## Dokumentationsort

| Was | Wo |
|---|---|
| Constraint-Referenz | `/de/constraints/builtin.md` |
| Neues Industrie-Pack | `/de/industries/<industrie>.md` |
| Neuer Adapter | `/de/adapters/<system>.md` |
| Code-Level-Dokumentation | JSDoc in der `.ts`-Quelldatei |

## Schreibstil

- Für ein **Publikum aus einem anderen Unternehmen** schreiben — keinen gemeinsamen Kontext voraussetzen
- **Konkrete Beispiele** verwenden — eine echte Auftragsnummer, eine echte Fehlermeldung
- Kurze, direkte Sätze
- Tabellen für Vergleiche, Listen für Schritte
- Code-Dokumentation immer auf **Englisch**
- Diese Dokumentationsseite ist zweisprachig (EN/DE)
