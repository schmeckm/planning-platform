# Icon Conventions

Pharma Collective Platform uses a consistent, professional icon language across all surfaces — the documentation site, the scheduling board UI, and community contributions.

## Icon Standard

**All icons in PCP use [Lucide](https://lucide.dev/) as the primary icon library.**

Lucide is:
- Open source (ISC license)
- Consistent stroke-based design (`stroke-width: 1.5–2`, `stroke-linecap: round`, `stroke-linejoin: round`)
- Framework-agnostic (works in Vue, React, plain SVG)
- Used by major open-source platforms (Linear, Vercel, etc.)
- 1 500+ icons covering all common UI and domain needs

## Why Not Emojis?

| | Emojis | Lucide SVG Icons |
|---|---|---|
| Consistency | ❌ Vary by OS / browser | ✅ Pixel-perfect everywhere |
| Color control | ❌ Not controllable | ✅ Inherits `currentColor` |
| Sizing | ❌ Limited | ✅ Scales to any size |
| Dark mode | ❌ May not adapt | ✅ Adapts automatically |
| Professionalism | ❌ Casual | ✅ Production-grade |
| Accessibility | ❌ Screen reader varies | ✅ `aria-label` controlled |

## Usage in Vue (Scheduling Board)

Install the Vue package:

```bash
npm install lucide-vue-next
```

Import individual icons (tree-shakable — only used icons are bundled):

```vue
<script setup>
import { ShieldCheck, GitBranch, Layers, AlertTriangle } from 'lucide-vue-next'
</script>

<template>
  <ShieldCheck :size="20" stroke-width="1.6" />
  <AlertTriangle :size="20" stroke-width="1.6" class="icon--warning" />
</template>
```

**Always use `stroke-width="1.6"`** for consistency across the UI. The default (2) is too heavy at small sizes.

## Usage in Docs (VitePress)

In VitePress feature cards or custom components, use inline SVG from Lucide's source:

```yaml
# index.md feature block
- icon:
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="1.6"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="m9 12 2 2 4-4"/>
         </svg>'
  title: GxP & Validation Ready
```

Copy SVG source from [lucide.dev](https://lucide.dev/) → select icon → "Copy SVG".

## Domain Icon Mapping

These icons are the **official mapping** for PCP concepts. Use them consistently:

| Concept | Lucide Icon | Import Name |
|---|---|---|
| Constraint / Rule | `shield` | `Shield` |
| Constraint violated (blocking) | `shield-x` | `ShieldX` |
| Constraint passed | `shield-check` | `ShieldCheck` |
| Constraint warning | `alert-triangle` | `AlertTriangle` |
| Order / Production Order | `clipboard-list` | `ClipboardList` |
| Operation / Step | `git-commit` | `GitCommit` |
| Resource / Machine | `cpu` | `Cpu` |
| Calendar / Availability | `calendar` | `Calendar` |
| Material / Inventory | `package` | `Package` |
| Batch | `layers` | `Layers` |
| Simulation Run | `play-circle` | `PlayCircle` |
| Audit Trail | `history` | `History` |
| ERP Adapter | `plug` | `Plug` |
| Industry Pack | `building-2` | `Building2` |
| Community / Contribution | `users` | `Users` |
| Documentation | `book-open` | `BookOpen` |
| Settings / Config | `settings` | `Settings` |
| API / Endpoint | `server` | `Server` |
| Validation / GxP | `badge-check` | `BadgeCheck` |
| AI / Knowledge | `brain` | `Brain` |
| Roadmap / Plan | `map` | `Map` |
| Warning / Deviation | `alert-circle` | `AlertCircle` |
| Blocked / Error | `x-circle` | `XCircle` |
| Success / Released | `check-circle` | `CheckCircle` |

## Icon Sizes

| Context | Size | stroke-width |
|---|---|---|
| Inline in text | `16px` | `1.6` |
| Button / label | `18px` | `1.6` |
| Card / panel header | `20px` | `1.6` |
| Feature card (large) | `24px` | `1.5` |
| Hero / illustration | `32–48px` | `1.4` |

## Do NOT Use

- Emojis as UI icons (only permitted in markdown prose, not in UI components)
- Font Awesome (license complexity)
- Material Design Icons (visual style inconsistent with Lucide)
- Custom ad-hoc SVGs without adding them to this mapping table first

## Adding a New Icon to the Mapping

If you need an icon not listed above:
1. Find the best match on [lucide.dev](https://lucide.dev/)
2. Add it to the table above via PR
3. Tag the PR with `docs:icons`
