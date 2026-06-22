# vendor/ — HAE UI trees for standalone mode

When `open-planning-platform/` is the repository root (standalone `planning-platform`), Cockpit, Portal, styles, config, and process definitions are **not** siblings at repo root. They live here under `vendor/`.

## Populate vendor/

**From the HAE monorepo** (recommended for local dev):

```bash
pnpm sync:vendor
# or: node scripts/sync-vendor-from-hae.mjs
```

**Git submodules** (recommended for production standalone checkout):

```bash
git submodule update --init --recursive
```

See [`.gitmodules.example`](../.gitmodules.example) and [`docs/developers/repo-extraction.md`](../docs/developers/repo-extraction.md).

## Expected layout

```
vendor/
├── cockpit/src/
├── portal/frontend/src/
├── portal/frontend/public/
├── styles/
├── config/
└── process-definitions/
```

Validate:

```bash
pnpm validate:hae
```

Synced copies are gitignored; only this README is tracked. Submodule paths are committed via `.gitmodules`.
