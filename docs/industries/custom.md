# Build Your Own Industry Pack

Any industry can contribute a planning pack to Pharma Collective Platform. This guide walks through creating a new industry pack from scratch.

## When to Create a New Pack vs. a New Constraint

| Situation | Recommendation |
|---|---|
| Single new constraint for an existing industry | Add to the existing pack |
| 3+ new constraints for a new industry | Create a new industry pack |
| Constraints that apply across industries | Add to `@PCP/planning-constraints` (core) |

## Step 1 — Create the Package

```bash
mkdir packages/planning-<industry>
cd packages/planning-<industry>
```

Create `package.json`:

```json
{
  "name": "@PCP/planning-<industry>",
  "version": "0.1.0",
  "description": "<Industry> planning pack for Pharma Collective Platform",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "peerDependencies": {
    "@PCP/planning-core": "^0.1.0",
    "@PCP/planning-constraints": "^0.1.0"
  }
}
```

## Step 2 — Define Your Domain Tags Namespace

Choose a namespace for your tags: `food.*`, `semiconductor.*`, `packaging.*`

Document all tags in a `TAGS.md` file in your package.

## Step 3 — Implement Constraints

Follow the [Writing a Constraint](/constraints/writing) guide. Each constraint goes in `src/constraints/`.

## Step 4 — Write Documentation

Create `/docs/industries/<industry>.md` with:
- Industry overview (what makes planning unique here)
- List of constraints with regulatory references
- Tag documentation
- Sample data
- Getting started snippet

## Step 5 — Open a Pull Request

Follow the [PR & Review Process](/conventions/pr-process). Tag your PR with `industry-pack` and request a review from someone with domain expertise in your industry.

## Example — Food & Beverage Pack (in development)

```
packages/planning-food/
├── src/
│   ├── constraints/
│   │   ├── AllergenConstraint.ts       # No allergen cross-contamination
│   │   ├── ShelfLifeConstraint.ts      # FEFO (First Expired, First Out)
│   │   ├── CleaningRegimeConstraint.ts # Wet vs. dry cleaning by product type
│   │   └── TemperatureZoneConstraint.ts # Chilled/ambient/frozen zone compliance
│   └── index.ts
└── package.json
```

## Packs in Progress

| Industry | Status | Contact |
|---|---|---|
| Pharma | ✅ Available | `@domain-pharma` |
| Cell & Gene Therapy | ✅ Available | `@domain-cgt` |
| Packaging | 🚧 In development | open |
| Food & Beverage | 🚧 In development | open |
| Semiconductor | 📋 Planned | open |
| Medical Devices | 📋 Planned | open |

Want to lead an industry pack? Open an issue on GitHub and tag it `industry-pack-proposal`.
