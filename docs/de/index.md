---
layout: home

hero:
  name: "Pharma Collective Platform"
  text: "Der Planungskern für die Pharmaplanung"
  tagline: >
    Offene Planung für die Pharmaproduktion — modular, erklärbar, GMP-tauglich.
    Collective Intelligence: viele Planer und Entwickler, ein gemeinsamer
    Planungskern. Keine Black Box.
  image:
    src: /images/opp-logo.png
    alt: Vogelschwarm — Collective Intelligence für offene Pharmaplanung
  actions:
    - theme: brand
      text: Erste Schritte
      link: /de/guide/getting-started
    - theme: alt
      text: Was ist PCP?
      link: /de/guide/concept
    - theme: alt
      text: GitHub
      link: https://github.com/schmeckm/planningplatform

features:
  - icon:
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2H8a2 2 0 0 0-2 2v1a2 2 0 0 1-2 2H3"/><path d="M12 2h4a2 2 0 0 1 2 2v1a2 2 0 0 0 2 2h1"/><rect x="6" y="9" width="12" height="13" rx="2"/><path d="M9 13h6M9 17h4"/></svg>'
    title: Plugin-basierte Constraints
    details: >
      Jede Planungsregel ist ein versioniertes, testbares und erklärbares Plugin.
      Einen Constraint einmal schreiben — industrieübergreifend und systemunabhängig wiederverwenden.
    link: /de/constraints/interface
    linkText: Ersten Constraint schreiben

  - icon:
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="13" width="5" height="9"/><rect x="9" y="9" width="5" height="13"/><rect x="16" y="5" width="5" height="17"/><path d="M2 13 7 8l5 3 5-6 5-3"/></svg>'
    title: Industrie-Packs
    details: >
      Pharma GMP, Cell & Gene Therapy, Verpackung, Lebensmittel —
      vorgefertigte, validierte und community-gepflegte Planungsbausteine.
    link: /de/industries/pharma
    linkText: Industrie-Packs durchsuchen

  - icon:
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><path d="M6 18H3M21 6h-3M15 18h-6M18 9v6M18 3v0"/><path d="M9 6H6a3 3 0 0 0 0 6h3"/></svg>'
    title: ERP / MES Adapter
    details: >
      Externe Systeme werden über Adapter auf das kanonische Datenmodell abgebildet —
      der Planungskern bleibt systemunabhängig.
    link: /de/adapters/overview
    linkText: Alle Adapter ansehen

  - icon:
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 10h8M8 14h5"/></svg>'
    title: Erklärbare Planung
    details: >
      Jeder blockierte Auftrag, jede Constraint-Verletzung liefert eine verständliche Begründung.
      Planer und QA können jederzeit fragen: „Warum wurde dieser Auftrag blockiert?"
    link: /de/guide/concept#erklaerbarkeit
    linkText: Wie Erklärbarkeit funktioniert

  - icon:
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>'
    title: GxP & Validierung
    details: >
      Eingebautes Validierungs-Framework mit Anforderungs-IDs, IQ/OQ/PQ-Referenzen,
      versionierten Regeln und vollständigem Audit-Trail für regulierte Industrien.
    link: /de/industries/pharma#validierung
    linkText: Pharma-Validierungsleitfaden

  - icon:
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M7 8h4M7 11h10M7 14h6"/></svg>'
    title: Shopfloor-Transparenz
    details: >
      Live-Einblick in Verpackungslinien über MQTT: OEE, Termintreue, WIP-Aufträge
      und Störungen — nur Shadow-Ingest, volle Parität zum legacy HAE-Portal.
    link: /de/modules/shopfloor
    linkText: Shopfloor-Modul

  - icon:
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="3"/><circle cx="17" cy="5" r="2"/><circle cx="17" cy="19" r="2"/><path d="M12 7h2a4 4 0 0 1 4 4v1M9 10a4 4 0 0 0-4 4v2h8v-2a4 4 0 0 0-3-3.87M15 17v-1.5a2 2 0 0 1 2-2"/></svg>'
    title: Community-Beitragsmodell
    details: >
      PR-Vorlagen, verbindliche Testfälle, Dokumentationsanforderungen,
      Fachexperten-Review — Planungswissen, das allen gehört.
    link: /de/community/contributing
    linkText: Wie man beiträgt
---

## Warum Pharma Collective Platform?

Planungswissen in der **Pharmaproduktion** ist **in teuren Consulting-Projekten für proprietäre Advanced Planning Systeme eingeschlossen**. Jedes Werk implementiert dieselbe Batch-Release-Logik, dieselben Kampagnen-Sequenzierungsregeln, dieselben Reinigungsmatrix-Constraints — immer wieder neu, zu enormen Kosten.

**Die Pharma Collective Platform ändert das.** Inspiriert vom Linux-Kernel-Modell stellt PCP einen kleinen, stabilen, generischen Planungskern bereit. Industrie-spezifisches Wissen wird als **Plugins, Templates und validierte Constraint-Pakete** beigetragen — einmal gebaut, von allen genutzt.

| Proprietäres APS (geschlossen) | Pharma Collective Platform |
|---|---|
| Black-Box-Solver | Erklärbare Constraint-Plugins |
| Systemspezifisches Datenmodell | Kanonisches Datenmodell |
| Nur über Consulting verfügbar | Community-gepflegte Packs |
| Einzelanbieter, eine Industrie | Multi-Industrie, systemunabhängig |
| Kein Validierungs-Trail | GxP-ready Audit-Trail eingebaut |

## Architektur auf einen Blick

```
┌─────────────────────────────────────────────────────────┐
│                   planning-core                          │
│   Aufträge · Operationen · Ressourcen · Kalender         │
│   Materialien · Inventar · Chargen · Audit-Trail         │
└──────────────────────┬──────────────────────────────────┘
                       │  kanonisches Datenmodell
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
  ┌─────────────┐ ┌──────────┐ ┌──────────────┐
  │ Constraints │ │Industrie-│ │   Adapter    │
  │  Framework  │ │  Packs   │ │ERP/MES/LIMS..|
  │  (Plugins)  │ │Pharma/CGT│ │  ERPNext/CSV │
  └─────────────┘ └──────────┘ └──────────────┘
         │
  ┌─────────────────────────────────┐
  │  KI-Wissensschicht              │
  │  „Warum wurde dieser Auftrag    │
  │   blockiert?"                   │
  └─────────────────────────────────┘
```

## Für wen ist PCP?

- **Pharma- & CGT-Planer**, die GxP-fähige, transparente und nachvollziehbare Planungsentscheidungen brauchen
- **QA- und Validierungsteams**, die erklärbare Pläne mit vollständigem Audit Trail benötigen
- **APS-Entwickler**, die auf einem soliden, systemunabhängigen Fundament aufbauen möchten
- **ERP- / MES- / LIMS-Integratoren**, die validiertes Pharmaplanungs-Wissen beisteuern möchten
- **Forscher**, die Algorithmen der nächsten Generation für regulierte Fertigung entwickeln
