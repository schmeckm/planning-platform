# Constraint Plugin Interface

The constraint system is the heart of the Open Planning Platform. Every planning rule — from simple capacity checks to complex regulatory requirements — is implemented as a constraint plugin.

## The Interface

```typescript
// packages/planning-constraints/src/interfaces/constraint.interface.ts

export interface IConstraintPlugin {
  /** Static metadata — never changes at runtime */
  readonly metadata: ConstraintMetadata

  /**
   * Evaluate the constraint against a single order context.
   * Must be side-effect-free and deterministic.
   * Must never throw — return a failed result instead.
   */
  evaluate(ctx: ConstraintContext): Promise<ConstraintEvaluationResult>

  /**
   * Run the plugin's built-in test cases.
   * Called during validation / IQ-OQ-PQ phases.
   */
  selfTest(): Promise<ConstraintSelfTestResult>
}
```

## ConstraintMetadata

```typescript
export interface ConstraintMetadata {
  /** Globally unique identifier. Format: 'domain.area.name' */
  readonly id: ConstraintId

  /** Semantic version — MAJOR.MINOR.PATCH */
  readonly version: string

  /** Short human-readable name shown to planners */
  readonly name: string

  /** Detailed description of the business rule */
  readonly description: string

  /** Domain: GENERIC | PHARMA | CGT | FOOD | SEMICONDUCTOR | PACKAGING | ... */
  readonly domain: ConstraintDomain

  /** Severity when the constraint fires */
  readonly defaultSeverity: ConstraintSeverity

  /** GxP traceability references */
  readonly validationRefs: ValidationReference[]

  /** Author / maintainer */
  readonly author: string

  /** SPDX license identifier (e.g. 'Apache-2.0') */
  readonly license: string

  /** Tags for filtering and discovery */
  readonly tags: string[]
}
```

## ConstraintContext

The context object provides everything a constraint needs to evaluate one order:

```typescript
export interface ConstraintContext {
  order: PlanningOrder
  resources: PlanningResource[]
  batches: PlanningBatch[]
  materials: PlanningMaterial[]
  inventory: InventoryPosition[]

  /** All other orders in the same simulation run */
  siblingOrders: PlanningOrder[]

  /** Current simulation point in time */
  evaluationTime: Date

  /** Arbitrary context data injected by adapters or industry packs */
  extensions: Record<string, unknown>
}
```

## ConstraintEvaluationResult

```typescript
export interface ConstraintEvaluationResult {
  constraintId: ConstraintId
  constraintVersion: string
  severity: ConstraintSeverity
  passed: boolean

  /** Score 0 (worst) – 1 (perfect) — used by the optimization engine */
  score: number

  /** Short message — shown in Gantt tooltips */
  message: string

  /** Long explanation — shown in constraint detail panel */
  explanation: string

  /** Corrective action for the planner */
  correctionHint?: string

  /** Raw data used during evaluation */
  detail: Record<string, unknown>

  /** GxP references: URS, FS, DS, Test case IDs */
  validationRefs?: ValidationReference[]
}
```

## Severity System

| Severity | Planning Impact |
|---|---|
| `BLOCKER` | Order **cannot** be scheduled. `schedulingStatus = INFEASIBLE` |
| `WARNING` | Order is scheduled, planner is notified. `schedulingStatus = SOFT_VIOLATION` |
| `RECOMMENDATION` | Informational hint — no scheduling impact |
| `INFO` | Pure logging — no planning impact |

## Builder Functions

The package ships three builder functions so plugins don't have to write boilerplate:

```typescript
// Constraint passed
buildPassResult(meta, explanation, detail?)

// Hard violation — BLOCKER
buildFailResult(meta, message, explanation, correctionHint, score?, detail?)

// Soft violation — WARNING
buildWarnResult(meta, message, explanation, correctionHint, score?, detail?)
```

## Registration

```typescript
import { ConstraintRegistry, ConstraintEngine } from '@PCP/planning-constraints'
import { PharmaHoldTimeConstraint } from '@PCP/planning-pharma'

const registry = new ConstraintRegistry()
registry.register(new PharmaHoldTimeConstraint())

const engine = new ConstraintEngine(registry)
const output = await engine.evaluate({ orders, context })
```

## Next Steps

- [Write Your First Constraint](/constraints/writing) — step-by-step implementation guide
- [Scoring & Severity](/constraints/scoring) — when to use BLOCKER vs WARNING
- [Testing Constraints](/constraints/testing) — implementing `selfTest()` correctly
- [Built-in Constraints](/constraints/builtin) — what ships with the platform
