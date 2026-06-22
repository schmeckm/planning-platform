# HAE PostgreSQL Adapter

The HAE adapter (`hae.postgres`) reads normalized plant data directly from the Hard Allocation Engine PostgreSQL database and maps it into the PCP canonical model.

## Status

**v1.0.0** — Read-only bridge between HAE Level 1 and OPP Level 2 planning kernel.

| Property | Value |
|---|---|
| Adapter ID | `hae.postgres` |
| Mode | Direct SQL (no HTTP roundtrip) |
| Write access | **None** — OPP never writes to `hap_*` tables |

## When to use

- HAE monorepo development with `PERSISTENCE_PROVIDER=postgres`
- Loading real packaging orders, lines, materials, and batches into OPP shadow planning
- End-to-end demo: HAE plant data → constraint simulation in OPP

## Configuration

In `apps/backend/.env`:

```env
# OPP shadow store (required for persistence)
PCP_DATABASE_URL=postgresql://opp:opp_dev_password@127.0.0.1:5433/opp

# HAE read adapter (same DB as HAE backend)
ALLOCATION_DATABASE_URL=postgresql://hap:hap-local-dev@127.0.0.1:5432/hap
```

Use the same `ALLOCATION_DATABASE_URL` as in the HAE root `.env`.

Restart the OPP backend after changing `.env`. The health endpoint should list `hae.postgres`:

```bash
curl http://127.0.0.1:3100/api/pcp/v1/health
```

## Load data

```bash
# Via seed script
pnpm --filter @PCP/backend db:seed -- --adapter=hae.postgres

# Via API
curl -X POST http://127.0.0.1:3100/api/pcp/v1/simulations/load-adapter \
  -H "Content-Type: application/json" \
  -d '{ "adapterId": "hae.postgres" }'
```

Then run a simulation:

```bash
curl -X POST http://127.0.0.1:3100/api/pcp/v1/simulations \
  -H "Content-Type: application/json" \
  -d '{ "name": "HAE Live", "triggeredBy": "planner" }'
```

## HAE tables mapped

| HAE table | PCP entity |
|---|---|
| `hap_packaging_orders` | `PlanningOrder` |
| `hap_packaging_lines`, `hap_resources` | `PlanningResource` |
| `hap_materials` | `PlanningMaterial` |
| `hap_batches` | `PlanningBatch` |
| `hap_line_qualifications` | Resource qualifications |
| `hap_shift_calendars` | `WorkingCalendar` |

## Architecture

```
HAE Postgres (:5432, hap_*)
        ↓ read-only SQL
  hae.postgres adapter
        ↓ canonical mapping
  OPP shadow Postgres (:5433, pcp_*)
        ↓
  ConstraintEngine → SimulationRun
```

## Known limitations

- Read-only: scheduling results stay in `pcp_*` tables
- Requires HAE normalized schema (`seed:normalized` / `PERSISTENCE_PROVIDER=postgres`)
- Mixed loads: calling `load-adapter` for another adapter after HAE does not clear previous orders

## See also

- [Getting Started — HAE integration](/guide/getting-started#hae-integration-monorepo)
- [SAP S/4HANA Adapter](/adapters/sap-s4)
- [ERPNext Adapter](/adapters/erpnext)
