---
layout: home

hero:
  name: "Pharma Collective Platform"
  text: "The scheduling kernel for pharma planning"
  tagline: >
    Open scheduling for pharmaceutical manufacturing — modular, explainable,
    GMP-ready. Collective Intelligence: many planners and developers, one shared
    planning kernel. No black box.
  image:
    src: /images/opp-logo.png
    alt: Bird flock — Collective Intelligence for open pharma planning
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: What is PCP?
      link: /guide/concept
    - theme: alt
      text: GitHub
      link: https://github.com/schmeckm/planningplatform

features:
  - icon:
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2H8a2 2 0 0 0-2 2v1a2 2 0 0 1-2 2H3"/><path d="M12 2h4a2 2 0 0 1 2 2v1a2 2 0 0 0 2 2h1"/><rect x="6" y="9" width="12" height="13" rx="2"/><path d="M9 13h6M9 17h4"/></svg>'
    title: Plugin-based Constraints
    details: >
      Every planning rule is a versioned, testable, explainable plugin.
      Write a new constraint once — reuse it across industries and ERP systems.
    link: /constraints/interface
    linkText: Write your first constraint

  - icon:
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="13" width="5" height="9"/><rect x="9" y="9" width="5" height="13"/><rect x="16" y="5" width="5" height="17"/><path d="M2 13 7 8l5 3 5-6 5-3"/></svg>'
    title: Industry Packs
    details: >
      Pharma GMP, Cell & Gene Therapy vein-to-vein, Packaging changeover,
      Food allergen management — pre-built, validated, community-maintained.
    link: /industries/pharma
    linkText: Browse industry packs

  - icon:
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><path d="M6 18H3M21 6h-3M15 18h-6M18 9v6M18 3v0"/><path d="M9 6H6a3 3 0 0 0 0 6h3"/></svg>'
    title: ERP / MES Adapters
    details: >
      ERP, MES, WMS, LIMS, CSV, and custom APIs. External systems
      map into the canonical data model — the core never knows which system you run.
    link: /adapters/overview
    linkText: See all adapters

  - icon:
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 10h8M8 14h5"/></svg>'
    title: Explainable Scheduling
    details: >
      Every blocked order, every constraint violation returns a human-readable
      reason. Planners and QA users can always ask: "Why was this order blocked?"
    link: /guide/concept#explainability
    linkText: How explainability works

  - icon:
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>'
    title: GxP & Validation Ready
    details: >
      Built-in validation framework with requirement IDs, IQ/OQ/PQ references,
      version-controlled rules, and full audit trail. Designed for regulated industries.
    link: /industries/pharma#validation
    linkText: Pharma validation guide

  - icon:
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M7 8h4M7 11h10M7 14h6"/></svg>'
    title: Shopfloor Transparency
    details: >
      Live packaging-line visibility via MQTT: OEE, schedule adherence, WIP orders,
      and disturbances — shadow ingest only, full parity with the legacy HAE portal.
    link: /modules/shopfloor
    linkText: Shopfloor module guide

  - icon:
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="3"/><circle cx="17" cy="5" r="2"/><circle cx="17" cy="19" r="2"/><path d="M12 7h2a4 4 0 0 1 4 4v1M9 10a4 4 0 0 0-4 4v2h8v-2a4 4 0 0 0-3-3.87M15 17v-1.5a2 2 0 0 1 2-2"/></svg>'
    title: Community Contribution Model
    details: >
      GitHub PR templates, mandatory test cases, documentation requirements,
      domain expert review — planning knowledge that belongs to everyone.
    link: /community/contributing
    linkText: How to contribute
---

## Why Pharma Collective Platform?

Planning knowledge in **pharmaceutical manufacturing** is **locked inside expensive consulting projects** for proprietary Advanced Planning Systems. Every company re-implements the same pharma batch release logic, the same campaign sequencing rules, the same cleaning matrix constraints — over and over again, at enormous cost.

**Pharma Collective Platform changes this.** Inspired by the Linux Kernel model, PCP provides a small, stable, generic scheduling core. Industry-specific knowledge is contributed as **plugins, templates, and validated constraint packages** — built once, reused by everyone.

| Proprietary APS (closed) | Pharma Collective Platform |
|---|---|
| Black-box solver | Explainable constraint plugins |
| System-specific data model | Canonical data model |
| Consulting-only knowledge | Community-maintained packs |
| Single-vendor, single-industry | Multi-industry, system-agnostic |
| No validation trail | GxP-ready audit trail built-in |

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────┐
│                   planning-core                          │
│   Orders · Operations · Resources · Calendars            │
│   Materials · Inventory · Batches · Audit Trail          │
└──────────────────────┬──────────────────────────────────┘
                       │  canonical data model
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
  ┌─────────────┐ ┌──────────┐ ┌──────────────┐
  │ Constraints │ │Industry  │ │  Adapters    │
  │  Framework  │ │  Packs   │ │  ERP/MES/... │
  │  (plugins)  │ │Pharma/CGT│ │  CSV/Custom  │
  └─────────────┘ └──────────┘ └──────────────┘
         │
  ┌─────────────────────────────────┐
  │  Shopfloor Module (MQTT)        │
  │  Live line KPIs · shadow ingest │
  └─────────────────────────────────┘
         │
  ┌─────────────────────────────────┐
  │  AI Knowledge Layer             │
  │  "Why was this order blocked?"  │
  └─────────────────────────────────┘
```

## Who is it for?

- **Pharma & CGT planners** who need GxP-ready, transparent, auditable scheduling decisions
- **QA and validation teams** who need explainable plans with full audit trail
- **APS developers** who want to build on a solid, vendor-neutral foundation
- **ERP / MES / LIMS integrators** who want to contribute validated pharma planning knowledge
- **Researchers** building next-generation scheduling algorithms for regulated manufacturing
