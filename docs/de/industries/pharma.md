# Pharma-Produktions-Pack

Das `@opp/planning-pharma`-Pack stellt Constraints und Templates für **GMP-konforme Pharmaproduktion** bereit.

## Was Pharma-Planung einzigartig macht

Die pharmazeutische Fertigung unterliegt strengen regulatorischen Anforderungen, die direkt die Einplanung von Produktionsaufträgen beeinflussen:

- **Chargenfreigabe** — kein Auftrag kann weitergehen, bis die QA die Charge freigegeben hat
- **Reinigungsvalidierung** — ein Produktfamilienwechsel erfordert dokumentierte, validierte Reinigung
- **Haltezeiten** — Zwischenprodukte haben maximale Haltezeiten zwischen den Prozessschritten
- **Verbleibende Haltbarkeit** — Eingangsmaterialien müssen ausreichend Haltbarkeit für die gesamte Operation haben
- **Kampagnenplanung** — gleiche Produkt-Chargen werden zusammengefasst, um Reinigungen zu minimieren
- **Rückverfolgbarkeit** — jede Materialbewegung muss lückenlos dokumentiert sein

## Installation

```bash
pnpm add @opp/planning-pharma
```

## Schnellstart

```typescript
import { ConstraintRegistry } from '@opp/planning-constraints'
import {
  PharmaBatchReleaseConstraint,
  PharmaHoldTimeConstraint,
} from '@opp/planning-pharma'

const registry = new ConstraintRegistry()
registry.register(new PharmaBatchReleaseConstraint())
registry.register(new PharmaHoldTimeConstraint())
```

## Enthaltene Constraints

| Constraint-ID | Schweregrad | Regulatorische Referenz |
|---|---|---|
| `pharma.batch.release` | BLOCKER | GMP Annex 16 |
| `pharma.operation.hold-time` | BLOCKER | ICH Q7 §8.3 |

### Geplant (Phase 2)

| Constraint-ID | Schweregrad | Beschreibung |
|---|---|---|
| `pharma.cleaning.validation` | BLOCKER | Reinigungsvalidierung bei Produktfamilienwechsel |
| `pharma.batch.deviation` | WARNING | Offene Abweichung auf der Charge |
| `pharma.campaign.sequencing` | RECOMMENDATION | Gleiche Produkt-Batches bevorzugt aufeinanderfolgend |

## Validierungs-Framework {#validierung}

Das Pharma-Pack integriert ein GxP-Validierungs-Framework:

- Jeder Constraint hat eine `requirementId` (z. B. `URS-PH-002`)
- Constraint-Versionen werden einem Simulationslauf fest zugeordnet
- Der Audit-Trail protokolliert, welche Constraint-Version welchen Auftrag ausgewertet hat
- `selfTest()` liefert IQ/OQ/PQ-fähige Testberichte

```typescript
// Validierungsbericht generieren
const results = await registry.runAllSelfTests()
// → Enthält: Constraint-ID, Version, Testfall-Namen, Pass/Fail, URS/FS-Referenzen
```

## Beispieldaten laden

```bash
pnpm --filter @PCP/backend db:seed --pack pharma
```

Enthält: 20 Produktionsaufträge, 8 Reaktoren mit Kalendern, Reinigungsmatrizen, Chargenstatus und Lagerbestände.

## Roadmap

- [ ] GMP-Elektronische-Unterschrift-Unterstützung (21 CFR Part 11)
- [ ] Länder-/Chargenfreigaberegeln (TRIC, EU QP-Freigabe)
- [ ] Abweichungs-Auto-Hold
- [ ] Reinigungsvalidierungs-Constraint (GMP Annex 15)
