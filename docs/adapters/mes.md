# MES Adapter

The **Shopfloor Transparency Module** (`@PCP/planning-shopfloor`) is the reference implementation for live MES integration via MQTT. See [Shopfloor Module](/modules/shopfloor) for full documentation.

## What is implemented today

| Capability | Status |
|------------|--------|
| MQTT ingest (subscribe, shadow storage) | ✅ HAE backend |
| Live line board (OEE, adherence, WIP) | ✅ Cockpit embed |
| Topic bindings & broker admin | ✅ Cockpit admin tab |
| WIP simulation (demo / test) | ✅ HAE backend |
| PCP API surface `/api/pcp/v1/shopfloor` | ✅ OPP API |
| Canonical types in `@PCP/planning-shopfloor` | ✅ Package |

## What is planned

The generic MES adapter base class will map **master data** (work centers, orders, confirmations) from MES systems into the canonical planning model. Specific implementations (Siemens Opcenter, Rockwell Plex, Tulip, etc.) will extend this base.

**Live telemetry** (line state, OEE, scrap) remains in the shopfloor module — separate from ERP-style adapter fetch methods.

## Architecture split

```
MES master data  ──►  IPlanningAdapter.fetchResources() / fetchOrders()
Live MQTT KPIs   ──►  IShopfloorProvider.getBoard()
```

Both feed planner transparency; only adapter data enters simulation constraints today.

Want to extend MES integration? See [Build an Adapter](/adapters/custom) and [Shopfloor Module](/modules/shopfloor).
