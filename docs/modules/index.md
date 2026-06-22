# Operational Modules

Operational modules extend OPP with **live manufacturing visibility** — distinct from:

- **Industry packs** — business constraints (pharma, CGT, …)
- **Adapters** — ERP/MES master data into the canonical model

Operational modules read telemetry, aggregate KPIs, and expose UI surfaces for planners. They use **shadow storage** and never write to production ERP tables.

## Available modules

| Module | Package | UI | API |
|--------|---------|-----|-----|
| [Shopfloor Transparency](/modules/shopfloor) | `@PCP/planning-shopfloor` | `/planning/shopfloor-board`, MQTT admin | `/api/pcp/v1/shopfloor/*` |

## When to use which layer

```
ERP master data     →  IPlanningAdapter     →  simulations & constraints
Live MQTT KPIs      →  IShopfloorProvider   →  planner transparency (board)
```

See [Architecture — planning-shopfloor](/guide/architecture#planning-shopfloor) for the dependency graph.
