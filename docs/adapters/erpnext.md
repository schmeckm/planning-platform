# ERPNext Adapter

The ERPNext adapter maps Work Orders, Workstations, Items, Batches, and Bin stock from ERPNext (Frappe REST API) into the PCP canonical data model.

## Status

**v0.1.0** — Fixture mode (demo without ERPNext instance) + REST API mode for live sites.

| Mode | When | Adapter ID |
|---|---|---|
| **Fixture** | Default (no `ERPNEXT_BASE_URL`) | `erpnext` |
| **API** | `ERPNEXT_BASE_URL` + API token | `erpnext` |

```bash
pnpm --filter @PCP/backend db:seed -- --adapter=erpnext

curl -X POST http://localhost:3100/api/pcp/v1/simulations/load-adapter \
  -H "Content-Type: application/json" \
  -d '{ "adapterId": "erpnext" }'
```

## Authentication (API mode)

Generate an API Key in ERPNext: **User → API Access → Generate Keys**

```env
ERPNEXT_BASE_URL=https://erp.example.com
ERPNEXT_API_KEY=your-key
ERPNEXT_API_SECRET=your-secret
ERPNEXT_COMPANY=Pharma Collective GmbH
ERPNEXT_ADAPTER_MODE=api
```

```typescript
import { createErpNextAdapter } from '@PCP/planning-adapters'

const adapter = createErpNextAdapter({
  baseUrl: 'https://erp.example.com',
  apiKey: process.env.ERPNEXT_API_KEY,
  apiSecret: process.env.ERPNEXT_API_SECRET,
  company: 'Pharma Collective GmbH',
})
```

## Field Mapping

### Work Order → `PlanningOrder`

| ERPNext Field | PCP Field |
|---|---|
| `name` | `externalId` |
| `production_item` | `materialId` |
| `qty` | `quantity` |
| `stock_uom` | `unit` |
| `planned_start_date` | `earliestStart` |
| `planned_end_date` | `latestFinish` |
| `status` | `status` (mapped via lifecycle) |
| Work Order Operation | `operations[]` |

### Workstation → `PlanningResource`

| ERPNext Field | PCP Field |
|---|---|
| `name` | `id` (prefixed `ERP-WS-`) |
| `workstation_name` | `name` |

## SAP live connection check

For SAP S/4 OData systems:

```bash
SAP_BASE_URL=https://... SAP_USERNAME=... SAP_PASSWORD=... \
  pnpm --filter @PCP/planning-adapters verify:sap
```

## Contributing

See [Build an Adapter](/adapters/custom) and open a PR tagged `adapter:erpnext`.
