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

\`\`\`bash
git init
git add .
git commit -m "Initial planning-platform standalone export"
git remote add origin https://github.com/your-org/planning-platform.git
git branch -M main
git push -u origin main
\`\`\`

## HAE monorepo binding

After the standalone repo exists, bind it in HAE:

\`\`\`bash
# from HAE repository root
.\\scripts\\bind-opp-submodule.ps1 -RemoteUrl https://github.com/your-org/planning-platform.git
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
