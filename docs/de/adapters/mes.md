# MES-Adapter

Das **Shopfloor-Transparenz-Modul** (`@PCP/planning-shopfloor`) ist die Referenzimplementierung für Live-MES-Integration über MQTT. Vollständige Dokumentation: [Shopfloor-Modul](/de/modules/shopfloor).

## Was heute implementiert ist

| Fähigkeit | Status |
|-----------|--------|
| MQTT-Ingest (Subscribe, Shadow-Storage) | ✅ HAE-Backend |
| Live-Linien-Board (OEE, Adherence, WIP) | ✅ Cockpit-Embed |
| Topic-Bindings & Broker-Admin | ✅ Cockpit-Admin-Tab |
| WIP-Simulation (Demo / Test) | ✅ HAE-Backend |
| PCP-API `/api/pcp/v1/shopfloor` | ✅ OPP API |
| Kanonische Typen in `@PCP/planning-shopfloor` | ✅ Package |

## Geplant

Die generische MES-Adapter-Basisklasse mappt **Stammdaten** (Arbeitsplätze, Aufträge, Rückmeldungen) aus MES-Systemen ins kanonische Planungsmodell. Spezifische Implementierungen (Siemens Opcenter, Rockwell Plex, Tulip, …) erweitern diese Basis.

**Live-Telemetrie** (Linienstatus, OEE, Ausschuss) bleibt im Shopfloor-Modul — getrennt von ERP-artigen Adapter-Fetch-Methoden.

## Architektur-Trennung

```
MES-Stammdaten  ──►  IPlanningAdapter.fetchResources() / fetchOrders()
Live-MQTT-KPIs  ──►  IShopfloorProvider.getBoard()
```

Beides liefert Planungstransparenz; aktuell fließen nur Adapter-Daten in Simulations-Constraints ein.

MES-Integration erweitern? Siehe [Adapter bauen](/de/adapters/custom) und [Shopfloor-Modul](/de/modules/shopfloor).
