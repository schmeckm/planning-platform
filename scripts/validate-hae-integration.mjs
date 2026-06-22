import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveHaeMonorepoRoot, resolveHaePaths } from './resolve-hae-root.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.resolve(__dirname, '../config/hae-integration.manifest.json');

function main() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const haeRoot = resolveHaeMonorepoRoot();
  const paths = resolveHaePaths(haeRoot);
  const missing = [];

  for (const entry of manifest.requiredPaths) {
    const absolute = path.join(haeRoot, entry.path);
    const vendorAbsolute = path.join(haeRoot, 'vendor', entry.path);
    if (!fs.existsSync(absolute) && !fs.existsSync(vendorAbsolute)) {
      missing.push({ id: entry.id, path: entry.path, purpose: entry.purpose });
    }
  }

  if (missing.length > 0) {
    console.error('HAE integration validation failed. Missing paths relative to', haeRoot);
    for (const item of missing) {
      console.error(`  - ${item.id}: ${item.path} (${item.purpose})`);
    }
    console.error(`Set ${manifest.envVar} or add git submodules — see docs/developers/hae-integration.md`);
    process.exit(1);
  }

  const layout = fs.existsSync(path.join(haeRoot, 'vendor', 'cockpit', 'src'))
    ? 'vendor'
    : 'embedded';

  console.info('HAE integration OK');
  console.info(`  layout:  ${layout}`);
  console.info(`  root:    ${haeRoot}`);
  console.info(`  cockpit: ${paths.cockpitSrc}`);
  console.info(`  portal:  ${paths.portalSrc}`);
}

main();
