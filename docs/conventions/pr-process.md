# PR & Review Process

All contributions to Pharma Collective Platform go through a pull request process. This ensures every constraint, adapter, and industry pack meets the quality and documentation standards required for a community-maintained planning platform.

## PR Types

| Type | Scope | Reviewers Required |
|---|---|---|
| `feat` | New constraint / adapter / industry pack | 1 domain expert + 1 core maintainer |
| `fix` | Bug fix in existing constraint | 1 core maintainer |
| `docs` | Documentation only | 1 core maintainer |
| `refactor` | Internal restructure, no behavior change | 1 core maintainer |
| `chore` | Tooling, dependencies, CI | 1 core maintainer |

## PR Template

Every pull request must use this template (`.github/pull_request_template.md`):

```markdown
## Summary

<!-- One paragraph: what does this PR add or fix? -->

## Type
- [ ] New constraint
- [ ] New industry pack
- [ ] New adapter
- [ ] Bug fix
- [ ] Documentation
- [ ] Refactor

## Constraint / Feature Details (for new constraints)

**Constraint ID:** `pharma.hold-time`
**Severity:** BLOCKING / WARNING / SCORING / RECOMMENDATION
**Business Purpose:** <!-- Why does this rule exist? What business problem does it solve? -->
**Regulatory Reference:** <!-- ICH Q7 §8.3, GMP Annex 15, 21 CFR Part 211, etc. -->
**Requirement ID:** <!-- URS-PLAN-042 -->

## Checklist

### Code
- [ ] TypeScript strict mode — no `any`
- [ ] All public functions have JSDoc
- [ ] `explain()` returns a meaningful human-readable message

### Tests
- [ ] At least 3 test cases defined in `testCases`
- [ ] All test cases pass (`pnpm test`)
- [ ] Coverage ≥ 80% for new files

### Documentation
- [ ] Added to `/docs/constraints/builtin.md` (or industry pack page)
- [ ] Business purpose documented in code comment
- [ ] Regulatory reference cited (if applicable)
- [ ] Sample data provided (if new mock data needed)

### Validation (for pharma / CGT constraints)
- [ ] Requirement ID assigned
- [ ] Test case names match acceptance criteria
- [ ] IQ/OQ/PQ readiness considered

## Breaking Changes

<!-- Does this change the behavior of existing constraints or the data model? -->
<!-- If yes: describe migration path and version bump. -->
```

## Review Checklist for Reviewers

When reviewing a new constraint PR, verify:

1. **Interface compliance** — does it correctly implement `PlanningConstraint`?
2. **Severity appropriateness** — is BLOCKING justified, or should it be WARNING?
3. **Explainability** — does `explain()` give planners actionable information?
4. **Test coverage** — are the test cases meaningful, not just token tests?
5. **Tag namespacing** — are custom tags correctly namespaced?
6. **No core pollution** — does the constraint use only `ConstraintContext`, not internal APIs?
7. **Documentation** — is the business purpose clear to someone from a different company?

## Versioning

Constraint versions follow **semantic versioning**:

- `PATCH` (1.0.0 → 1.0.1) — bug fix, behavior unchanged in passing cases
- `MINOR` (1.0.0 → 1.1.0) — new behavior added, no breaking changes
- `MAJOR` (1.0.0 → 2.0.0) — the constraint now blocks cases it previously passed (breaking)

**Never make a constraint more restrictive in a PATCH release.**

## Domain Expert Review

For industry-specific constraints (pharma, CGT, food, semiconductor), at least one reviewer must have domain expertise in that industry. The contributor can request a specific reviewer, or tag the `@domain-pharma` or `@domain-cgt` team.
