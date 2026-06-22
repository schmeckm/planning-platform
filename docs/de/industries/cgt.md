# Cell & Gene Therapy Pack

Das `@opp/planning-cgt`-Pack stellt Constraints für **personalisierte Medizin-Herstellung** bereit — wo jede Charge für einen bestimmten Patienten produziert wird und Planungsfehler lebensbedrohlich sein können.

## Was CGT-Planung einzigartig macht

Die Cell & Gene Therapy Herstellung unterscheidet sich fundamental von konventioneller Batch-Fertigung:

- **Patientenspezifische Aufträge** — jede Charge gehört exakt einem Patienten. Materialien verschiedener Patienten dürfen **niemals** vermischt werden.
- **Fixer Termin** — das Infusionsdatum des Patienten wird vom klinischen Team festgelegt. Die gesamte Produktionslinie arbeitet rückwärts von diesem Datum.
- **Vein-to-Vein** — die Uhr startet bei der Apherese-Entnahme und endet bei der Patienteninfusion. Alles dazwischen muss in dieses Fenster passen.
- **Kryogene Lagerung** — gefrorene Zwischenprodukte belegen eine begrenzte Anzahl kryogener Lagerplätze.
- **QC-Freigabezeitraum** — QC-Tests brauchen eine definierte Mindestzeit. Wenn das QC-Fenster den Infusionstermin überlappt, kann das Produkt nicht rechtzeitig freigegeben werden.

## Installation

```bash
pnpm add @opp/planning-cgt
```

## Enthaltene Constraints

| Constraint-ID | Schweregrad | Beschreibung |
|---|---|---|
| `cgt.identity.chain` | BLOCKER | Patientenspezifische Materialien dürfen nie zur gleichen Zeit im gleichen Raum sein |
| `cgt.timeline.vein-to-vein` | BLOCKER | Produktionsfenster darf Patienteninfusionstermin nicht überschreiten |

### Geplant (Phase 2)

| Constraint-ID | Schweregrad | Beschreibung |
|---|---|---|
| `cgt.storage.cryogenic` | BLOCKER | Kryogene Lagerplätze am vorgeschlagenen Datum belegt |
| `cgt.schedule.apheresis` | BLOCKER | Apherese muss allen nachgelagerten Operationen vorausgehen |
| `cgt.timeline.qc-release` | WARNING | QC-Freigabe-Fenster schließt möglicherweise nicht vor Infusionstermin ab |

## Chain of Identity — Funktionsweise

Der `cgt.identity.chain`-Constraint prüft bei jeder Planungsentscheidung:

1. Keine Materialien eines anderen Patienten sind zur gleichen Zeit im gleichen Raum zugewiesen
2. Kein Gerät, das für diesen Patienten verwendet wurde, wird innerhalb des Dekontaminationsfensters für einen anderen Patienten genutzt
3. Der Audit-Trail protokolliert jede Gleichzeitigkeitsprüfung

```
Auftrag CGT-0047 (Patient: PAT-DE-0047) → Raum A-201 → 22.07.2026 08:00–16:00
Auftrag CGT-0051 (Patient: PAT-DE-0051) → Raum A-201 → 22.07.2026 10:00–18:00
                                              ↑
                                 BLOCKIERT: Chain-of-Identity-Verletzung
                                 Materialien zweier Patienten gleichzeitig im selben Raum.
```

## Beispieldaten laden

```bash
pnpm --filter @PCP/backend db:seed --pack cgt
```

## Roadmap

- [ ] Multi-Site-Herstellung (Apherese in einem Land, Herstellung in einem anderen)
- [ ] Klinische Protokoll-Versions-Verfolgung
- [ ] Patienten-Slot-Reservierung über Planungshorizonte
- [ ] Integration mit klinischen Studien-Management-Systemen
