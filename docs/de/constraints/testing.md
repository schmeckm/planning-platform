# Tests

Jeder Constraint muss `selfTest()` implementieren. Dies ist keine optionale Empfehlung — PRs ohne funktionierende Tests werden abgelehnt.

## selfTest() Anforderungen

Jeder `selfTest()` muss mindestens 3 Testfälle enthalten:

1. **Bestanden** — Constraint nicht verletzt (Normalfall)
2. **Verletzung** — Constraint verletzt (BLOCKER oder WARNING)
3. **Grenzfall** — Grenzwert exakt eingehalten, fehlende Daten, leere Listen

## Minimale Implementierung

```typescript
async selfTest(): Promise<ConstraintSelfTestResult> {
  const start = Date.now()
  const failed: ConstraintSelfTestResult['failedTests'] = []

  // Testfall 1: Bestanden
  const r1 = await this.evaluate(buildPassContext())
  if (!r1.passed) {
    failed.push({ name: 'normalfall-bestanden', expected: 'passed=true', actual: 'passed=false' })
  }

  // Testfall 2: Verletzung
  const r2 = await this.evaluate(buildViolationContext())
  if (r2.passed) {
    failed.push({ name: 'verletzung-erkannt', expected: 'passed=false', actual: 'passed=true' })
  }

  // Testfall 3: Grenzfall
  const r3 = await this.evaluate(buildEdgeContext())
  if (!r3.passed) {
    failed.push({ name: 'grenzfall', expected: 'passed=true', actual: 'passed=false' })
  }

  return {
    pluginId: this.metadata.id,
    pluginVersion: this.metadata.version,
    passed: failed.length === 0,
    testsPassed: 3 - failed.length,
    testsFailed: failed.length,
    failedTests: failed,
    durationMs: Date.now() - start,
  }
}
```

## Alle Constraints testen

```bash
# Alle selfTests über die Constraint-Registry ausführen
pnpm --filter @PCP/backend test:constraints

# Einzelnes Paket
pnpm --filter @opp/planning-pharma test
```

## CI-Anforderungen

Jeder Pull Request wird automatisch geprüft:

- [ ] `selfTest()` gibt `passed: true` zurück
- [ ] Mindestens 3 Testfälle vorhanden
- [ ] Kein Testfall heißt `'test1'`, `'test2'` (aussagekräftige Namen verlangen)
- [ ] `evaluate()` wirft unter keinen Umständen eine Exception

## IQ/OQ/PQ Relevanz

`selfTest()` ist der Einstiegspunkt für die GxP-Validierung:

```typescript
// Validierungsbericht generieren
const results = await registry.runAllSelfTests()
const report = ValidationReportGenerator.generate(results, {
  includeValidationRefs: true,
  format: 'PDF',
})
// → Enthält: Constraint-ID, Version, Testfall-Namen, Pass/Fail, Validierungsreferenzen (URS/FS/DS)
```

Dies macht die Testfallnamen zu **GxP-Dokumenten**. Namen müssen daher lesbar und stabil sein.
