import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function patchDockerCompose(root) {
  const file = path.join(root, 'docker-compose.yml');
  if (!fs.existsSync(file)) {
    return;
  }

  let content = fs.readFileSync(file, 'utf8');

  // Drop embedded monorepo frontend (HAE parent build context).
  content = content.replace(
    /\r?\n  # ─── Frontend Scheduling Board \(HAE monorepo context\)[\s\S]*?restart: unless-stopped\r?\n/,
    '\r\n',
  );

  // Promote standalone frontend to the default service name (no profile).
  content = content.replace(/frontend-standalone:/g, 'frontend:');
  content = content.replace(/opp-frontend-standalone/g, 'opp-frontend');
  content = content.replace(/\r?\n    profiles: \[standalone\]\r?\n/g, '\r\n');
  content = content.replace(
    /# Build context = OPP root\. Run pnpm sync:vendor first\. Profile: standalone\./,
    '# Build context = planning-platform repo root (vendor/ required).',
  );

  fs.writeFileSync(file, content, 'utf8');
}

function patchWorkflowComments(root) {
  const files = [
    '.github/workflows/ci.yml',
    '.github/workflows/simulation.yml',
  ];

  for (const rel of files) {
    const file = path.join(root, rel);
    if (!fs.existsSync(file)) {
      continue;
    }
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(
      /# In the HAE monorepo, the active runner is[^\n]*\n/,
      '# Canonical CI for the standalone planning-platform repository.\n',
    );
    fs.writeFileSync(file, content, 'utf8');
  }
}

function writeStandaloneReadme(root, sourceCommit) {
  const file = path.join(root, 'STANDALONE.md');
  const body = `# Standalone planning-platform export

This tree was generated from the HAE monorepo (\`open-planning-platform/\`).

| Item | Value |
|------|--------|
| Generated | ${new Date().toISOString()} |
| Source commit | ${sourceCommit || 'unknown'} |

## First push

**Wichtig:** `planning-platform-export/` ist ein **eigenes** Git-Repo. Befehle wie `git remote`/`git push` dort ausführen — nicht im HAE-Monorepo-Root (dessen `origin` zeigt auf `planningplatform`).

1. Leeres Repo auf GitHub anlegen: \`https://github.com/new\` → Name \`planning-platform\`
2. Push vom HAE-Root:

\`\`\`powershell
# HAE monorepo root
.\\scripts\\push-standalone-export.ps1 -RemoteUrl https://github.com/schmeckm/planning-platform.git
\`\`\`

Oder manuell:

\`\`\`bash
git -C planning-platform-export remote add origin https://github.com/schmeckm/planning-platform.git
git -C planning-platform-export branch -M main
git -C planning-platform-export push -u origin main
\`\`\`

## HAE monorepo binding

**Nur nach erfolgreichem Push** — vom **HAE-Monorepo-Root** (nicht aus \`planning-platform-export/\`):

\`\`\`powershell
cd ..   # falls du noch in planning-platform-export bist
.\\scripts\\bind-opp-submodule.ps1 -RemoteUrl https://github.com/schmeckm/planning-platform.git
\`\`\`

See \`docs/developers/repo-extraction.md\`.
`;
  fs.writeFileSync(file, body, 'utf8');
}

function writeExportMetadata(root, meta) {
  fs.writeFileSync(path.join(root, 'standalone.export.json'), JSON.stringify(meta, null, 2) + '\n', 'utf8');
}

export function finalizeStandaloneExport(outDir, options = {}) {
  patchDockerCompose(outDir);
  patchWorkflowComments(outDir);
  writeStandaloneReadme(outDir, options.sourceCommit);
  writeExportMetadata(outDir, {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    source: 'open-planning-platform',
    sourceCommit: options.sourceCommit ?? null,
    layout: 'standalone',
  });
}
