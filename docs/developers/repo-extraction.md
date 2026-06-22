# Repository extraction (PR 9–10)

This guide covers moving `open-planning-platform/` from the HAE monorepo to a **standalone** `planning-platform` GitHub repository.

PR 9 delivers `vendor/` layout and export tooling. **PR 10** adds promotion, validation, HAE submodule binding, and CI smoke tests — the physical push to a new GitHub repo remains a one-time manual step.

---

## Target layout

```
planning-platform/              # new repo root (today: open-planning-platform/)
├── apps/backend
├── apps/frontend
├── packages/
├── docs/
├── docker/
├── vendor/                     # HAE UI trees (submodule or sync)
│   ├── cockpit/
│   ├── portal/frontend/
│   ├── styles/
│   ├── config/
│   └── process-definitions/
└── .github/workflows/ci.yml    # canonical CI (working-directory: .)
```

---

## Option A — Promote script (recommended)

From the HAE monorepo:

```bash
cd open-planning-platform
pnpm promote:standalone
# creates ../planning-platform-export/ with vendor/, finalized CI, STANDALONE.md
```

With git init:

```bash
pnpm promote:standalone --init-git
```

Dry run:

```bash
node scripts/export-standalone-tree.mjs --dry-run
```

Validate an existing export:

```bash
pnpm validate:standalone --root=../planning-platform-export
```

Skip vendor copy (OPP-only tree):

```bash
node scripts/export-standalone-tree.mjs --skip-vendor --out=/tmp/pcp-core
```

Initialize the new repository:

```bash
cd ../planning-platform-export
git init
git add .
git commit -m "Initial planning-platform export from HAE monorepo"
git remote add origin https://github.com/your-org/planning-platform.git
git branch -M main
git push -u origin main
```

---

## Option B — Vendor sync only (stay in monorepo)

Test standalone resolution without exporting:

```bash
cd open-planning-platform
pnpm sync:vendor
pnpm validate:hae    # should report layout: vendor
pnpm dev:frontend
```

Remove synced copies: delete `vendor/cockpit`, `vendor/portal`, etc. (gitignored).

---

## Option C — Git submodules

Copy [`.gitmodules.example`](../../.gitmodules.example) and add submodules pointing at your HAE UI sources:

```bash
git submodule add <cockpit-url> vendor/cockpit
git submodule add <portal-url> vendor/portal
# … styles, config, process-definitions
git submodule update --init --recursive
```

If UI trees still live in a single HAE monorepo, consider **git subtree split** or sparse checkout instead of pointing every submodule at the full monorepo URL.

---

## Docker

| Profile | Service | Build context | Use case |
|---------|---------|---------------|----------|
| *(default)* | `backend` | OPP root | API only |
| `embedded` | `frontend` | HAE monorepo root | Current monorepo dev |
| `standalone` | `frontend-standalone` | OPP root + `vendor/` | Exported / standalone repo |

```bash
# After pnpm sync:vendor
docker compose --profile standalone up -d --build
```

---

## CI switchover

| Repository | Active workflow | `working-directory` |
|------------|-----------------|---------------------|
| HAE monorepo (today) | `.github/workflows/planning-platform-ci.yml` | `open-planning-platform` |
| Standalone (target) | `.github/workflows/ci.yml` | `.` (repo root) |

Package lint/tests/typecheck do **not** need `vendor/`. Frontend build in CI requires submodules or a `sync:vendor` step with a checked-out HAE source (optional job).

After the split, remove or archive `planning-platform-ci.yml` from the standalone repo and enable `ci.yml` at repo root.

---

## HAE monorepo after split

The HAE repository should consume OPP as a **git submodule** at the same path (`open-planning-platform/`):

```
hae-monorepo/
├── open-planning-platform/    # submodule → planning-platform repo
├── cockpit/
├── portal/
└── …
```

```powershell
# After standalone repo is pushed to GitHub
.\scripts\bind-opp-submodule.ps1 -RemoteUrl https://github.com/your-org/planning-platform.git
```

Manifest: `config/opp-integration.manifest.json` · resolver: `scripts/resolve-opp-root.ps1` (used by `start.ps1`).

Update after binding:

- `scripts/start.ps1` — paths if OPP moves
- `docs/IT.md` — clone instructions
- Docker portal build — context remains HAE root; OPP submodule path unchanged

---

## Environment variables

| Variable | Purpose |
|----------|---------|
| `HAE_MONOREPO_ROOT` | Override UI path resolution (submodule layouts, CI) |
| `VITE_OPP_API_URL` | Frontend API base URL (Docker build arg) |

---

## What PR 9–10 do *not* do

- Do not automatically rewrite `schmeckm/planningplatform` into an OPP-only repository
- Do not remove `open-planning-platform/` from the monorepo without running `bind-opp-submodule.ps1`
- Do not publish npm packages for Cockpit/Portal UI

See [hae-integration.md](./hae-integration.md) for the embedded frontend contract.
