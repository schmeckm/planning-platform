# Built-in Constraints

These constraints ship with the platform and are immediately available without installing additional industry packs.

## Generic Constraints (`@PCP/planning-constraints`)

| Constraint ID | Severity | Description |
|---|---|---|
| `generic.atp.availability` | BLOCKER | Required input material not in stock (ATP check) |
| `generic.resource.capacity` | WARNING | Resource utilization exceeds defined threshold |
| `generic.shelf-life.remaining` | BLOCKER | Remaining material shelf life does not cover operation duration |

## Pharma Constraints (`@PCP/planning-pharma`)

| Constraint ID | Severity | Regulatory Reference |
|---|---|---|
| `pharma.batch.release` | BLOCKER | Batch must be QA released before scheduling — GMP Annex 16 |
| `pharma.operation.hold-time` | BLOCKER | Inter-operation gap must meet validated min/max hold time — ICH Q7 §8.3 |

### Planned (Phase 2)

| Constraint ID | Severity | Description |
|---|---|---|
| `pharma.cleaning.validation` | BLOCKER | Product family change requires cleaning validation — GMP Annex 15 |
| `pharma.batch.deviation` | WARNING | Open deviation on batch — requires planner review |
| `pharma.campaign.sequencing` | RECOMMENDATION | Same product batches prefer consecutive slots |

## CGT Constraints (`@PCP/planning-cgt`)

| Constraint ID | Severity | Description |
|---|---|---|
| `cgt.identity.chain` | BLOCKER | Patient-specific materials must never be co-located |
| `cgt.timeline.vein-to-vein` | BLOCKER | Total manufacturing window cannot exceed patient infusion deadline |

### Planned (Phase 2)

| Constraint ID | Severity | Description |
|---|---|---|
| `cgt.storage.cryogenic` | BLOCKER | Cryo storage slots fully occupied on proposed date |
| `cgt.timeline.qc-release` | WARNING | QC release window may not close before infusion date |

## Using constraints

```typescript
import { ConstraintRegistry, ConstraintEngine } from '@PCP/planning-constraints'
import { AtpAvailabilityConstraint, ResourceCapacityConstraint } from '@PCP/planning-constraints'
import { PharmaHoldTimeConstraint, PharmaBatchReleaseConstraint } from '@PCP/planning-pharma'
import { CgtChainOfIdentityConstraint, CgtVeinToVeinConstraint } from '@PCP/planning-cgt'

const registry = new ConstraintRegistry()

// Register only what you need
registry.register(new AtpAvailabilityConstraint())
registry.register(new PharmaHoldTimeConstraint())

const engine = new ConstraintEngine(registry)
const result = await engine.evaluate({ orders, context })
```
