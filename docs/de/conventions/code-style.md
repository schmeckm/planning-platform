# Code-Stil

Die Open Planning Platform setzt einen konsistenten Code-Stil in allen Paketen durch. Diese Konventionen werden automatisch in der CI-Pipeline geprüft.

## Sprache

**Sämtlicher Code, alle Kommentare, Log-Ausgaben, Fehlermeldungen und Bezeichner sind auf Englisch.**

Die Dokumentationsseite selbst ist zweisprachig (EN/DE), aber der Quellcode ist immer Englisch.

## TypeScript

- **Strict Mode** ist in allen Paketen aktiviert. `tsconfig.json` hat `"strict": true`.
- **`any` ist verboten.** `unknown` verwenden und den Typ einengen, oder Generics nutzen.
- `interface` für erweiterbare öffentliche Verträge, `type` für Unions und Aliasse.
- **Branded Types** für alle IDs verwenden — verhindert versehentliches Mischen von `OrderId` und `ResourceId`:

```typescript
// ✅ Korrekt — branded types aus @opp/planning-core
import { asOrderId, asResourceId } from '@opp/planning-core'
const orderId = asOrderId('ORD-001')     // OrderId
const resourceId = asResourceId('R-01') // ResourceId

// ❌ Verboten
function process(id: string): void { ... }  // Welcher ID-Typ?
function process(ctx: any): void { ... }    // any verboten
```

- **Zod** für alle API-Payload-Validierungen verwenden.
- **`readonly`** für Arrays und Properties, die nicht mutiert werden sollen.

## Benennung

| Was | Konvention | Beispiel |
|---|---|---|
| Dateien (Klassen) | `PascalCase` | `HoldTimeConstraint.ts` |
| Dateien (Utilities) | `kebab-case` | `build-context.ts` |
| Klassen | `PascalCase` | `PharmaHoldTimeConstraint` |
| Interfaces | `PascalCase` mit `I`-Präfix **nur für Adapter** | `ISchedulingAdapter` |
| Funktionen | `camelCase` | `evaluateConstraints()` |
| Konstanten | `SCREAMING_SNAKE_CASE` | `MAX_HOLD_TIME_MIN` |
| Constraint-IDs | `domain.bereich.name` | `pharma.operation.hold-time` |
| Extension-Tags | `domain.camelCase` | `pharma.maxHoldTimeMin` |

## Kommentare

Kommentare erklären **warum**, nicht **was**. Der Code selbst zeigt das Was.

```typescript
// ❌ Nutzloser Kommentar
// Zähler inkrementieren
count++

// ✅ Erklärt nicht-offensichtliche Absicht
// Mindestens 1 Minute Puffer, um Race Condition in der Scheduling-Engine zu vermeiden
const gapMs = Math.max(durationMs, 60_000)
```

## Fehlerbehandlung

- Alle `async`-Operationen müssen Fehler explizit behandeln.
- Typisierte Fehlerklassen verwenden, kein generisches `Error` mit String-Parsing.
- Alle externen API-Aufrufe (ERP, MES, LIMS) in `try/catch` einwickeln.

```typescript
// ✅ Typisiertes Ergebnis-Pattern
type AdapterResult<T> = { ok: true; data: T } | { ok: false; error: AdapterError }

// ✅ Constraint darf NIEMALS werfen
async evaluate(ctx: ConstraintContext): Promise<ConstraintEvaluationResult> {
  try {
    // ... Auswertungslogik
  } catch (err) {
    return buildFailResult(this.metadata, `Unerwarteter Fehler: ${String(err)}`, ...)
  }
}
```

## Dateistruktur

```
packages/planning-pharma/
├── src/
│   ├── constraints/     # Eine Datei pro Constraint
│   ├── templates/       # Wiederverwendbare Planungsvorlagen
│   └── index.ts         # Öffentliche API — nur exportieren was benötigt wird
├── package.json
└── tsconfig.json
```

## Linting & Formatierung

```bash
pnpm lint        # ESLint-Prüfung
pnpm format      # Prettier-Korrektur
pnpm typecheck   # TypeScript-Compiler-Prüfung
```

Alle drei müssen in CI bestehen. Lokal vor dem Commit ausführen.
