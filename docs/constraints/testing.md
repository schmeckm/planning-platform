# Testing Constraints

Every constraint must include automated test cases. This is enforced in the PR review process — a PR without passing tests will not be merged.

## Built-in Test Runner

`@PCP/planning-constraints` ships a `runConstraintTestCases` helper that automatically executes all `testCases` defined in the constraint:

```typescript
import { describe } from 'vitest'
import { runConstraintTestCases } from '@PCP/planning-constraints/testing'
import { HoldTimeConstraint } from './HoldTimeConstraint'

describe('HoldTimeConstraint', () => {
  runConstraintTestCases(new HoldTimeConstraint())
})
```

This is the **minimum** required test coverage. Each constraint must define at least:
1. A **passing** test case (constraint not violated)
2. A **failing** test case (constraint violated)
3. An **edge case** (missing data, null values, boundary conditions)

## Writing Custom Test Cases

```typescript
import { describe, it, expect } from 'vitest'
import { buildContext } from '@PCP/planning-constraints/testing'
import { HoldTimeConstraint } from './HoldTimeConstraint'

describe('HoldTimeConstraint — custom tests', () => {
  const constraint = new HoldTimeConstraint()

  it('blocks when hold time exceeds limit by 1 minute', async () => {
    const context = buildContext({
      order: { tags: { 'pharma.maxHoldTimeMin': '240' } },
      proposedStart: new Date('2026-06-21T10:01:00Z'),
      // precedingOperationEnd is implicitly 2026-06-21T06:00:00Z → 241 min gap
    })

    const result = await constraint.evaluate(context)

    expect(result.passed).toBe(false)
    expect(result.severity).toBe('BLOCKING')
    expect(result.suggestedAction).toBeDefined()
  })

  it('passes when hold time is exactly at the limit', async () => {
    const context = buildContext({
      order: { tags: { 'pharma.maxHoldTimeMin': '240' } },
      proposedStart: new Date('2026-06-21T10:00:00Z'),
      // precedingOperationEnd: 2026-06-21T06:00:00Z → exactly 240 min
    })

    const result = await constraint.evaluate(context)

    expect(result.passed).toBe(true)
  })
})
```

## Running Tests

```bash
# Run tests for a single package
pnpm --filter @PCP/planning-pharma test

# Run all tests in the monorepo
pnpm test

# Run with coverage
pnpm --filter @PCP/planning-pharma test --coverage
```

## CI Requirements

All tests are run automatically on every pull request. The CI pipeline will reject a PR if:
- Any test fails
- Coverage for the new constraint file drops below 80%
- The constraint does not define the required minimum 3 test cases

See [PR & Review Process](/conventions/pr-process) for the full checklist.
