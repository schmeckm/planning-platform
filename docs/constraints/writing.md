# Writing a Constraint

This guide walks through implementing a complete constraint from scratch. We'll build a **Hold Time Constraint** — a real pharma requirement that intermediate products must not be held longer than a defined maximum before the next processing step.

## Step 1 — Create the File

```bash
# For a new pharma constraint, add it to the pharma pack
touch packages/planning-pharma/src/constraints/HoldTimeConstraint.ts
```

## Step 2 — Implement the Interface

```typescript
// packages/planning-pharma/src/constraints/HoldTimeConstraint.ts

import type {
  PlanningConstraint,
  ConstraintContext,
  ConstraintResult,
  ConstraintTestCase,
} from '@PCP/planning-constraints'

/**
 * Pharma Hold Time Constraint
 *
 * Ensures that no operation starts later than the maximum hold time
 * allowed for the intermediate material produced by the preceding operation.
 *
 * Regulatory reference: ICH Q7 Section 8.3
 * Requirement ID: URS-PLAN-042
 */
export class HoldTimeConstraint implements PlanningConstraint {
  readonly id = 'pharma.hold-time'
  readonly version = '1.0.0'
  readonly name = 'Hold Time'
  readonly description =
    'Intermediate materials must not be held longer than their defined maximum hold time.'
  readonly severity = 'BLOCKING' as const

  async evaluate(context: ConstraintContext): Promise<ConstraintResult> {
    const maxHoldTimeMin = this.getMaxHoldTime(context)

    if (maxHoldTimeMin === null) {
      // No hold time defined for this material — constraint passes
      return this.pass(context)
    }

    const precedingEnd = this.getPrecedingOperationEnd(context)

    if (!precedingEnd) {
      return this.pass(context)
    }

    const actualHoldTimeMin =
      (context.proposedStart.getTime() - precedingEnd.getTime()) / 60_000

    if (actualHoldTimeMin > maxHoldTimeMin) {
      return {
        constraintId: this.id,
        constraintVersion: this.version,
        orderId: context.order.id,
        operationId: context.operation.id,
        passed: false,
        severity: this.severity,
        message: `Hold time exceeded: ${Math.round(actualHoldTimeMin)}min > ${maxHoldTimeMin}min`,
        detail: `The intermediate from operation ${context.operation.predecessors[0]} was produced at ${precedingEnd.toISOString()}. The proposed start of ${context.operation.id} at ${context.proposedStart.toISOString()} exceeds the maximum hold time of ${maxHoldTimeMin} minutes.`,
        suggestedAction: `Schedule operation ${context.operation.id} to start before ${new Date(precedingEnd.getTime() + maxHoldTimeMin * 60_000).toISOString()}.`,
        evidence: {
          precedingOperationEnd: precedingEnd.toISOString(),
          proposedStart: context.proposedStart.toISOString(),
          actualHoldTimeMin,
          maxHoldTimeMin,
        },
      }
    }

    return this.pass(context)
  }

  explain(result: ConstraintResult): string {
    if (result.passed) {
      return `Hold time is within limits.`
    }
    return result.message
  }

  readonly testCases: ConstraintTestCase[] = [
    {
      name: 'Hold time within limit',
      description: 'Operation starts 2 hours after predecessor ends; limit is 4 hours.',
      context: {
        operation: {
          id: 'OP-002',
          predecessors: ['OP-001'],
          // ... other fields
        } as any,
        proposedStart: new Date('2026-06-21T10:00:00Z'),
        order: { tags: { 'pharma.maxHoldTimeMin': '240' } } as any,
      },
      expectedResult: { passed: true, severity: 'BLOCKING' },
    },
    {
      name: 'Hold time exceeded',
      description: 'Operation starts 6 hours after predecessor; limit is 4 hours.',
      context: {
        operation: {
          id: 'OP-002',
          predecessors: ['OP-001'],
        } as any,
        proposedStart: new Date('2026-06-21T12:00:00Z'),
        order: { tags: { 'pharma.maxHoldTimeMin': '240' } } as any,
      },
      expectedResult: { passed: false, severity: 'BLOCKING' },
    },
    {
      name: 'No hold time defined',
      description: 'Material has no hold time — constraint should pass.',
      context: {
        order: { tags: {} } as any,
      },
      expectedResult: { passed: true, severity: 'BLOCKING' },
    },
  ]

  private getMaxHoldTime(context: ConstraintContext): number | null {
    const tag = context.getTag(context.order, 'pharma.maxHoldTimeMin')
    return tag ? parseInt(tag, 10) : null
  }

  private getPrecedingOperationEnd(context: ConstraintContext): Date | null {
    // In a real implementation, this would look up the scheduled end
    // of the predecessor operation from the simulation context.
    return null
  }

  private pass(context: ConstraintContext): ConstraintResult {
    return {
      constraintId: this.id,
      constraintVersion: this.version,
      orderId: context.order.id,
      operationId: context.operation.id,
      passed: true,
      severity: this.severity,
      message: 'Hold time within limits.',
    }
  }
}
```

## Step 3 — Register the Constraint

```typescript
// packages/planning-pharma/src/index.ts
export { HoldTimeConstraint } from './constraints/HoldTimeConstraint'
```

## Step 4 — Write Tests

```typescript
// packages/planning-pharma/src/constraints/HoldTimeConstraint.test.ts
import { describe, it, expect } from 'vitest'
import { HoldTimeConstraint } from './HoldTimeConstraint'
import { runConstraintTestCases } from '@PCP/planning-constraints/testing'

describe('HoldTimeConstraint', () => {
  const constraint = new HoldTimeConstraint()

  // Automatically runs all test cases defined in the constraint
  runConstraintTestCases(constraint)

  it('uses pharma.maxHoldTimeMin tag from the order', async () => {
    // Custom integration test...
  })
})
```

## Step 5 — Document the Constraint

Add a documentation entry in `/docs/constraints/builtin.md` and open a Pull Request. See [PR & Review Process](/conventions/pr-process) for what reviewers will check.
