# Release Notes Convention

Release notes are **human-readable stories** for planners, integrators, and contributors. They complement the machine-readable [Changelog](/community/changelog) — same facts, different audience.

Inspired by the [Home Assistant release note format](https://www.home-assistant.io/blog/2026/06/03/release-20266/), but adapted for a planning platform.

## When to write a release note

| Artifact | Audience | Format |
|---|---|---|
| **Release note** | Users, planners, integrators | Narrative + highlights |
| **Changelog** | Developers upgrading packages | Keep a Changelog sections |
| **Git tag / GitHub Release** | CI and package managers | Tag + changelog excerpt |

Every **semver platform release** (`0.2.0`, `1.0.0`, …) gets a release note. Patch releases (`0.1.1`) only need a release note when user-visible behavior changes.

## File locations

| What | Path |
|---|---|
| Release index (card grid) | `/docs/community/release-notes/index.md` |
| Individual release | `/docs/community/release-notes/<version>.md` |
| Card registry | `/docs/.vitepress/data/releases.ts` |
| German index | `/docs/de/community/release-notes/index.md` |
| Changelog entry | `/docs/community/changelog.md` |

## Publishing checklist

1. Add the version block to `changelog.md` (Keep a Changelog format).
2. Create `community/release-notes/<version>.md` using the template below.
3. Register the card in `.vitepress/data/releases.ts` (`version`, `subtitle`, `date`, `link`, `categories`).
4. Add German index entry if translated; otherwise link to English.
5. Update the nav version badge in `.vitepress/config.ts` when releasing.

## Title format

```
<version>: <catchy subtitle>
```

Examples:

- `0.1.0: The scheduling kernel takes shape`
- `0.2.0: Constraints you can audit`
- `1.0.0: Production-ready planning core`

The subtitle should fit on one line in the release card grid.

## Required page structure

Use this section order. Skip sections that do not apply; never reorder.

```markdown
---
title: "<version>: <subtitle>"
description: One sentence for SEO / social preview (max ~160 chars).
---

# <version>: <subtitle>

<div class="release-note-meta">
  <span class="release-note-tag">DD Mon YYYY</span>
  <span class="release-note-tag">Category</span>
</div>

<!-- 1. Lede: 2–4 short paragraphs. First line: "Pharma Collective Platform X.Y.Z is here." -->
<!-- 2. Highlight sections (##) — one per major feature, user-facing language -->
<!-- 3. Packages / API / UI tables where helpful -->
<!-- 4. Backward-incompatible changes (mandatory if any) -->
<!-- 5. Patch releases (optional, for patch lines under a minor) -->
<!-- 6. All changes → link to changelog anchor -->
<!-- 7. Need help? → docs + GitHub -->
<!-- Footer: link back to /community/release-notes -->
```

### Lede (introduction)

- Write in **complete sentences**, warm but professional.
- Lead with **what matters to the reader**, not a commit list.
- Name the **headline theme** of the release (one idea).
- No emoji in titles or headings (see [Icon Conventions](/conventions/icons)).

### Highlight sections (`##`)

Each major feature gets its own `##` section:

- **Business context first** — what problem does this solve on the shop floor or in QA?
- **Concrete behavior** — what can users do now that they could not before?
- **Screenshots** when UI changes (`/docs/public/images/releases/<version>/…`)
- **Links** to reference docs, not duplicate them.

Group related items under `###` subsections when needed (same pattern as Home Assistant).

### Standard closing sections

| Section | Required | Content |
|---|---|---|
| `## Backward-incompatible changes` | If any breaking change | Migration steps, config renames, removed APIs |
| `## Patch releases` | If patch lines ship | `### 0.2.1 — Date` + bullet list |
| `## All changes` | Always | Link to changelog anchor |
| `## Need help?` | Always | Getting started, contributing, GitHub issues |

## Categories (card sidebar)

Tag each release in `releases.ts`:

| ID | Use for |
|---|---|
| `platform` | Core model, engine, API infrastructure |
| `constraints` | Framework or built-in constraint changes |
| `adapters` | ERP/MES/LIMS/CSV connectors |
| `industry-packs` | Pharma, CGT, packaging, etc. |
| `modules` | Shopfloor and other operational modules |
| `documentation` | Docs-only releases (rare) |

## Writing style

- **English** for release notes (German index page may summarize; full note can stay EN until translated).
- Short paragraphs; tables for comparisons.
- Use **real examples** — order IDs, constraint messages, API paths.
- Prefer **Lucide icons in UI**; no emoji in platform docs (see [Icons](/conventions/icons)).
- Past tense for shipped work; present tense for current behavior.

## Review criteria (PR checklist)

Before merge, verify:

- [ ] Title matches `releases.ts` card entry
- [ ] `description` frontmatter is set
- [ ] Lede explains the _why_, not only the _what_
- [ ] Breaking changes section exists or explicitly states "none"
- [ ] Changelog entry exists for the same version
- [ ] Links resolve (no dead `/guide/...` paths)
- [ ] Screenshots live under `public/images/releases/` with alt text in markdown

## Example

See [0.1.0 release note](/community/release-notes/0.1.0) for a filled-in example.

## Relationship to Home Assistant

| Home Assistant | PCP equivalent |
|---|---|
| Integrations | Adapters + Industry packs |
| Frontend / Core | Apps (API, web, docs) + planning-core |
| Backward-incompatible changes | Same section name and purpose |
| Patch releases | Same pattern for weekly fixes |
| Card grid index | `<ReleaseNoteBlocks />` on `/community/release-notes` |

We adopt their **reader-first narrative** and **fixed section order**, not their home-automation vocabulary.
