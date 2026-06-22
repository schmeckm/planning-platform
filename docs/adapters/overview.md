# Adapters Overview

Adapters connect external systems (ERP, MES, WMS, LIMS) to Pharma Collective Platform's canonical data model. **The planning core never calls external systems directly** — all data flows through adapters.

## Design Principle

```
External System          Adapter                  planning-core
────────────────   →   ──────────────────   →   ────────────────
SAP order table         maps field by field       Order { id, materialId, ... }
MES operation log       transforms timestamps     Operation { id, duration, ... }
LIMS batch result       maps status codes         Batch { status: 'RELEASED' }
```

The adapter is responsible for:
1. Authenticating with the external system
2. Fetching the required data
3. Mapping every source field to the canonical model
4. Documenting fields that cannot be mapped (limitations)

## Adapter Interface

```typescript
export interface PlanningDataAdapter {
  readonly systemId: string     // e.g. 'sap-s4-prod-1000'
  readonly systemType: string   // e.g. 'SAP_S4HANA'

  fetchOrders(filter: OrderFilter): Promise<Order[]>
  fetchResources(filter: ResourceFilter): Promise<Resource[]>
  fetchCalendars(resourceIds: string[]): Promise<Calendar[]>
  fetchInventory(materialIds: string[]): Promise<InventoryLevel[]>
  fetchBatches(orderIds: string[]): Promise<Batch[]>
}
```

## Available Adapters

| Adapter | Package | Status |
|---|---|---|
| SAP S/4HANA | `@PCP/adapter-sap-s4` | 🚧 In development |
| Production Sequencing | `@PCP/planning-adapters` (`production.sequencing`) | ✅ v0.1 |
| MES (generic) | `@PCP/adapter-mes` | 📋 Planned |
| LIMS (generic) | `@PCP/adapter-lims` | 📋 Planned |
| ERPNext | `@PCP/adapter-erpnext` | 📋 Planned |
| CSV / Excel | `@PCP/adapter-csv` | ✅ Available (for development) |

## Operational Modules

Operational modules provide **live shopfloor telemetry** — separate from ERP/MES adapters that supply master data for simulations.

| Module | Package | Status | Documentation |
|---|---|---|---|
| Shopfloor MQTT | `@PCP/planning-shopfloor` | ✅ Available (HAE bridge) | [Shopfloor Module](/modules/shopfloor) |

The shopfloor module includes:

- **Shopfloor Addon Board** at `/planning/shopfloor-board` — OEE, adherence, WIP, disturbances
- **MQTT admin** at `/planning/admin` → tab **Shopfloor MQTT** — broker, bindings, simulation
- **PCP API** at `/api/pcp/v1/shopfloor/*` and legacy proxy at `/api/v1/shopfloor/*`

Live telemetry uses **shadow storage only** — it never writes to ERP or planning master data.

## CSV / Excel Adapter

The CSV adapter is available for local development and testing. It reads orders, resources, calendars, and inventory from CSV files.

```typescript
import { CsvAdapter } from '@PCP/adapter-csv'

const adapter = new CsvAdapter({
  ordersFile: './mock-data/orders.csv',
  resourcesFile: './mock-data/resources.csv',
  calendarsFile: './mock-data/calendars.csv',
  inventoryFile: './mock-data/inventory.csv',
})
```

CSV format is documented in [`/adapters/csv`](/adapters/csv).

## Using Multiple Adapters

You can combine data from multiple systems. For example, orders from SAP and capacity from a custom MES:

```typescript
const engine = new PlanningEngine({
  adapters: [
    new SapS4Adapter({ client: sapClient }),
    new MesAdapter({ baseUrl: 'https://mes.internal/api' }),
  ],
  mergeStrategy: 'resource-overrides-erp', // MES resource data takes precedence
})
```

## Building a Custom Adapter

See [Build an Adapter](/adapters/custom) for a complete guide.
