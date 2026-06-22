import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const oppRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(oppRoot, '..');

const replacements = [
  ['open-planning-platform/apps/docs', 'open-planning-platform/docs'],
  ['open-planning-platform/apps/api', 'open-planning-platform/apps/backend'],
  ['open-planning-platform/apps/web', 'open-planning-platform/apps/frontend'],
  ['@PCP/api', '@PCP/backend'],
  ['@PCP/web', '@PCP/frontend'],
  ['@pcp/api', '@PCP/backend'],
  ['@pcp/web', '@PCP/frontend'],
  ['apps/api', 'apps/backend'],
  ['apps/web', 'apps/frontend'],
  ['apps/docs', 'docs'],
  ['/apps/docs/', '/docs/'],
  ['pnpm --filter @opp/api', 'pnpm --filter @PCP/backend'],
];

const extraFiles = [
  path.join(repoRoot, 'README.md'),
  path.join(repoRoot, 'docs', 'IT.md'),
  path.join(repoRoot, 'wiki', 'Home.md'),
  path.join(repoRoot, 'wiki', 'IT-und-Engineering.md'),
  path.join(repoRoot, '.github', 'workflows', 'opp-ci.yml'),
  path.join(repoRoot, '.github', 'ISSUE_TEMPLATE', 'config.yml'),
  path.join(repoRoot, '.github', 'ISSUE_TEMPLATE', 'industry_pack_proposal.yml'),
  path.join(repoRoot, 'portal', 'frontend', 'src', 'config', 'githubIssuePresets.js'),
];

const skipDir = new Set(['node_modules', 'dist', '.git']);
const skipPath = /\.vitepress[\\/]cache/;

function apply(content) {
  let next = content;
  for (const [from, to] of replacements) {
    next = next.split(from).join(to);
  }
  return next;
}

function walkDir(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDir.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (skipPath.test(full)) continue;
    if (entry.isDirectory()) walkDir(full, files);
    else if (/\.(md|yml|yaml|ts|js|json|ps1)$/.test(entry.name)) files.push(full);
  }
  return files;
}

let changed = 0;
const files = [...walkDir(oppRoot), ...extraFiles.filter((f) => fs.existsSync(f))];
for (const file of files) {
  if (file.endsWith('migrate-refs-pr1-3.mjs')) continue;
  const original = fs.readFileSync(file, 'utf8');
  const updated = apply(original);
  if (updated !== original) {
    fs.writeFileSync(file, updated);
    changed += 1;
  }
}

console.log(`Updated ${changed} files`);
