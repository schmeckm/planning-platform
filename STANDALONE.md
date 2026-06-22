# Standalone planning-platform export

This tree was generated from the HAE monorepo (`open-planning-platform/`).

| Item | Value |
|------|--------|
| Generated | 2026-06-22T18:08:01.910Z |
| Source commit | 77dd8a2cfb892dfc37283286457a676430afd04f |

## First push

```bash
git init
git add .
git commit -m "Initial planning-platform standalone export"
git remote add origin https://github.com/your-org/planning-platform.git
git branch -M main
git push -u origin main
```

## HAE monorepo binding

After the standalone repo exists, bind it in HAE:

```bash
# from HAE repository root
.\scripts\bind-opp-submodule.ps1 -RemoteUrl https://github.com/your-org/planning-platform.git
```

See `docs/developers/repo-extraction.md`.
