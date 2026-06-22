# Contributing

Pharma Collective Platform is built by manufacturing planners, APS developers, ERP consultants, and researchers who believe planning knowledge should be open.

## Ways to Contribute

| Contribution Type | What to Do |
|---|---|
| New constraint | Implement `PlanningConstraint`, add tests and docs, open PR |
| New industry pack | Create `packages/planning-<industry>`, see [Build Your Own Pack](/industries/custom) |
| New adapter | Create `packages/adapter-<system>`, see [Build an Adapter](/adapters/custom) |
| Bug fix | Open an issue, reference it in your PR |
| Documentation | Edit any `.md` file and open a PR |
| Sample data | Add realistic (anonymized) mock datasets |
| Translation | Help translate documentation |

## First Contribution

**Find a good first issue** on GitHub by filtering for the `good-first-issue` label.

Most good first issues are:
- Adding a missing constraint that already exists in another industry
- Improving the documentation for an existing constraint
- Adding a missing test case
- Fixing a typo or unclear explanation

## Contribution Checklist

Before opening a PR, verify:

- [ ] Code follows the [Code Style](/conventions/code-style) guide
- [ ] Commit messages follow [Conventional Commits](/conventions/commits)
- [ ] Tests pass locally (`pnpm test`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Type check passes (`pnpm typecheck`)
- [ ] Documentation is included or updated
- [ ] [PR Template](/conventions/pr-process#pr-template) is filled out

## Community Values

**Openness** — Planning knowledge belongs to everyone. No gated content, no "professional edition" with better constraints.

**Explainability** — Every constraint must be understandable by a planner, not just a developer.

**Regulatory integrity** — Pharma and CGT constraints are reviewed by domain experts. Don't weaken safety constraints to make tests pass.

**Respectful collaboration** — We are building a commons. Be direct, be kind, assume good intent.

## Getting Help

- **GitHub Discussions** — for questions, ideas, and feedback
- **GitHub Issues** — for bug reports and feature requests
- **Discord** (coming soon) — for real-time discussion

## Governance

See [Governance](/community/governance) for how decisions are made and how maintainers are elected.
