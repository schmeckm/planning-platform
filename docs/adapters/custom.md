# Build an Adapter

This guide walks through creating a custom adapter for any ERP, MES, WMS, or LIMS system.

## Step 1 — Create the Package

```bash
mkdir packages/adapter-<system>
```

`package.json`:
```json
{
  "name": "@PCP/adapter-<system>",
  "version": "0.1.0",
  "peerDependencies": {
    "@PCP/planning-core": "^0.1.0",
    "@PCP/planning-adapters": "^0.1.0"
  }
}
```

## Step 2 — Implement the Interface

```typescript
import type { PlanningDataAdapter, Order, Resource, Calendar, InventoryLevel } from '@PCP/planning-adapters'

export class MySystemAdapter implements PlanningDataAdapter {
  readonly systemId: string
  readonly systemType = 'MY_SYSTEM'

  constructor(private readonly config: MySystemConfig) {
    this.systemId = `my-system-${config.instance}`
  }

  async fetchOrders(filter: OrderFilter): Promise<Order[]> {
    const raw = await this.client.getProductionOrders(filter)
    return raw.map(this.mapOrder)
  }

  async fetchResources(filter: ResourceFilter): Promise<Resource[]> {
    const raw = await this.client.getWorkCenters(filter)
    return raw.map(this.mapResource)
  }

  async fetchCalendars(resourceIds: string[]): Promise<Calendar[]> {
    // ...
  }

  async fetchInventory(materialIds: string[]): Promise<InventoryLevel[]> {
    // ...
  }

  private mapOrder(raw: MySystemOrder): Order {
    return {
      id: `MY-${raw.jobId}`,
      externalId: raw.jobId,
      materialId: raw.partNumber,
      quantity: raw.targetQty,
      unit: raw.qtyUnit,
      earliestStart: new Date(raw.scheduledStart),
      latestEnd: new Date(raw.dueDate),
      priority: raw.urgencyLevel ?? 5,
      status: this.mapStatus(raw.status),
      operations: [],
      tags: {
        'my-system.jobId': raw.jobId,
        'my-system.workOrder': raw.workOrderNumber,
      },
    }
  }
}
```

## Step 3 — Document the Field Mapping

Create a field mapping table in your adapter's documentation page. Every source field must be documented, including fields that are not mapped and why.

## Step 4 — Write Tests

```typescript
describe('MySystemAdapter', () => {
  it('maps job status COMPLETE to OrderStatus.COMPLETED', () => {
    const adapter = new MySystemAdapter(config)
    const result = adapter['mapStatus']('COMPLETE')
    expect(result).toBe('COMPLETED')
  })
})
```

## Step 5 — Open a PR

Tag your PR with `adapter:<system-name>`. Document which version of the external system was tested against.
