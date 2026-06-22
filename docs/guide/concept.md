# What is Pharma Collective Platform?

<div class="ci-leitbild">
  <img src="/images/opp-logo.png" alt="Bird flock — Collective Intelligence" width="320" />
  <p><strong>Collective Intelligence</strong> — many contributors, one direction. The flock is our guide: shared planning knowledge instead of isolated consulting silos.</p>
</div>

## The Problem

Planning knowledge in manufacturing is expensive, locked-in, and constantly re-invented.

Every company implementing a commercial Advanced Planning System pays large consulting fees to configure the same batch release rules, the same campaign sequencing logic, the same cleaning matrix constraints — that dozens of other companies already configured. When they switch systems, that knowledge is gone. When the consultant leaves, it lives only in slide decks.

**This is the same problem that software had before open source.**

## The Linux Kernel Analogy

The Linux Kernel is small, stable, and generic. It defines the contracts — system calls, driver interfaces, memory management primitives — and lets the community build everything else: device drivers, filesystems, network stacks, GPU support.

**Pharma Collective Platform (PCP) applies this model to manufacturing planning.**

```
Linux Kernel Model          Pharma Collective Platform
─────────────────────────   ─────────────────────────────────────
Kernel                   →  planning-core
Device Drivers           →  Constraint Plugins
Distribution Packages    →  Industry Packs (Pharma, CGT, Food…)
Hardware Interfaces      →  ERP/MES/WMS/LIMS Adapters
```

The core is small: Orders, Operations, Resources, Calendars, Materials, Batches, Constraints, Simulation Runs, Audit Trail.

The community builds everything on top.

## Core Principles

### 1. System-Agnostic by Design

The `planning-core` knows nothing about the internal data structures of any commercial planning system. All external systems are mapped into the **canonical data model** before they touch the core.

### 2. Constraints as Versioned Plugins

Every planning rule — "Don't schedule this operation if the cleaning validation for product family X has expired" — is a standalone, versioned, testable plugin.

```typescript
interface PlanningConstraint {
  id: string
  version: string
  evaluate(context: ConstraintContext): ConstraintResult
  explain(result: ConstraintResult): string
  testCases: ConstraintTestCase[]
}
```

### 3. Explainability {#explainability}

Every scheduling decision must be explainable. When a planner asks "Why was Order 4711 blocked?", the system returns a human-readable chain of constraints:

```
Order ORD-4711 blocked
├── CONSTRAINT: CleaningValidation [BLOCKING]
│   Reason: Product family PF-08 requires cleaning validation.
│   Last valid cleaning: 2026-05-12. Current date: 2026-06-21.
│   Action: Schedule CIP-001 cleaning run before this operation.
└── CONSTRAINT: ResourceCapacity [WARNING]
    Reason: Reactor R-04 is at 94% utilization on 2026-06-23.
    Action: Consider shifting to Reactor R-06 (67% utilization).
```

### 4. GxP-Ready by Default

The platform was designed from day one for regulated industries. The validation framework records:
- Which constraint version was active during a simulation run
- Which user triggered the run and when
- What the result was and why
- Electronic signature readiness

### 5. Community Contribution Model

Planning knowledge belongs to everyone. The contribution model requires every new constraint or industry pack to include:
- Documentation explaining the business purpose
- Reference to regulatory / business requirement (URS/FS/DS)
- At least 3 automated test cases
- A sample dataset for reproducibility

## What PCP is NOT

| PCP is | PCP is NOT |
|---|---|
| A scheduling kernel and plugin framework | A full ERP system |
| Canonical data model for planning | A replacement for your MES/WMS |
| Explainable constraint evaluation | A black-box optimization solver |
| Open source, system-agnostic | Tied to any specific commercial system |
| Designed for regulated industries | Only for pharma |

## Project Status

PCP is in active early development (v0.1.0). The core data model and constraint framework are stable. Industry packs and adapters are being built by contributors.

→ [Get Started](/guide/getting-started) with your first installation.
→ [Contribute](/community/contributing) your first constraint.
