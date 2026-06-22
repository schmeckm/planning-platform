# SAP S/4HANA Adapter

The SAP S/4HANA adapter maps production orders, work centers, shift sequences, and inventory from S/4HANA into the PCP canonical data model.

## Status

🚧 **In development** — contributions welcome. See [Build an Adapter](/adapters/custom).

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

- PP/DS-specific fields (like sequence-dependent setup matrices) require a separate PP/DS adapter
- Batch classification data (`KLAH`, `AUSP`) must be fetched via Classification Service — not included in base order fetch
- Shelf life data requires integration with Batch Management (`MCH1`, `MCHA`)

## Contributing

To contribute to this adapter, see the [build guide](/adapters/custom) and open a PR tagged `adapter:sap-s4`.
