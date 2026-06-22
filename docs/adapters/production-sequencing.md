# Production Sequencing Adapter

Vendor-neutral adapter for **detailed production routings**, **sequence-dependent setup times**, and **order pegging** — the data shape used by advanced planning / detailed scheduling systems, without referencing any ERP vendor trademark.

## Status

**v0.1.0** — Fixture mode (demo without live ERP) + generic REST API hook (optional).

| Mode | When | Adapter ID |
|---|---|---|
| **Fixture** | Default (no `PRODUCTION_SEQUENCING_BASE_URL`) | `production.sequencing` |
| **API** | `PRODUCTION_SEQUENCING_BASE_URL` set | `production.sequencing` |

```bash
pnpm --filter @PCP/backend db:seed -- --adapter=production.sequencing

curl -X POST http://localhost:3100/api/pcp/v1/simulations/load-adapter \
  -H "Content-Type: application/json" \
  -d '{ "adapterId": "production.sequencing" }'
```

## Fixture demo scenario

| Order | Content |
|---|---|
| `PS-ORD-090` | API synthesis (feeder) |
| `PS-ORD-100` | FG tablets — 3 operations, pegged to `PS-ORD-090`, sequence-dependent setup |
| `PS-ORD-110` | Different FG — changeover setup from previous product on shared line |

Sequence-dependent setup is applied via an internal matrix (`previousMaterialId` → extra setup minutes on the first operation).

## Environment variables

| Variable | Purpose |
|---|---|
| `PRODUCTION_SEQUENCING_BASE_URL` | Optional REST API root (enables API mode) |
| `PRODUCTION_SEQUENCING_PLANT` | Plant filter (default `PLANT-01`) |
| `PRODUCTION_SEQUENCING_MODE` | `fixture` or `api` |

## Canonical mapping

| Source concept | PCP field |
|---|---|
| Production order | `PlanningOrder` + `PlanningOperation[]` |
| Work center | `PlanningResource` |
| Pegging link | `order.metadata.peggedSupplyOrderId` |
| Sequence group | `order.tags.sequenceGroup` |
| Setup matrix result | `order.metadata.sequenceDependentSetupMinutes` |

## Legal note

This adapter is **not affiliated with SAP, Oracle, or any ERP vendor**. It uses vendor-neutral naming (`production.sequencing`, `PROD-SEQ`) and generic REST configuration only.

## See also

- [SAP S/4HANA Adapter](/adapters/sap-s4) — order master / stock (separate adapter)
- [Getting Started](/guide/getting-started)
