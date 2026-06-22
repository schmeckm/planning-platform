---
layout: home

hero:
  name: "Entwickler-Hub"
  text: "Plattform erweitern — Kernel nicht forken"
  tagline: >
    Collective Intelligence für die Pharmaplanung — viele Beitragende, eine Richtung.
    Open Source (Apache-2.0): Constraints, Industry Packs und Adapter auf einem
    stabilen Kernel bauen und zur Community beitragen.
  image:
    src: /images/opp-logo.png
    alt: Vogelschwarm — Collective Intelligence für offene Pharmaplanung
  actions:
    - theme: brand
      text: Lokal starten
      link: /de/guide/getting-started
    - theme: alt
      text: Was du ändern darfst
      link: /de/developers/extension-model
    - theme: alt
      text: GitHub
      link: https://github.com/schmeckm/planningplatform

features:
  - title: Was du ändern kannst (und was nicht)
    details: >
      Klare Grenzen: Plugins und Adapter ja, Kernel-Eingriffe nur mit Maintainer-Review.
      Shadow-first, Abhängigkeitsregeln und GMP-Integrität erklärt.
    link: /de/developers/extension-model
    linkText: Erweiterungsmodell

  - title: Addons & Module bauen
    details: >
      Schritt-für-Schritt: Constraints, Industry Packs, ERP/MES-Adapter
      und operative Module wie Shopfloor-Transparenz.
    link: /de/developers/build-addons
    linkText: Addon-Anleitung

  - title: Beitragen
    details: >
      Good-first-issues, PR-Checkliste, Domain-Experten-Review und
      Entscheidungsfindung in einem offenen Planungs-Commons.
    link: /de/developers/contribute
    linkText: Contribution Guide

  - title: Architektur
    details: >
      Monorepo-Schichten — planning-core, Constraint-Engine, Industry Packs,
      Adapter, API und eingebettetes Cockpit.
    link: /de/guide/architecture
    linkText: Architektur-Leitfaden

  - title: Releases
    details: >
      Semantic Versioning, Release Notes für Nutzer, Changelog für Upgrades
      und die Maintainer-Checkliste.
    link: /de/conventions/release-notes
    linkText: Release-Prozess

  - title: Konventionen
    details: >
      TypeScript strict, Conventional Commits, Dokumentationspflicht,
      Icons und PR-Templates — die Qualitätslatte für Merges.
    link: /de/conventions/code-style
    linkText: Entwickler-Konventionen
---

## Ebenen der Hilfe

| Ebene | Ort | Für |
|---|---|---|
| **In-App-Hilfe** | `/planning/help` | Planer — Workflow, Module, Glossar |
| **Platform** | `/platform#documentation` | Business-Prozesse, Pharma-Domänen |
| **Entwickler-Hub** (hier) | VitePress `/de/developers/` | IT, Integratoren, Contributors |

## Stack im Überblick

```
planning-core          ← Kernel (kanonisches Modell, Simulation)
planning-constraints   ← Plugin-Engine
planning-pharma / cgt  ← Industry Packs
planning-adapters      ← ERP/MES/LIMS-Mapping
apps/backend · frontend · docs  ← HTTP-API, UI, Dokumentation
```

**HAE** (Repository-Root) ist die ausführbare Allokations-/Scheduling-Schicht im Portal. **OPP** (`open-planning-platform/`) ist der offene Kernel.

## Lizenz & Community

- **Code:** Apache 2.0
- **Doku:** CC BY 4.0
- **Governance:** [Lazy Consensus](/de/community/governance) für Routine; Kernel-Änderungen brauchen explizite Maintainer-Freigabe

→ Zurück zur [Platform-Dokumentation](/platform#documentation) für planerorientierte Inhalte.
