# Constraint schreiben

Diese Anleitung zeigt Schritt für Schritt, wie ein vollständiger Constraint implementiert wird. Als Beispiel dient der **Hold-Time-Constraint** — eine echte GMP-Anforderung aus der Pharmaproduktion.

## Schritt 1 — Datei anlegen

```bash
# Für einen neuen Pharma-Constraint im Pharma-Pack
touch packages/planning-pharma/src/constraints/hold-time.constraint.ts
```

## Schritt 2 — Interface implementieren

```typescript
// packages/planning-pharma/src/constraints/hold-time.constraint.ts

import type { ConstraintEvaluationResult } from '@opp/planning-core'
import { asConstraintId } from '@opp/planning-core'
import type {
  IConstraintPlugin,
  ConstraintContext,
  ConstraintMetadata,
  ConstraintSelfTestResult,
} from '@opp/planning-constraints'
import { buildPassResult, buildFailResult } from '@opp/planning-constraints'

/**
 * Metadaten — einmalig definiert, unveränderlich zur Laufzeit.
 *
 * Validierungsreferenzen:
 *   URS-PH-002: System soll validierte Haltezeiten zwischen Operationen erzwingen
 *   FS-PH-020:  Haltezeit-Prüfung vergleicht Inter-Operationslücke vs. Prozessspezifikation
 */
const META: ConstraintMetadata = {
  id: asConstraintId('pharma.operation.hold-time'),
  version: '1.0.0',
  name: 'Hold-Time-Prüfung',
  description:
    'Prüft, ob die geplante Zeitlücke zwischen aufeinanderfolgenden Operationen ' +
    'die validierten Mindest- und Maximal-Haltezeiten einhält.',
  domain: 'PHARMA',
  defaultSeverity: 'BLOCKER',
  validationRefs: [
    { type: 'URS', id: 'URS-PH-002', description: 'Validierte Haltezeiten erzwingen' },
    { type: 'FS',  id: 'FS-PH-020',  description: 'Haltezeit vs. Prozessspezifikation' },
  ],
  author: 'Open Planning Platform Contributors',
  license: 'Apache-2.0',
  tags: ['pharma', 'hold-time', 'operationen', 'gmp'],
}

export class PharmaHoldTimeConstraint implements IConstraintPlugin {
  readonly metadata = META

  async evaluate(ctx: ConstraintContext): Promise<ConstraintEvaluationResult> {
    const { order } = ctx
    const ops = [...order.operations].sort((a, b) => a.sequence - b.sequence)

    if (ops.length < 2) {
      return buildPassResult(META, `Auftrag ${order.id}: weniger als 2 Operationen, Prüfung übersprungen.`)
    }

    for (let i = 0; i < ops.length - 1; i++) {
      const current = ops[i]!
      const next = ops[i + 1]!

      if (!current.scheduledFinish || !next.scheduledStart) continue

      const actualGapMin =
        (next.scheduledStart.getTime() - current.scheduledFinish.getTime()) / 60_000

      if (actualGapMin < current.minLagMinutes) {
        return buildFailResult(
          META,
          `Haltezeit unterschritten: Op ${current.sequence}→${next.sequence}: ` +
            `${actualGapMin.toFixed(0)} min < Minimum ${current.minLagMinutes} min`,
          `Auftrag ${order.id}: Lücke zwischen "${current.description}" (Schritt ${current.sequence}) ` +
            `und "${next.description}" (Schritt ${next.sequence}) beträgt ${actualGapMin.toFixed(0)} Minuten. ` +
            `Validierte Mindest-Haltezeit: ${current.minLagMinutes} Minuten.`,
          `Schritt ${next.sequence} um mindestens ${(current.minLagMinutes - actualGapMin).toFixed(0)} Minuten nach hinten verschieben.`,
          0,
          { actualGapMin, minLagMinutes: current.minLagMinutes },
        )
      }
    }

    return buildPassResult(META, `Auftrag ${order.id}: alle Haltezeiten eingehalten.`)
  }

  async selfTest(): Promise<ConstraintSelfTestResult> {
    const start = Date.now()
    const failed: ConstraintSelfTestResult['failedTests'] = []
    const now = new Date()

    // Testfall 1: Eine Operation → bestanden (übersprungen)
    const r1 = await this.evaluate(buildCtx(1, 60, now))
    if (!r1.passed) failed.push({ name: 'ein-op-skip', expected: 'passed=true', actual: 'passed=false' })

    // Testfall 2: Zwei Ops, ausreichende Lücke → bestanden
    const r2 = await this.evaluate(buildCtx(2, 120, now))
    if (!r2.passed) failed.push({ name: 'ausreichende-luecke', expected: 'passed=true', actual: 'passed=false' })

    // Testfall 3: Zwei Ops, zu kurze Lücke → Verletzung
    const r3 = await this.evaluate(buildCtx(2, 5, now))
    if (r3.passed) failed.push({ name: 'zu-kurze-luecke', expected: 'passed=false', actual: 'passed=true' })

    return {
      pluginId: META.id,
      pluginVersion: META.version,
      passed: failed.length === 0,
      testsPassed: 3 - failed.length,
      testsFailed: failed.length,
      failedTests: failed,
      durationMs: Date.now() - start,
    }
  }
}
```

## Schritt 3 — Exportieren

```typescript
// packages/planning-pharma/src/index.ts
export { PharmaHoldTimeConstraint } from './constraints/hold-time.constraint.js'
```

## Schritt 4 — Registrieren

```typescript
import { ConstraintRegistry } from '@opp/planning-constraints'
import { PharmaHoldTimeConstraint } from '@opp/planning-pharma'

const registry = new ConstraintRegistry()
registry.register(new PharmaHoldTimeConstraint())

// selfTest() aufrufen — für IQ/OQ/PQ-Validierung
const testResult = await registry.get('pharma.operation.hold-time')!.selfTest()
console.log(testResult.passed) // true
```

## Schritt 5 — Pull Request öffnen

Eintrag in `/de/constraints/builtin.md` ergänzen und PR öffnen. Vollständige Checkliste: [PR & Review](/de/conventions/pr-process).

## Wichtige Regeln

::: warning Niemals `any` verwenden
TypeScript Strict Mode ist aktiviert. Alle Typen müssen explizit sein. `any` wird im Review abgelehnt.
:::

::: warning Niemals werfen
`evaluate()` darf keine Exception werfen. Fehler immer als `buildFailResult()` zurückgeben. Eine crashing Plugin blockiert sonst den gesamten Simulationslauf.
:::

::: tip selfTest() ist Pflicht
Jeder Constraint muss `selfTest()` mit mindestens 3 Testfällen implementieren: Bestanden, Verletzung, und ein Grenzfall.
:::
