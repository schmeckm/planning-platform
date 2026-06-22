import { spawnSync } from 'node:child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const oppRoot = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const dryRun = argv.includes('--dry-run');
  const skipVendor = argv.includes('--skip-vendor');
  const skipValidate = argv.includes('--skip-validate');
  const initGit = argv.includes('--init-git');
  const outArg = argv.find((arg) => arg.startsWith('--out='));
  const outDir = outArg
    ? path.resolve(outArg.slice('--out='.length))
    : path.resolve(oppRoot, '..', 'planning-platform-export');
  return { dryRun, skipVendor, skipValidate, initGit, outDir };
}

function runNode(script, args, cwd) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
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

function main() {
  const { dryRun, skipVendor, skipValidate, initGit, outDir } = parseArgs(process.argv.slice(2));

  const exportArgs = [`--out=${outDir}`];
  if (dryRun) {
    exportArgs.push('--dry-run');
  }
  if (skipVendor) {
    exportArgs.push('--skip-vendor');
  }

  runNode('scripts/export-standalone-tree.mjs', exportArgs, oppRoot);

  if (!dryRun && !skipValidate) {
    const validateArgs = [`--root=${outDir}`];
    if (skipVendor) {
      validateArgs.push('--skip-vendor');
    }
    runNode('scripts/validate-standalone-export.mjs', validateArgs, oppRoot);
  }

  if (!dryRun && initGit) {
    spawnSync('git', ['init'], { cwd: outDir, stdio: 'inherit' });
    spawnSync('git', ['add', '.'], { cwd: outDir, stdio: 'inherit' });
    const commitMsg = `Initial planning-platform export (${getSourceCommit() ?? 'unknown'})`;
    spawnSync('git', ['commit', '-m', commitMsg], { cwd: outDir, stdio: 'inherit' });
  }

  console.info('');
  console.info('Standalone promotion complete.');
  console.info(`  output: ${outDir}`);
  if (!initGit && !dryRun) {
    console.info('  next: cd output && git init && git add . && git commit');
  }
}

main();
