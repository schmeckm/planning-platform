import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'node:child_process';
import { finalizeStandaloneExport } from './finalize-standalone-export.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const oppRoot = path.resolve(__dirname, '..');

const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  '.git',
  '.runtime',
  'vendor',
  'cache',
  '.temp',
]);

const SKIP_FILES = new Set(['.DS_Store', 'Thumbs.db']);

const SKIP_EXTENSIONS = new Set(['.tsbuildinfo']);

function parseArgs(argv) {
  const dryRun = argv.includes('--dry-run');
  const skipVendor = argv.includes('--skip-vendor');
  const outArg = argv.find((arg) => arg.startsWith('--out='));
  const outDir = outArg
    ? path.resolve(outArg.slice('--out='.length))
    : path.resolve(oppRoot, '..', 'planning-platform-export');
  return { dryRun, skipVendor, outDir };
}

function shouldSkipEntry(name) {
  return SKIP_DIRS.has(name) || SKIP_FILES.has(name) ||
    SKIP_EXTENSIONS.has(path.extname(name));
}

function copyTree(from, to, dryRun) {
  if (!fs.existsSync(from)) {
    return;
  }

  const stat = fs.statSync(from);
  if (stat.isDirectory()) {
    if (!dryRun) {
      fs.mkdirSync(to, { recursive: true });
    }
    for (const entry of fs.readdirSync(from)) {
      if (shouldSkipEntry(entry)) {
        continue;
      }
      copyTree(path.join(from, entry), path.join(to, entry), dryRun);
    }
    return;
  }

  if (dryRun) {
    console.info(`[dry-run] file ${path.relative(oppRoot, from)}`);
    return;
  }

  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

function getSourceCommit() {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], {
    cwd: path.resolve(oppRoot, '..'),
    encoding: 'utf8',
  });
  if (result.status === 0) {
    return result.stdout.trim();
  }
  return null;
}

function runVendorSync(targetRoot, dryRun) {
  const haeRoot = path.resolve(oppRoot, '..');
  const syncScript = path.join(targetRoot, 'scripts', 'sync-vendor-from-hae.mjs');
  if (!fs.existsSync(syncScript)) {
    throw new Error(`Sync script missing in export: ${syncScript}`);
  }

  const args = ['scripts/sync-vendor-from-hae.mjs', `--source=${haeRoot}`];
  if (dryRun) {
    args.push('--dry-run');
  }

  console.info(`Populating vendor/ from ${haeRoot}`);
  const result = spawnSync(process.execPath, args, {
    cwd: targetRoot,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function main() {
  const { dryRun, skipVendor, outDir } = parseArgs(process.argv.slice(2));

  console.info(`Export standalone tree${dryRun ? ' (dry-run)' : ''}`);
  console.info(`  from: ${oppRoot}`);
  console.info(`  to:   ${outDir}`);

  if (!dryRun) {
    fs.rmSync(outDir, { recursive: true, force: true });
    fs.mkdirSync(outDir, { recursive: true });
  }

  for (const entry of fs.readdirSync(oppRoot)) {
    if (shouldSkipEntry(entry)) {
      continue;
    }
    copyTree(path.join(oppRoot, entry), path.join(outDir, entry), dryRun);
  }

  if (!skipVendor) {
    runVendorSync(outDir, dryRun);
    if (!dryRun) {
      const vendorReadme = path.join(oppRoot, 'vendor', 'README.md');
      const destReadme = path.join(outDir, 'vendor', 'README.md');
      if (fs.existsSync(vendorReadme)) {
        fs.mkdirSync(path.dirname(destReadme), { recursive: true });
        fs.copyFileSync(vendorReadme, destReadme);
      }
    }
  }

  if (!dryRun) {
    finalizeStandaloneExport(outDir, { sourceCommit: getSourceCommit() });
  }

  console.info('');
  console.info('Next steps (new standalone repository):');
  console.info(`  pnpm promote:standalone --out=${outDir}   # re-run with validation`);
  console.info(`  cd ${outDir}`);
  console.info('  git init && git add . && git commit -m "Initial planning-platform export"');
  console.info('  git remote add origin https://github.com/your-org/planning-platform.git');
  console.info('  git push -u origin main');
}

main();
