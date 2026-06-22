import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const oppRoot = path.resolve(__dirname, '..');

/** @type {{ source: string; dest: string }[]} */
const VENDOR_MAPPINGS = [
  { source: 'cockpit', dest: 'vendor/cockpit' },
  { source: 'portal/frontend', dest: 'vendor/portal/frontend' },
  { source: 'styles', dest: 'vendor/styles' },
  { source: 'config', dest: 'vendor/config' },
  { source: 'process-definitions', dest: 'vendor/process-definitions' },
];

function parseArgs(argv) {
  const dryRun = argv.includes('--dry-run');
  const sourceRootArg = argv.find((arg) => arg.startsWith('--source='));
  const sourceRoot = sourceRootArg
    ? path.resolve(sourceRootArg.slice('--source='.length))
    : path.resolve(oppRoot, '..');
  return { dryRun, sourceRoot };
}

function assertSourceExists(sourceRoot) {
  const marker = path.join(sourceRoot, 'cockpit', 'src');
  if (!fs.existsSync(marker)) {
    throw new Error(
      [
        `HAE source not found at ${sourceRoot} (expected cockpit/src).`,
        'Run from the HAE monorepo or pass --source=/path/to/hae-root.',
      ].join(' '),
    );
  }
}

function syncMapping(sourceRoot, mapping, dryRun) {
  const from = path.join(sourceRoot, mapping.source);
  const to = path.join(oppRoot, mapping.dest);

  if (!fs.existsSync(from)) {
    throw new Error(`Missing source path: ${from}`);
  }

  if (dryRun) {
    console.info(`[dry-run] ${from} → ${to}`);
    return;
  }

  fs.rmSync(to, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, { recursive: true });
  console.info(`Synced ${mapping.source} → ${mapping.dest}`);
}

function main() {
  const { dryRun, sourceRoot } = parseArgs(process.argv.slice(2));
  assertSourceExists(sourceRoot);

  console.info(`Vendor sync${dryRun ? ' (dry-run)' : ''}`);
  console.info(`  source: ${sourceRoot}`);
  console.info(`  target: ${oppRoot}/vendor/`);

  for (const mapping of VENDOR_MAPPINGS) {
    syncMapping(sourceRoot, mapping, dryRun);
  }

  if (!dryRun) {
    console.info('Done. Run pnpm validate:hae to verify.');
  }
}

main();
