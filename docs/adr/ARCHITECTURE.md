# Architecture Decision Records

## ADR-001: Canonical Data Model

**Decision**: All domain types (Order, Resource, Material, Batch, …) are defined
in `@PCP/planning-core` and are ERP-agnostic. External systems may never
directly pass their native data structures into the planning kernel.

**Rationale**: Prevents vendor lock-in. Proprietary field names and native data structures
must all be mapped by adapters. The kernel stays clean.

## ADR-002: Plugin Interface Over Inheritance

**Decision**: Constraints implement `IConstraintPlugin` via composition, not class
inheritance. The interface is intentionally minimal: `metadata`, `evaluate()`, `selfTest()`.

**Rationale**: Enables any language/framework to implement constraints in future.
The interface is the stable API; the implementation can change independently.

## ADR-003: Shadow Planning

**Decision**: All simulation results are written only to the PCP database.
No scheduling result is ever written back to the source ERP system.

**Rationale**: GxP compliance. The ERP is the system of record for production data.
The PCP is the system of record for planning decisions. These must be separate.

## ADR-004: Defensive Engine Design

**Decision**: The constraint engine catches all errors from individual plugin
evaluations and returns a failed constraint result instead of letting the exception
propagate. A crashing plugin never crashes the engine.

**Rationale**: In a live factory environment, a bug in one community constraint
must never bring down the entire scheduling service.

## ADR-005: Explainable Results

**Decision**: Every constraint evaluation result must contain:
- `message`: One sentence (machine-readable summary)
- `explanation`: Human-readable paragraph for planners
- `correctionHint`: Actionable suggestion for resolving the constraint

**Rationale**: Planners must understand WHY an order is blocked, not just that
it is blocked. This is also required for GMP deviation investigations.

## ADR-006: Versioned Constraints

**Decision**: Every constraint plugin carries a semantic version. The engine records
both `constraintId` and `constraintVersion` in every evaluation result.

**Rationale**: When the same simulation is replayed months later (audit, deviation
investigation), the exact constraint logic that was active must be traceable.

## ADR-007: Self-Test Protocol

**Decision**: Every constraint plugin must implement `selfTest()`, which runs a
set of built-in test cases covering at minimum: one pass scenario and one fail scenario.

**Rationale**: Enables IQ/OQ/PQ validation without external test data. The platform
can generate validation evidence automatically from plugin self-tests.
