# Roadmap

**Stand:** 2026-06-22

## Phase 1 — Foundation ✓ abgeschlossen

Kernmodell, 7 Constraints (Generic + Pharma + CGT), Mock-Adapter, REST/Swagger, Vue-Board, Docker, CI.

## Phase 2 — Adapter & Ökosystem (in Arbeit)

### Erledigt

- [x] PostgreSQL-Persistenz (OPP Shadow-Store `pcp_*`)
- [x] HAE-Adapter `hae.postgres` (read-only `hap_*`)
- [x] SAP S/4HANA v0.2 (`sap.s4hana` — Fixture + OData)
- [x] ERPNext v0.1 (`erpnext` — Fixture + REST API)
- [x] Constraint-Scoring in Simulationen
- [x] End-to-End: HAE Postgres → OPP → Simulation

### Als Nächstes

- [ ] SAP PP/DS, TRIC, Cleaning Matrix, Campaign Sequencing
- [ ] CGT: Kryo-Lager, Kurier-Fenster
- [ ] OPP ↔ OR-Tools-Brücke (HAE-Sidecar :8010 existiert)

## Phase 3 — Validierung & GxP

IQ/OQ/PQ, eSign, versionierte Simulationsläufe, Validierungsberichte.

## Phase 4 — Intelligence

CP-SAT in OPP, pgvector, Neo4j, Szenario-Vergleich.

→ [Vollständige englische Roadmap](/community/roadmap) · [Changelog](/community/changelog)
