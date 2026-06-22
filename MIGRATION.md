# Migration Log — open-planning-platform

Technische Umstrukturierung ohne fachliche Logikänderung.  
Stand: 2026-06-22 · PR 1–13 (Spur B) abgeschlossen

## Zielbild (Standalone-Repo)

```
planning-platform/
├── apps/backend, apps/frontend
├── packages/          # planning-core, constraints, pharma, cgt, adapters, shopfloor, sdk, scenarios
├── docs/
├── docker/
└── .github/
```

Aktuell liegt OPP noch unter `open-planning-platform/` im HAE-Monorepo (`schmeckm/planningplatform`).  
Repo-Extraktion → PR 9.

---

## PR 1 — `apps/api` → `apps/backend`

| Vorher | Nachher |
|--------|---------|
| `apps/api/` | `apps/backend/` |
| `@PCP/api` | `@PCP/backend` |

## PR 2 — `apps/web` → `apps/frontend`

| Vorher | Nachher |
|--------|---------|
| `apps/web/` | `apps/frontend/` |
| `@PCP/web` | `@PCP/frontend` |

## PR 3 — `apps/docs` → `docs/`

| Vorher | Nachher |
|--------|---------|
| `apps/docs/` | `docs/` |
| `pharma-collective-platform-docs` | `@PCP/docs` |

Bestehende `docs/ARCHITECTURE.md` (ADR) → `docs/adr/ARCHITECTURE.md`

## PR 4 — `planning-sdk` & `planning-scenarios`

| Package | Zweck |
|---------|--------|
| `@PCP/planning-sdk` | Re-Export von `@PCP/planning-core` + `SDK_VERSION` |
| `@PCP/planning-scenarios` | Scaffold + `SCENARIOS_PACKAGE_VERSION` (Mock-Daten bleiben in `planning-adapters`) |

## PR 5 — Docker

| Artefakt | Beschreibung |
|----------|--------------|
| `apps/backend/Dockerfile` | Production image aus **lokal gebautem** `dist/` |
| `apps/frontend/Dockerfile` | Vite + nginx, Context: **HAE-Root** (Cockpit/Portal) |
| `apps/frontend/nginx.conf` | SPA + API-Proxy → `backend:3100` |
| `.dockerignore` | node_modules, dist, cache |
| `docker-compose.yml` | Services `backend` / `frontend`, Healthcheck `/api/pcp/v1/health` |

## PR 6 — GitHub CI & CODEOWNERS

| Artefakt | Beschreibung |
|----------|--------------|
| `open-planning-platform/.github/CODEOWNERS` | Vorbereitet für Standalone-Repo |
| `open-planning-platform/.github/workflows/ci.yml` | Lint, Tests, Typecheck (Standalone-Template) |
| `open-planning-platform/.github/workflows/simulation.yml` | Constraint-/Adapter-Simulation (Standalone-Template) |
| `.github/workflows/planning-platform-ci.yml` | **Aktiv im HAE-Monorepo** |
| `.github/workflows/planning-platform-simulation.yml` | **Aktiv im HAE-Monorepo** |
| `.github/workflows/opp-ci.yml` | Deprecated (`workflow_dispatch` only) |

## PR 7 — Doku & Aufräumen

| Änderung | Beschreibung |
|----------|--------------|
| README / IT.md | API-Pfade `/api/pcp/v1/*`, `pnpm dev:docs`, CI-Workflows |
| `MIGRATION.md` | Aktualisiert (dieses Dokument) |
| VitePress-Cache | Aus Git entfernt (`.gitignore` war bereits gesetzt) |
| `docs/package-lock.json` | Entfernt (Workspace nutzt Root-`pnpm-lock.yaml`) |
| `scripts/start.ps1` | Delegiert an HAE-Root `scripts/start.ps1` |

### CI-Fixes (nach PR 6, commits `074b385`–`0327a64`)

| Problem | Fix |
|---------|-----|
| Vitest ohne `dist/` | `pretest` baut Workspace-Deps |
| ESLint ohne Config | `eslint.config.mjs` + Root-Lint in CI |
| Typecheck ohne `dist/` | `tsc -b tsconfig.json --force` in CI |
| `ci-gate` bash error | `working-directory: .` im Gate-Job |
| Node 20 deprecation | GitHub Actions → Node 22 |

## PR 8 — HAE-Entkopplung (2026-06-22)

| Änderung | Beschreibung |
|----------|--------------|
| `scripts/resolve-hae-root.mjs` | `HAE_MONOREPO_ROOT` + Auto-Detect (Monorepo / `vendor/`) |
| `scripts/validate-hae-integration.mjs` | Prüft Manifest-Pfade vor Frontend dev/build |
| `config/hae-integration.manifest.json` | Maschinenlesbarer Integration-Vertrag |
| `docs/developers/hae-integration.md` | Submodule-Strategie, Docker-Profile, Aliase |
| `vite.config.ts` / `vite.cockpit-alias.js` | Konfigurierbare HAE-Pfade, `@cockpit` Alias |
| `cockpit/routes.js` | `@cockpit/views/*` statt `../../../../../cockpit/...` |
| `docker-compose.yml` | Frontend nur mit Profile `embedded` |
| `pnpm validate:hae` | Root-Script zur Pfad-Validierung |

**Strategie:** Backend und Packages sind HAE-unabhängig. Frontend bleibt **embedded** (importiert Cockpit/Portal), Pfade sind konfigurierbar für PR 9 (`vendor/` + Submodule).

---

## Konfiguration (PR 1–3)

- `pnpm-workspace.yaml` — `docs` als Workspace-Package
- `package.json` (Root) — `dev:backend`, `dev:frontend`, `dev:docs`; Shims `dev:api` / `dev:web`
- `docs/.vitepress/config.ts` — `ignoreDeadLinks` für `/platform`

## Testprotokoll

```text
pnpm --filter @PCP/backend build     ✅
pnpm --filter @PCP/frontend build    ✅ (HAE-Monorepo-Context)
pnpm --filter @PCP/planning-core test           16 passed
pnpm --filter @PCP/planning-constraints test    30 passed
pnpm --filter @PCP/planning-pharma test         19 passed
pnpm --filter @PCP/planning-cgt test             8 passed
pnpm --filter @PCP/planning-adapters test       22 passed
pnpm --filter @PCP/planning-sdk test             ✅
pnpm --filter @PCP/planning-scenarios test       ✅
```

**Bekannte Vorbestände (nicht durch Migration verursacht):**

- `pnpm -r build` — Frontend braucht HAE-Integration (`pnpm validate:hae`)
- `pnpm -r test` — `planning-shopfloor`, `@PCP/backend` ohne Testdateien → Exit 1

## Nicht geändert (bewusst)

- `planning-constraints`, `planning-pharma`, `planning-cgt` als separate Packages
- Fachliche Constraint-/Adapter-Logik
- Cockpit/Portal-**Imports** im Frontend (embedded mode)

## PR 9 — Standalone-Vorbereitung (2026-06-22)

| Änderung | Beschreibung |
|----------|--------------|
| `vendor/` | Ziel-Layout für UI-Bäume im Standalone-Repo (`vendor/README.md`) |
| `scripts/sync-vendor-from-hae.mjs` | Kopiert Cockpit/Portal/styles/config/process-definitions aus HAE |
| `scripts/export-standalone-tree.mjs` | Exportiert flaches `planning-platform`-Verzeichnis für neues Git-Repo |
| `.gitmodules.example` | Vorlage für Submodule unter `vendor/` |
| `apps/frontend/Dockerfile.standalone` | Frontend-Image mit `vendor/`-Context (kein HAE-Parent) |
| `docker-compose.yml` | Profile `standalone` → Service `frontend-standalone` |
| `pnpm sync:vendor` / `pnpm export:standalone` | Root-Scripts |
| `docs/developers/repo-extraction.md` | Anleitung GitHub-Split, Submodule, CI-Umschaltung |
| `.gitignore` | Sync-Kopien unter `vendor/*` ausgeschlossen |

**Strategie (PR 9a):** OPP bleibt vorerst unter `open-planning-platform/` im HAE-Monorepo. Standalone-Checkout wird über `vendor/` + Export-Skript vorbereitet.

## PR 10 — Repo-Split-Werkzeuge & HAE-Submodule (2026-06-22)

| Änderung | Beschreibung |
|----------|--------------|
| `scripts/finalize-standalone-export.mjs` | Post-Processing: Docker/CI für Standalone-Root, `STANDALONE.md`, Metadaten |
| `scripts/validate-standalone-export.mjs` | Struktur-Check des exportierten Baums |
| `scripts/promote-standalone-repo.mjs` | Export + Validierung + optional `git init` |
| `pnpm promote:standalone` / `pnpm validate:standalone` | Root-Scripts |
| `.github/workflows/planning-platform-export-smoke.yml` | CI-Smoke für Export (HAE-Monorepo) |
| `config/opp-integration.manifest.json` | HAE-seitiger OPP-Pfad-Vertrag |
| `.gitmodules.example` (HAE-Root) | Vorlage: `open-planning-platform` als Submodule |
| `scripts/bind-opp-submodule.ps1` | Bindet Standalone-Repo nach Push |
| `scripts/resolve-opp-root.ps1` + `start.ps1` | `OPP_ROOT` + Submodule-Auflösung |

**Strategie (PR 10):** Physischer GitHub-Split bleibt manuell (`pnpm promote:standalone` → push → `bind-opp-submodule.ps1`). HAE-Monorepo-Dev unverändert mit eingebettetem `open-planning-platform/`.

---

## Nächste Schritte (PR 12+)

## PR 11 — Standalone-Repo & Submodule ✓ abgeschlossen (2026-06-22)

| Änderung | Beschreibung |
|----------|--------------|
| [github.com/schmeckm/planning-platform](https://github.com/schmeckm/planning-platform) | Eigenes OPP-Repo (Export + Push) |
| `.gitmodules` im HAE-Monorepo | `open-planning-platform` als Submodule |
| `scripts/bind-opp-submodule.ps1` | Einmaliges Binding nach Push |
| `scripts/push-standalone-export.ps1` | Push aus `planning-platform-export/` |
| `docs/IT.md` | Clone mit `--recurse-submodules`, Zwei-Repo-Modell |

Optional offen: `git filter-repo` für saubere History im Standalone-Repo (ohne HAE-Commits).

---

## PR 12 — Portal als Standard-UI (2026-06-22)

| Änderung | Beschreibung |
|----------|--------------|
| `scripts/start.ps1` | `dev` = Portal-Stack (:5173) + Docs; `cockpit-dev` = deprecated :3001 |
| `docs/FEATURE-MIGRATION.md` | Checkliste pro Planungs-Feature (Cockpit → Portal/OPP) |
| README / IT.md | Portal als Quick-Start-Default |

**Strategie:** Shell-Migration abgeschlossen; Feature-Code in `cockpit/` wird wellenweise nach `portal/` bzw. OPP überführt. Siehe [docs/FEATURE-MIGRATION.md](../docs/FEATURE-MIGRATION.md).

---

## PR 13 — Spur B: PostgreSQL, ERP-Adapter, HAE-Bridge ✓ (2026-06-22)

| Änderung | Beschreibung |
|----------|--------------|
| `PostgresPlanningStore` | OPP shadow persistence (`pcp_*` JSONB tables) |
| `db:migrate` / `db:seed` / `verify:persistence` | Backend scripts; auto-load `apps/backend/.env` |
| `load-backend-env.mjs` | Shared env loader for scripts + dev server |
| Docker Compose | Postgres host port **5433** (HAE keeps 5432) |
| `sap.s4hana` v0.2 | Fixture + OData live mode |
| `erpnext` v0.1 | Fixture + Frappe REST API |
| `hae.postgres` | Read-only HAE `hap_*` adapter; end-to-end verified |
| `planning.service.ts` | Load `.env` before singleton (HAE adapter registration) |
| CI | Postgres integration tests in `planning-platform-ci.yml` |
| Docs | Roadmap, getting started, changelog, HAE adapter guide updated |

Commits (OPP): `8071a7b` … `9b71a3c` · HAE submodule bumps: `ac5d334` … `ab62837`

**Nächste Schritte (Phase 2):** TRIC / cleaning matrix constraints, SAP PP/DS fixture, OPP ↔ OR-Tools bridge.
