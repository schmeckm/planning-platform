# HAE integration (embedded frontend)

`@PCP/frontend` ships the Open Planning kernel UI **embedded** in the Hard Allocation Engine (HAE) shell: Cockpit views, Portal auth/landing, shared styles, and process metadata live **outside** `open-planning-platform/`.

This document describes the integration contract for local dev, Docker, and a future standalone `planning-platform` repository (PR 9).

---

## Required sibling directories

Machine-readable manifest: [`config/hae-integration.manifest.json`](../../config/hae-integration.manifest.json)

| Path | Purpose |
|------|---------|
| `cockpit/src` | Planning cockpit views (`/planning/*`) |
| `portal/frontend/src` | Auth shell, layouts, landing |
| `portal/frontend/public` | Static assets (logo, images) |
| `styles/` | Shared theme CSS (`@styles`) |
| `config/` | Branding (`@config/*`) |
| `process-definitions/` | Process domains (`@process-definitions/*`) |

Validate before frontend dev/build:

```bash
pnpm validate:hae
# or from apps/frontend after predev/prebuild hooks
```

---

## Monorepo layout (current)

```
planningplatform/                 # HAE_MONOREPO_ROOT (default)
├── open-planning-platform/       # OPP workspace
├── cockpit/
├── portal/frontend/
├── styles/
├── config/
└── process-definitions/
```

Default resolution: three levels up from `apps/frontend` → HAE root.

---

## Override: `HAE_MONOREPO_ROOT`

For submodules, split checkouts, or CI agents:

```bash
export HAE_MONOREPO_ROOT=/path/to/hae-monorepo
pnpm dev:frontend
```

Windows (PowerShell):

```powershell
$env:HAE_MONOREPO_ROOT = "C:\work\hae"
pnpm dev:frontend
```

---

## Standalone target layout (PR 9)

When `open-planning-platform/` becomes the repository root, mount UI trees as **vendor checkouts**:

```
planning-platform/                # repo root
├── apps/backend · frontend · …
├── packages/
└── vendor/
    ├── cockpit/src
    ├── portal/frontend/
    ├── styles/
    ├── config/
    └── process-definitions/
```

`resolve-hae-root.mjs` detects `vendor/cockpit/src` automatically.

### Populate vendor/

```bash
pnpm sync:vendor          # copy from HAE monorepo siblings
pnpm validate:hae         # layout: vendor
pnpm export:standalone    # flat tree for new Git repo
```

Full extraction guide: [repo-extraction.md](./repo-extraction.md).

### Recommended: Git submodules

```bash
# Example — adjust URLs to your forks
git submodule add https://github.com/your-org/hae-cockpit.git vendor/cockpit
git submodule add https://github.com/your-org/hae-portal.git vendor/portal
# … styles, config, process-definitions
```

Alternative (longer term): publish `@hae/cockpit-ui` npm packages and replace path aliases — not part of PR 8.

---

## Vite aliases

| Alias | Resolves to |
|-------|-------------|
| `@cockpit/*` | `{HAE_ROOT}/cockpit/src/*` |
| `@portal/*` | `{HAE_ROOT}/portal/frontend/src/*` |
| `@styles` | `{HAE_ROOT}/styles` |
| `@config/*` | `{HAE_ROOT}/config/*` |
| `@process-definitions/*` | `{HAE_ROOT}/process-definitions/*` |

Cockpit route imports use `@cockpit/views/...` (see `apps/frontend/src/cockpit/routes.js`).

---

## Docker

| Profile | Services | Use case |
|---------|----------|----------|
| *(default)* | `backend`, `postgres`, `redis` | OPP API only — **no HAE UI required** |
| `embedded` | + `frontend` | Full UI — **HAE monorepo as build context** |
| `standalone` | + `frontend-standalone` | Full UI — **OPP root + `vendor/`** (`pnpm sync:vendor`) |

```bash
# OPP core stack
docker compose up -d

# Full UI (monorepo context)
docker compose --profile embedded up -d --build

# Full UI (standalone / vendor layout)
pnpm sync:vendor
docker compose --profile standalone up -d --build
```

Embedded image: `apps/frontend/Dockerfile` (HAE root context).  
Standalone image: `apps/frontend/Dockerfile.standalone` (OPP root + `vendor/`).

---

## What is *not* decoupled yet

- `@PCP/frontend` still **imports** Portal and Cockpit at build time.
- There is no reduced “OPP-only” router — embedded mode is the only supported frontend build.
- Backend (`@PCP/backend`) and packages (`@PCP/planning-*`) are already independent of HAE paths.

PR 9 provides `vendor/` sync, export scripts, and standalone Docker — see [repo-extraction.md](./repo-extraction.md).
