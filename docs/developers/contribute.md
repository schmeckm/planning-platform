# Contribute

PCP is a **planning commons** — like successful OSS startups, we optimize for clear contribution paths, review quality, and shared ownership.

## Who contributes?

| Role | Typical contributions |
|---|---|
| **Manufacturing planner** | Constraint ideas, test cases, documentation, domain review |
| **APS / scheduling developer** | Constraints, engine integration, performance |
| **ERP / MES integrator** | Adapters, field mapping docs, sample payloads |
| **QA / validation** | Requirement IDs, audit scenarios, release review |
| **Researcher** | Algorithms, benchmarks (via constraints or HAE engines) |

You do not need commit access to start — **fork + PR** is the default path.

## Quick start (first PR)

1. **Read** [Extension model](/developers/extension-model) — know what belongs where.
2. **Pick work** — GitHub issues labeled `good-first-issue` (docs, tests, small constraints).
3. **Branch** from `main` — `feat/pharma-hold-time` or `docs/adapter-sap-fields`.
4. **Develop** with tests and docs (see [checklist](#contribution-checklist)).
5. **Open PR** using the [PR template](https://github.com/schmeckm/planningplatform/blob/main/.github/pull_request_template.md).
6. **Respond to review** — domain experts for GMP/CGT, maintainers for architecture.

```bash
git clone https://github.com/schmeckm/planningplatform.git
cd planningplatform/open-planning-platform
pnpm install
pnpm test
```

## Contribution checklist

Before requesting review:

### Code
- [ ] TypeScript **strict** — no `any`
- [ ] `pnpm test` passes
- [ ] `pnpm lint` and `pnpm typecheck` pass
- [ ] Public APIs have JSDoc

### Constraints & packs
- [ ] `explain()` returns planner-readable text
- [ ] ≥3 `testCases` per new constraint
- [ ] Regulatory reference or business purpose documented
- [ ] Domain expert review for GMP/CGT rules

### Adapters
- [ ] Mapping table source → canonical model
- [ ] No business logic in adapter layer

### Documentation
- [ ] User-facing change reflected in `docs`
- [ ] [Documentation requirements](/conventions/documentation) met

### Process
- [ ] [Conventional Commits](/conventions/commits)
- [ ] PR template fully filled
- [ ] Breaking changes called out + migration steps

Full detail: [Contributing](/community/contributing) · [PR & review](/conventions/pr-process)

## Review expectations

| PR type | Reviewers |
|---|---|
| New constraint / pack | 1 domain expert + 1 maintainer |
| New adapter | 1 maintainer |
| Kernel / interface change | 2 core maintainers + RFC discussion |
| Docs only | 1 maintainer |
| Bug fix | 1 maintainer |

**Lazy consensus:** routine proposals accepted if no objection within 7 days ([Governance](/community/governance)).

## Releases & your contribution

Merged work ships in **semver releases**:

1. [Changelog](/community/changelog) — technical delta
2. [Release notes](/community/release-notes/) — narrative for users
3. Git tag + GitHub Release

Contributors are credited in release notes when user-visible. Maintainers follow [release notes convention](/conventions/release-notes).

## Community values

- **Openness** — planning knowledge is a commons, not a consulting moat
- **Explainability** — planners and QA must understand decisions
- **Regulatory integrity** — safety constraints are not negotiable in review
- **Respectful collaboration** — assume good intent, be direct

## Get help

| Channel | Use for |
|---|---|
| [GitHub Issues](https://github.com/schmeckm/planningplatform/issues) | Bugs, feature requests |
| [GitHub Discussions](https://github.com/schmeckm/planningplatform/discussions) | RFCs, architecture questions |
| [Roadmap](/community/roadmap) | Planned work, avoid duplicate effort |

## Related

- [Build addons](/developers/build-addons)
- [Extension model](/developers/extension-model)
- [Code of conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/) (Contributor Covenant 2.1)
