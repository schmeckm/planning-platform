# Pharma Manufacturing Pack

The `@PCP/planning-pharma` pack provides constraints and templates for **GMP-compliant pharmaceutical manufacturing** planning.

## What Makes Pharma Planning Unique

Pharmaceutical manufacturing is subject to strict regulatory requirements (GMP, FDA 21 CFR, EMA guidelines, ICH standards) that directly constrain the scheduling of production orders:

- **Batch release** — no order can ship or proceed to the next step until QA has released the batch
- **Cleaning validation** — changing from one product family to another requires documented, validated cleaning
- **Hold times** — intermediate materials have maximum allowed hold times between processing steps
- **Remaining shelf life** — input materials must have sufficient shelf life to cover the entire operation
- **Campaign planning** — same-product batches are grouped to minimize cleaning and changeover
- **Chain of custody** — every material movement must be traceable and auditable

## Installation

```bash
pnpm add @PCP/planning-pharma
```

## Quick Start

```typescript
import { ConstraintEngine } from '@PCP/planning-constraints'
import {
  BatchReleaseConstraint,
  CleaningValidationConstraint,
  HoldTimeConstraint,
  RMSLConstraint,
  CampaignSequencingConstraint,
} from '@PCP/planning-pharma'

const engine = new ConstraintEngine([
  new BatchReleaseConstraint(),
  new CleaningValidationConstraint(),
  new HoldTimeConstraint(),
  new RMSLConstraint(),
  new CampaignSequencingConstraint(),
])

const result = await engine.evaluate(orders, resources)
```

## Included Constraints

| Constraint | Severity | Regulatory Reference |
|---|---|---|
| `pharma.batch-release` | BLOCKING | GMP Annex 16 |
| `pharma.inspection-lot` | BLOCKING | SAP QM / LIMS integration |
| `pharma.cleaning-validation` | BLOCKING | GMP Annex 15 |
| `pharma.hold-time` | BLOCKING | ICH Q7 §8.3 |
| `pharma.rmsl` | BLOCKING | 21 CFR Part 211.122 |
| `pharma.deviation-check` | WARNING | GMP Chapter 6 |
| `pharma.campaign-sequencing` | SCORING | Industry best practice |

## Configuration via Order Tags

Pharma-specific parameters are passed via the `tags` field of canonical model entities:

```typescript
const order: Order = {
  id: 'ORD-4711',
  // ...
  tags: {
    'pharma.productFamily': 'PF-08',          // used by cleaning-validation
    'pharma.maxHoldTimeMin': '240',            // used by hold-time
    'pharma.minRemainingShelfLifeDays': '30',  // used by rmsl
    'pharma.batchClassification': 'EXHIBIT',   // used by batch-release
  }
}
```

## Validation Framework {#validation}

The pharma pack includes a validation framework that supports GxP validation:

- Every constraint has a `requirementId` (e.g., `URS-PLAN-042`)
- Constraint versions are locked to a simulation run
- The audit trail records which constraint version evaluated which order
- Test cases can be linked to IQ/OQ/PQ acceptance criteria

```typescript
const validationReport = engine.generateValidationReport(simulationRun)
// Returns: constraint version, requirement IDs, test case results, audit entries
```

## Sample Data

Mock pharma data for development is available in `packages/planning-pharma/mock-data/`:

```bash
# Load mock pharma data
pnpm --filter @PCP/backend db:seed --pack pharma
```

Includes: 20 production orders, 8 reactors with calendars, cleaning matrices, batch statuses, and inventory levels.

## Roadmap

- [ ] GMP electronic signature support (21 CFR Part 11)
- [ ] Country/batch release rules (TRIC, EU QP release)
- [ ] Yield variance integration
- [ ] Deviation auto-hold
