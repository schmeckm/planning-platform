# Schweregrade

## Entscheidungshilfe

| Schweregrad | Planungsauswirkung | Typische Anwendungsfälle |
|---|---|---|
| `BLOCKER` | Auftrag **kann nicht** eingeplant werden | GMP-Verstöße, fehlende Freigabe, überschrittene Haltezei |
| `WARNING` | Auftrag wird eingeplant, Planer muss bestätigen | Ressource >90% ausgelastet, Kampagnenbruch |
| `RECOMMENDATION` | Rein informativer Hinweis | Bessere Ressource verfügbar, Bündelungsempfehlung |
| `INFO` | Protokolleintrag ohne Handlungsbedarf | Analysedaten, Optimierungsscores |

## Entscheidungsbaum

```
Ist dies eine harte regulatorische Anforderung (GMP, GxP, Sicherheit)?
  └─ JA → BLOCKER

Ist dies ein hartes Kapazitätslimit (Ressource überlastet, Material fehlt)?
  └─ JA → BLOCKER

Kann der Planer diese Verletzung bewusst überstimmen?
  └─ JA → WARNING

Beeinflusst dies nur die Qualität der Planung, nicht die Machbarkeit?
  └─ JA → RECOMMENDATION
```

## Beispiele nach Schweregrad

### BLOCKER

- Charge nicht QA-freigegeben → kann nicht ausgeliefert werden
- Reinigungsvalidierung abgelaufen (Produktfamilienwechsel)
- Verbleibende Haltbarkeit reicht nicht für die Operationsdauer
- Patient-Infusionstermin überschritten (CGT)
- Keine qualifizierte Ressource verfügbar

### WARNING

- Ressource am vorgeschlagenen Tag zu >90% ausgelastet
- Kampagnenbruch (gleiche Produkt-Batches bevorzugt aufeinanderfolgend)
- Bevorzugter Lieferant nicht verfügbar (alternativer Lieferant freigegeben)
- QC-Freigabezeitraum eng (CGT)

### RECOMMENDATION

- Auftrag mit ORD-4712 bündeln — gleiches Material, benachbarte Termine
- Ressource R-08 ist an diesem Tag frei und gleichwertig qualifiziert
- Frühschicht für Inspektionen bevorzugt (historische Qualitätsdaten)

## Score (0–1)

Zusätzlich zum Schweregrad gibt jeder Constraint einen **Score** zurück:

- `1.0` = perfekt (kein Problem)
- `0.5` = moderate Verletzung / Soft-Warning
- `0.0` = harte Verletzung / BLOCKER

Der Score wird vom `ConstraintEngine` aggregiert und als Optimierungsziel für den CP-SAT-Solver genutzt (Phase 4 Roadmap).
