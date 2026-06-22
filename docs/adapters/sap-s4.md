# SAP S/4HANA Adapter

The SAP S/4HANA adapter maps production orders, work centers, shift sequences, and inventory from S/4HANA into the PCP canonical data model.

## Status

**v0.2.0** — Fixture mode (demo without SAP credentials) + OData mode for live S/4HANA systems.

| Mode | When | Adapter ID |
|---|---|---|
| **Fixture** | Default (no `SAP_BASE_URL`) | `sap.s4hana` |
| **OData** | `SAP_BASE_URL` + credentials set | `sap.s4hana` |

```bash
# Load SAP fixture data into OPP shadow DB
pnpm --filter @PCP/backend db:seed -- --adapter=sap.s4hana

# Or via API
curl -X POST http://localhost:3100/api/pcp/v1/simulations/load-adapter \
  -H "Content-Type: application/json" \
  -d '{ "adapterId": "sap.s4hana" }'
```

## Authentication (OData mode)

```typescript
import { createSapS4Adapter } from '@PCP/planning-adapters'

const adapter = createSapS4Adapter({
  baseUrl: 'https://your-system.s4hana.ondemand.com',
  plant: '1000',
  client: '100',
  username: process.env.SAP_USERNAME,
  password: process.env.SAP_PASSWORD,
})
```

Environment variables: `SAP_BASE_URL`, `SAP_CLIENT`, `SAP_USERNAME`, `SAP_PASSWORD`, `SAP_PLANT`, `SAP_ADAPTER_MODE`.

## Field Mapping

### Order → `planning-core` Order

| SAP Field | PCP Field | Notes |
|---|---|---|
| `AUFNR` | `externalId` | SAP Production Order number |
| `MATNR` | `materialId` | Material number |
| `GMEIN` / `ERFMG` | `quantity` + `unit` | Target quantity |
| `GSTRP` | `earliestStart` | Scheduled start date |
| `GLTRP` | `latestEnd` | Scheduled finish date |
| `PRIOK` | `priority` | MRP priority |
| `AUFSTATUS` | `status` | CRTD→CREATED, REL→RELEASED, etc. |
| `WERKS` | `tags['sap.plant']` | Plant |
| `AUFART` | `tags['sap.orderType']` | Order type (PP01, PP02, etc.) |

### Work Center → `planning-core` Resource

| SAP Field | PCP Field | Notes |
|---|---|---|
| `ARBPL` | `id` | Work center ID |
| `ARBPL` | `name` | Work center name |
| `KAPID` | `capacity` | Capacity category |
| `WERKS` | `tags['sap.plant']` | Plant |

### Shift Sequence → `planning-core` Calendar

SAP shift sequences (`SCHICHT`) are mapped to PCP `Shift[]` via the shift definition tables.

## Authentication

The adapter uses SAP OData API (S/4HANA Cloud) or RFC/BAPI (on-premise):

```typescript
const adapter = new SapS4Adapter({
  baseUrl: 'https://your-system.s4hana.ondemand.com',
  apiKey: process.env.SAP_API_KEY,
  plant: '1000',
})
```

## Known Limitations

- PP/DS-specific fields (like sequence-dependent setup matrices) are covered by the vendor-neutral [Production Sequencing Adapter](/adapters/production-sequencing)
- Batch classification data (`KLAH`, `AUSP`) must be fetched via Classification Service — not included in base order fetch
- Shelf life data requires integration with Batch Management (`MCH1`, `MCHA`)

## Contributing

To contribute to this adapter, see the [build guide](/adapters/custom) and open a PR tagged `adapter:sap-s4`.
