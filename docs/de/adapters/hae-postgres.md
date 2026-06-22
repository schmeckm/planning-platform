# HAE PostgreSQL Adapter

Der HAE-Adapter (`hae.postgres`) liest normalisierte Werksdaten direkt aus der Hard Allocation Engine PostgreSQL-Datenbank und mappt sie ins PCP-Kanonmodell.

## Status

**v1.0.0** — Read-only-Brücke zwischen HAE (Level 1) und OPP-Planungskernel (Level 2).

| Eigenschaft | Wert |
|---|---|
| Adapter-ID | `hae.postgres` |
| Modus | Direktes SQL (kein HTTP) |
| Schreibzugriff | **Keiner** — OPP schreibt nie in `hap_*` |

## Konfiguration

In `apps/backend/.env`:

```env
PCP_DATABASE_URL=postgresql://opp:opp_dev_password@127.0.0.1:5433/opp
ALLOCATION_DATABASE_URL=postgresql://hap:hap-local-dev@127.0.0.1:5432/hap
```

Gleiche `ALLOCATION_DATABASE_URL` wie im HAE-Root-`.env`. Backend neu starten — `/health` muss `hae.postgres` listen.

## Daten laden

```bash
pnpm --filter @PCP/backend db:seed -- --adapter=hae.postgres

curl -X POST http://127.0.0.1:3100/api/pcp/v1/simulations/load-adapter \
  -H "Content-Type: application/json" \
  -d '{ "adapterId": "hae.postgres" }'
```

## Gemappte HAE-Tabellen

| HAE-Tabelle | PCP-Entität |
|---|---|
| `hap_packaging_orders` | `PlanningOrder` |
| `hap_packaging_lines`, `hap_resources` | `PlanningResource` |
| `hap_materials` | `PlanningMaterial` |
| `hap_batches` | `PlanningBatch` |

→ [Englische Version](/adapters/hae-postgres)
