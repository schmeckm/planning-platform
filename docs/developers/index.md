---
layout: home

hero:
  name: "Developer Hub"
  text: "Extend the platform — don't fork the kernel"
  tagline: >
    Collective Intelligence for pharma planning — many contributors, one direction.
    Apache-2.0 open source: build constraints, industry packs, and adapters on a
    stable kernel and contribute back to the community.
  image:
    src: /images/opp-logo.png
    alt: Bird flock — Collective Intelligence for open pharma planning
  actions:
    - theme: brand
      text: Get started locally
      link: /guide/getting-started
    - theme: alt
      text: What you can change
      link: /developers/extension-model
    - theme: alt
      text: GitHub
      link: https://github.com/schmeckm/planningplatform

features:
  - title: What you can (and cannot) change
    details: >
      Clear boundaries: plugins and adapters yes, kernel surgery only with maintainer review.
      Shadow-first writes, dependency rules, and GMP integrity explained.
    link: /developers/extension-model
    linkText: Extension model

  - title: Build addons & modules
    details: >
      Step-by-step paths for constraints, industry packs, ERP/MES adapters,
      and operational modules like shopfloor transparency.
    link: /developers/build-addons
    linkText: Build your addon

  - title: HAE integration (embedded UI)
    details: >
      How @PCP/frontend resolves Cockpit and Portal paths, HAE_MONOREPO_ROOT,
      Docker profiles, and the vendor/ submodule layout for a standalone repo.
    link: /developers/hae-integration
    linkText: HAE integration

  - title: Repository extraction (PR 9)
    details: >
      Export a standalone planning-platform tree, vendor/ sync from HAE,
      submodule layout, Docker standalone profile, and CI switchover.
    link: /developers/repo-extraction
    linkText: Repo extraction

  - title: Contribute
    details: >
      Good first issues, PR checklist, domain expert review, and how decisions
      are made in an open planning commons.
    link: /developers/contribute
    linkText: Contribution guide

  - title: Architecture
    details: >
      Monorepo layers — planning-core, constraint engine, industry packs,
      adapters, API, and embedded cockpit UI.
    link: /guide/architecture
    linkText: Architecture guide

  - title: Releases
    details: >
      Semantic versioning, release notes for users, changelog for upgraders,
      and the maintainer publishing checklist.
    link: /conventions/release-notes
    linkText: Release process

  - title: Conventions
    details: >
      TypeScript strict, Conventional Commits, documentation requirements,
      icons, and PR templates — the quality bar for merged code.
    link: /conventions/code-style
    linkText: Developer conventions
---

## Documentation levels

| Level | Where | For |
|---|---|---|
| **In-app help** | `/planning/help` | Planners — workflow, modules, glossary |
| **Platform** | `/platform#documentation` | Business processes, pharma domains |
| **Developer hub** (here) | VitePress `/developers/` | IT, integrators, contributors |

## Stack at a glance

```
planning-core          ← kernel (canonical model, simulation types)
planning-constraints   ← plugin engine
planning-pharma / cgt  ← industry packs
planning-adapters      ← ERP/MES/LIMS mapping
apps/backend · frontend · docs  ← HTTP API, UI, documentation
```

**HAE** (repository root) is the executable allocation/scheduling layer embedded by the Portal. **OPP** (`open-planning-platform/`) is the open kernel and simulation stack.

## License & community

- **Code:** Apache 2.0
- **Docs:** CC BY 4.0
- **Governance:** [lazy consensus](/community/governance) for routine changes; kernel changes need explicit maintainer approval

→ Back to [Platform documentation](/platform#documentation) for planner-oriented content (open your Portal host).
