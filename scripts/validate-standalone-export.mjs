import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const REQUIRED_PATHS = [
  'package.json',
  'pnpm-workspace.yaml',
  'apps/backend/package.json',
  'apps/frontend/package.json',
  '.github/workflows/ci.yml',
  '.github/workflows/simulation.yml',
  'scripts/sync-vendor-from-hae.mjs',
  'scripts/validate-hae-integration.mjs',
  'apps/frontend/Dockerfile.standalone',
  'vendor/README.md',
];

const VENDOR_PATHS = [
  'vendor/cockpit/src',
  'vendor/portal/frontend/src',
  'vendor/styles',
  'vendor/config',
  'vendor/process-definitions',
];

function parseArgs(argv) {
  const rootArg = argv.find((arg) => arg.startsWith('--root='));
  const root = rootArg
    ? path.resolve(rootArg.slice('--root='.length))
    : path.resolve(__dirname, '..', '..', 'planning-platform-export');
  const requireVendor = !argv.includes('--skip-vendor');
  return { root, requireVendor };
}

function main() {
  const { root, requireVendor } = parseArgs(process.argv.slice(2));
  const missing = [];

  if (!fs.existsSync(root)) {
    console.error(`Export root not found: ${root}`);
    process.exit(1);
  }

  for (const rel of REQUIRED_PATHS) {
    if (!fs.existsSync(path.join(root, rel))) {
      missing.push(rel);
    }
  }

  if (requireVendor) {
    for (const rel of VENDOR_PATHS) {
      if (!fs.existsSync(path.join(root, rel))) {
        missing.push(rel);
      }
    }
  }

  const composePath = path.join(root, 'docker-compose.yml');
  if (fs.existsSync(composePath)) {
    const compose = fs.readFileSync(composePath, 'utf8');
    if (compose.includes('open-planning-platform/')) {
      missing.push('docker-compose.yml still references open-planning-platform/');
    }
    if (!compose.includes('Dockerfile.standalone')) {
      missing.push('docker-compose.yml missing standalone frontend dockerfile');
    }
  } else {
    missing.push('docker-compose.yml');
  }

  if (missing.length > 0) {
    console.error('Standalone export validation failed:', root);
    for (const item of missing) {
      console.error(`  - ${item}`);
    }
    process.exit(1);
  }

  console.info('Standalone export validation OK');
  console.info(`  root: ${root}`);
}

main();
