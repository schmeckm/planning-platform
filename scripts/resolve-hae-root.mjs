import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const oppRoot = path.resolve(__dirname, '..');
const defaultFrontendDir = path.resolve(oppRoot, 'apps/frontend');

/**
 * Resolves the Hard Allocation Engine monorepo root (parent of open-planning-platform/).
 * Override with HAE_MONOREPO_ROOT for submodule or custom checkout layouts.
 */
export function resolveHaeMonorepoRoot(fromDir = defaultFrontendDir) {
  const candidates = [];

  if (process.env.HAE_MONOREPO_ROOT) {
    candidates.push(path.resolve(process.env.HAE_MONOREPO_ROOT));
  }

  // open-planning-platform/ inside HAE monorepo
  candidates.push(path.resolve(fromDir, '../../..'));

  // Standalone planning-platform with vendor/ checkouts (PR 9 target layout)
  candidates.push(oppRoot);
  candidates.push(path.resolve(oppRoot, 'vendor'));

  for (const root of candidates) {
    if (hasEmbeddedUi(root)) {
      return root;
    }
    if (hasVendorLayout(root)) {
      return root;
    }
  }

  throw new Error(
    [
      'HAE integration paths not found.',
      'Set HAE_MONOREPO_ROOT to the directory that contains cockpit/, portal/, and styles/',
      'or use the vendor/ layout documented in docs/developers/hae-integration.md.',
    ].join(' '),
  );
}

function hasEmbeddedUi(root) {
  return (
    fs.existsSync(path.join(root, 'cockpit', 'src')) &&
    fs.existsSync(path.join(root, 'portal', 'frontend', 'src'))
  );
}

function hasVendorLayout(root) {
  return (
    fs.existsSync(path.join(root, 'vendor', 'cockpit', 'src')) &&
    fs.existsSync(path.join(root, 'vendor', 'portal', 'frontend', 'src'))
  );
}

export function resolveHaePaths(haeRoot) {
  const useVendor = fs.existsSync(path.join(haeRoot, 'vendor', 'cockpit', 'src'));
  const base = useVendor ? path.join(haeRoot, 'vendor') : haeRoot;

  return {
    haeRoot,
    cockpitSrc: path.join(base, 'cockpit/src'),
    portalSrc: path.join(base, 'portal/frontend/src'),
    portalPublic: path.join(base, 'portal/frontend/public'),
    styles: path.join(base, 'styles'),
    config: path.join(base, 'config'),
    processDefinitions: path.join(base, 'process-definitions'),
  };
}
