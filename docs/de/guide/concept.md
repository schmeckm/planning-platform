# Was ist die Pharma Collective Platform?

<div class="ci-leitbild">
  <img src="/images/opp-logo.png" alt="Vogelschwarm — Collective Intelligence" width="320" />
  <p><strong>Collective Intelligence</strong> — viele Beitragende, eine Richtung. Der Vogelschwarm ist unser Leitbild: geteiltes Planungswissen statt isolierter Beratungs-Inseln.</p>
</div>

## Das Problem

Planungswissen in der Fertigung ist teuer, eingeschlossen und wird ständig neu erfunden.

Jedes Unternehmen, das ein kommerzielles Advanced Planning System einführt, zahlt hohe Beratungskosten, um dieselben Batch-Release-Regeln zu konfigurieren, die Dutzende anderer Unternehmen bereits konfiguriert haben. Wenn das System gewechselt wird, ist das Wissen verloren. Wenn der Berater das Unternehmen verlässt, lebt es nur noch in Präsentationen.

**Das ist dasselbe Problem, das Software vor Open Source hatte.**

## Die Linux-Kernel-Analogie

Der Linux-Kernel ist klein, stabil und generisch. Er definiert die Verträge — System-Calls, Treiber-Interfaces, Speicherverwaltungs-Primitive — und überlässt der Community alles andere: Gerätetreiber, Dateisysteme, Netzwerk-Stacks, GPU-Unterstützung.

**Die Pharma Collective Platform (PCP) wendet dieses Modell auf Fertigungsplanung an.**

```
Linux-Kernel-Modell         Pharma Collective Platform
─────────────────────────   ─────────────────────────────────────
Kernel                   →  planning-core
Gerätetreiber            →  Constraint-Plugins
Distributions-Pakete     →  Industrie-Packs (Pharma, CGT, Food…)
Hardware-Interfaces      →  ERP/MES/WMS/LIMS Adapter
```

Der Kern ist klein: Aufträge, Operationen, Ressourcen, Kalender, Materialien, Chargen, Constraints, Simulationsläufe, Audit-Trail.

Die Community baut alles darüber.

## Kernprinzipien

### 1. Systemunabhängig by Design

Der `planning-core` kennt die internen Datenstrukturen keines kommerziellen Planungssystems. Alle externen Systeme werden auf das **kanonische Datenmodell** abgebildet, bevor sie den Kern berühren.

### 2. Constraints als versionierte Plugins

Jede Planungsregel — „Dieser Vorgang darf nicht geplant werden, wenn die Reinigungsvalidierung für Produktfamilie X abgelaufen ist" — ist ein eigenständiges, versioniertes, testbares Plugin.

```typescript
interface PlanningConstraint {
  id: string
  version: string
  evaluate(context: ConstraintContext): ConstraintResult
  explain(result: ConstraintResult): string
  testCases: ConstraintTestCase[]
}
```

### 3. Erklärbarkeit {#erklaerbarkeit}

Jede Planungsentscheidung muss erklärbar sein. Wenn ein Planer fragt „Warum wurde Auftrag 4711 blockiert?", liefert das System eine verständliche Kette von Constraints:

```
Auftrag ORD-4711 blockiert
├── CONSTRAINT: ReinigungsValidierung [BLOCKIEREND]
│   Grund: Produktfamilie PF-08 erfordert Reinigungsvalidierung.
│   Letzte gültige Reinigung: 12.05.2026. Aktuelles Datum: 21.06.2026.
│   Maßnahme: CIP-001-Reinigungslauf vor diesem Vorgang einplanen.
└── CONSTRAINT: Ressourcenkapazität [WARNUNG]
    Grund: Reaktor R-04 ist am 23.06.2026 zu 94% ausgelastet.
    Maßnahme: Verschiebung auf Reaktor R-06 (67% Auslastung) prüfen.
```

### 4. GxP-ready by Default

Die Plattform wurde von Anfang an für regulierte Industrien entwickelt. Das Validierungs-Framework protokolliert:
- Welche Constraint-Version während eines Simulationslaufs aktiv war
- Welcher Benutzer wann den Lauf ausgelöst hat
- Was das Ergebnis war und warum
- Bereitschaft für elektronische Unterschriften

### 5. Community-Beitragsmodell

Planungswissen gehört allen. Das Beitragsmodell verlangt von jedem neuen Constraint oder Industrie-Pack:
- Dokumentation des Geschäftszwecks
- Verweis auf regulatorische / fachliche Anforderung (URS/FS/DS)
- Mindestens 3 automatisierte Testfälle
- Einen Beispiel-Datensatz zur Reproduzierbarkeit

## Was PCP nicht ist

| PCP ist | PCP ist nicht |
|---|---|
| Ein Planungskern und Plugin-Framework | Ein vollständiges ERP-System |
| Kanonisches Datenmodell für Planung | Ein Ersatz für MES/WMS |
| Erklärbare Constraint-Auswertung | Ein Black-Box-Optimierungssolver |
| Open Source, systemunabhängig | An ein bestimmtes kommerzielles System gebunden |
| Für regulierte Industrien konzipiert | Nur für Pharma |

## Projektstatus

PCP befindet sich in aktiver Frühentwicklung (v0.1.0). Das Kerndatenmodell und das Constraint-Framework sind stabil. Industrie-Packs und Adapter werden von Beitragenden entwickelt.

→ [Erste Schritte](/de/guide/getting-started) — Installation in ca. 15 Minuten.
→ [Beitragen](/de/community/contributing) — Ersten Constraint beisteuern.
