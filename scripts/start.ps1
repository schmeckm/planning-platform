# Delegates to the repo-root startup script (Hard Allocation Engine/scripts/start.ps1).
# Run from open-planning-platform:  .\scripts\start.ps1 portal -WithDocs

$ErrorActionPreference = 'Stop'
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$RootScript = Join-Path $RepoRoot 'scripts\start.ps1'

if (-not (Test-Path $RootScript)) {
  Write-Error "Root script not found: $RootScript"
  exit 1
}

& $RootScript @args
