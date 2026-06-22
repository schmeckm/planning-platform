# Code Style

Pharma Collective Platform enforces a consistent code style across all packages. These conventions are automatically checked by the CI pipeline.

## Language

**All code, comments, log messages, error messages, and identifiers are written in English.**

## TypeScript

- **Strict mode** is enabled in all packages. `tsconfig.json` has `"strict": true`.
- **`any` is forbidden.** Use `unknown` and narrow the type, or use generics.
- Use `interface` for extensible public contracts, `type` for unions and aliases.
- Prefer `readonly` arrays and properties where mutation is not intended.
- Validate all API payloads with **Zod** schemas.

```typescript
// ✅ Correct
interface ConstraintResult {
  readonly constraintId: string
  readonly passed: boolean
}

// ❌ Forbidden
function evaluate(context: any): any { ... }
```

## Naming

| What | Convention | Example |
|---|---|---|
| Files | `PascalCase` for classes, `camelCase` for utilities | `HoldTimeConstraint.ts`, `buildContext.ts` |
| Classes | `PascalCase` | `HoldTimeConstraint` |
| Interfaces | `PascalCase` with `I` prefix **only for adapters** | `ISchedulingAdapter` |
| Functions | `camelCase` | `evaluateConstraints()` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_HOLD_TIME_MIN` |
| Constraint IDs | `namespace.kebab-case` | `pharma.hold-time`, `cgt.chain-of-identity` |
| Tags | `namespace.camelCase` | `pharma.maxHoldTimeMin`, `sap.plant` |

## Comments

Comments explain **why**, not **what**. Do not narrate the code.

```typescript
// ❌ Useless comment
// Increment the counter
count++

// ✅ Explains non-obvious intent
// Minimum 1 minute gap to avoid race condition in the scheduling engine
const gapMs = Math.max(durationMs, 60_000)
```

## Error Handling

- All async operations must handle errors explicitly. Do not let promises reject silently.
- Use typed error classes, not generic `Error` with string parsing.
- Wrap all external API calls (ERP, MES, LIMS) in try/catch and return a typed error result.

```typescript
// ✅ Typed error result
type AdapterResult<T> = { ok: true; data: T } | { ok: false; error: AdapterError }
```

## File Structure

Each package follows this structure:

```
packages/planning-pharma/
├── src/
│   ├── constraints/     # One file per constraint
│   ├── templates/       # Reusable planning templates
│   └── index.ts         # Public API — only export what's needed
├── tests/               # Mirror of src/ with .test.ts files
├── package.json
└── tsconfig.json
```

## Linting & Formatting

- **ESLint** with the project shared config
- **Prettier** for formatting (no semicolons, single quotes, 2-space indent)
- Run locally before committing:

```bash
pnpm lint        # ESLint check
pnpm format      # Prettier fix
pnpm typecheck   # TypeScript compiler check
```

These are all required to pass in CI.
