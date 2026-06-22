# Plugin-Interface

Das Constraint-System ist das Herzstück der Open Planning Platform. Jede Planungsregel — von einfachen Kapazitätsprüfungen bis zu komplexen regulatorischen Anforderungen — wird als Constraint-Plugin implementiert.

## Das Interface

```typescript
// packages/planning-constraints/src/interfaces/constraint.interface.ts

export interface IConstraintPlugin {
  /** Statische Metadaten — ändern sich zur Laufzeit nie */
  readonly metadata: ConstraintMetadata

  /**
   * Constraint gegen einen einzelnen Auftrag auswerten.
   * Muss seiteneffektfrei und deterministisch sein.
   * Darf nie werfen — stattdessen ein Fail-Result zurückgeben.
   */
  evaluate(ctx: ConstraintContext): Promise<ConstraintEvaluationResult>

  /**
   * Eingebaute Testfälle ausführen.
   * Wird bei Validierungs- und IQ/OQ/PQ-Phasen aufgerufen.
   */
  selfTest(): Promise<ConstraintSelfTestResult>
}
```

## ConstraintMetadata

```typescript
export interface ConstraintMetadata {
  /** Global eindeutige ID. Format: 'domain.bereich.name' */
  readonly id: ConstraintId

  /** Semantische Version — MAJOR.MINOR.PATCH */
  readonly version: string

  /** Anzeigename für Planer in der Oberfläche */
  readonly name: string

  /** Beschreibung der geprüften Geschäftsregel */
  readonly description: string

  /** Domäne: GENERIC | PHARMA | CGT | FOOD | SEMICONDUCTOR | ... */
  readonly domain: ConstraintDomain

  /** Standard-Schweregrad bei Verletzung */
  readonly defaultSeverity: ConstraintSeverity

  /** Validierungsreferenzen für GxP-Rückverfolgbarkeit */
  readonly validationRefs: ValidationReference[]

  /** Autor / Maintainer */
  readonly author: string

  /** SPDX-Lizenzkennung (z. B. 'Apache-2.0') */
  readonly license: string

  /** Tags für Filterung und Auffindbarkeit */
  readonly tags: string[]
}
```

## ConstraintContext

Der Context-Objekt gibt einem Constraint alles, was es zur Auswertung braucht:

```typescript
export interface ConstraintContext {
  order: PlanningOrder
  resources: PlanningResource[]
  batches: PlanningBatch[]
  materials: PlanningMaterial[]
  inventory: InventoryPosition[]

  /** Alle anderen Aufträge im gleichen Simulationslauf */
  siblingOrders: PlanningOrder[]

  /** Aktueller Simulationszeitpunkt */
  evaluationTime: Date

  /** Beliebige Zusatzdaten von Adaptern oder Industrie-Packs */
  extensions: Record<string, unknown>
}
```

## ConstraintEvaluationResult

```typescript
export interface ConstraintEvaluationResult {
  constraintId: ConstraintId
  constraintVersion: string
  severity: ConstraintSeverity
  passed: boolean

  /** Score 0 (schlecht) bis 1 (perfekt) — für Optimierung */
  score: number

  /** Kurz — erscheint in Gantt-Tooltips */
  message: string

  /** Lang — erscheint im Constraint-Detail-Panel */
  explanation: string

  /** Korrekturmaßnahme für den Planer */
  correctionHint?: string

  /** Rohdaten, die bei der Auswertung verwendet wurden */
  detail: Record<string, unknown>

  /** GxP-Referenzen: URS, FS, DS, Testfall-IDs */
  validationRefs?: ValidationReference[]
}
```

## Schweregradsystem

| Schweregrad | Auswirkung |
|---|---|
| `BLOCKER` | Auftrag kann nicht eingeplant werden. `schedulingStatus = INFEASIBLE` |
| `WARNING` | Auftrag wird eingeplant, Planer wird informiert. `schedulingStatus = SOFT_VIOLATION` |
| `RECOMMENDATION` | Hinweis ohne Planungsauswirkung |
| `INFO` | Reine Information |

## Hilfs-Funktionen

Das Package liefert drei Builder-Funktionen, damit Plugins kein Boilerplate schreiben müssen:

```typescript
// Bestehendes Ergebnis — Constraint bestanden
buildPassResult(meta, explanation, detail?)

// Blockierendes Ergebnis — Constraint verletzt
buildFailResult(meta, message, explanation, correctionHint, score?, detail?)

// Warnungs-Ergebnis — Soft-Verletzung
buildWarnResult(meta, message, explanation, correctionHint, score?, detail?)
```

## Nächste Schritte

- [Constraint schreiben](/de/constraints/writing) — Schritt-für-Schritt-Anleitung
- [Schweregrade](/de/constraints/scoring) — wann BLOCKER, wann WARNING?
- [Tests](/de/constraints/testing) — selfTest() richtig implementieren
- [Mitgelieferte Constraints](/de/constraints/builtin) — was ist bereits verfügbar
