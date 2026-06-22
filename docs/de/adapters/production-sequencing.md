# Production Sequencing Adapter

Herstellerneutraler Adapter für **detaillierte Fertigungsrouten**, **folgeabhängige Rüstzeiten** und **Pegging**.

Siehe die englische Dokumentation: [Production Sequencing Adapter](/adapters/production-sequencing).

**Adapter-ID:** `production.sequencing`  
**Quellsystem:** `PROD-SEQ`

```bash
curl -X POST http://localhost:3100/api/pcp/v1/simulations/load-adapter \
  -H "Content-Type: application/json" \
  -d '{ "adapterId": "production.sequencing" }'
```
