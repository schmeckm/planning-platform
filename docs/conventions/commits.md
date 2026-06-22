# Commit Messages

Pharma Collective Platform uses [Conventional Commits](https://www.conventionalcommits.org/).

## Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

## Types

| Type | When to Use |
|---|---|
| `feat` | New constraint, adapter, industry pack, or feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code restructure, no behavior change |
| `test` | Adding or updating tests |
| `chore` | Tooling, dependencies, CI config |
| `perf` | Performance improvement |

## Scopes

Use the package or area name:

```
planning-core, planning-constraints, planning-pharma, planning-cgt,
planning-adapters, api, web, docs, ci
```

## Examples

```
feat(planning-pharma): add HoldTimeConstraint (URS-PLAN-042)

Implements the hold time check for intermediate materials per ICH Q7 §8.3.
Returns BLOCKING when the gap between predecessor end and proposed start
exceeds pharma.maxHoldTimeMin defined on the order.

Refs: #142
```

```
fix(planning-constraints): ConstraintEngine correctly handles empty predecessor list
```

```
docs(docs): add CGT industry pack getting started guide
```

```
chore(ci): add coverage threshold enforcement for constraint packages
```

## Why Conventional Commits?

- **Automated changelog** — release notes are generated from commit history
- **Clear scope** — reviewers immediately see which package is affected
- **Breaking change detection** — `BREAKING CHANGE:` footer triggers a major version bump
