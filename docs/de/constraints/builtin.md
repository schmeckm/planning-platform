# Mitgelieferte Constraints

## Generische Constraints (`@opp/planning-constraints`)

Sofort verfügbar, keine zusätzlichen Pakete nötig.

| Constraint-ID | Schweregrad | Beschreibung |
|---|---|---|
| `generic.atp.availability` | BLOCKER | ATP-Verfügbarkeit: benötigtes Eingangsmaterial nicht im Bestand |
| `generic.resource.capacity` | WARNING | Ressource überschreitet definierten Auslastungsschwellwert |
| `generic.shelf-life.remaining` | BLOCKER | Verbleibende Haltbarkeit reicht nicht für die Operationsdauer |

## Pharma-Constraints (`@opp/planning-pharma`)

| Constraint-ID | Schweregrad | Regulatorische Referenz |
|---|---|---|
| `pharma.batch.release` | BLOCKER | GMP Annex 16 — QA-Freigabe |
| `pharma.operation.hold-time` | BLOCKER | ICH Q7 §8.3 — Haltezeiten |

### Geplant (Phase 2)

| Constraint-ID | Schweregrad | Beschreibung |
|---|---|---|
| `pharma.cleaning.validation` | BLOCKER | Produktfamilienwechsel erfordert Reinigungsvalidierung (GMP Annex 15) |
| `pharma.batch.deviation` | WARNING | Offene Abweichung auf der Charge |
| `pharma.campaign.sequencing` | RECOMMENDATION | Gleiche Produkt-Batches bevorzugt aufeinanderfolgend |

## CGT-Constraints (`@opp/planning-cgt`)

| Constraint-ID | Schweregrad | Beschreibung |
|---|---|---|
| `cgt.identity.chain` | BLOCKER | Patientenspezifische Materialien dürfen nie gemischt werden |
| `cgt.timeline.vein-to-vein` | BLOCKER | Gesamtes Produktionsfenster darf Patienteninfusionstermin nicht überschreiten |

## Constraint entdecken

```typescript
import { ConstraintRegistry } from '@opp/planning-constraints'
import { PharmaHoldTimeConstraint, PharmaBatchReleaseConstraint } from '@opp/planning-pharma'
import { CgtChainOfIdentityConstraint } from '@opp/planning-cgt'

const registry = new ConstraintRegistry()

// Constraints registrieren
registry.register(new PharmaHoldTimeConstraint())
registry.register(new PharmaBatchReleaseConstraint())
registry.register(new CgtChainOfIdentityConstraint())

// Alle registrierten Constraints anzeigen
registry.getAll().forEach(c => {
  console.log(`${c.metadata.id} v${c.metadata.version} [${c.metadata.domain}]`)
})
```
