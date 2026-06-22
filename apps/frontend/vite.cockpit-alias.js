import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveHaeMonorepoRoot, resolveHaePaths } from '../../scripts/resolve-hae-root.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webSrc = path.resolve(__dirname, './src');
const haePaths = resolveHaePaths(resolveHaeMonorepoRoot(__dirname));
const { cockpitSrc, portalSrc, config: configDir, processDefinitions: processDefinitionsDir } = haePaths;

function existsAsModule(basePath) {
  const fileCandidates = [`${basePath}.js`, `${basePath}.vue`, `${basePath}.json`, `${basePath}.ts`];
  for (const candidate of fileCandidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  const indexCandidate = path.join(basePath, 'index.js');
  if (fs.existsSync(indexCandidate)) {
    return indexCandidate;
  }

  if (fs.existsSync(basePath) && fs.statSync(basePath).isFile()) {
    return basePath;
  }

  return null;
}

function isCockpitImporter(importer) {
  if (!importer) return false;
  const normalized = importer.replace(/\\/g, '/');
  return normalized.includes('/cockpit/src/') || normalized.includes('/vendor/cockpit/src/');
}

function isPortalImporter(importer) {
  if (!importer) return false;
  const normalized = importer.replace(/\\/g, '/');
  return normalized.includes('/portal/frontend/src/') || normalized.includes('/vendor/portal/frontend/src/');
}

export function cockpitAliasPlugin() {
  return {
    name: 'cockpit-alias',
    enforce: 'pre',
    resolveId(source, importer) {
      if (source === 'primevue' || source.startsWith('primevue/')) {
        return path.resolve(__dirname, 'node_modules', source);
      }

      if (source.startsWith('@config/')) {
        return path.resolve(configDir, source.slice('@config/'.length));
      }

      if (source.startsWith('@process-definitions/')) {
        return path.resolve(processDefinitionsDir, source.slice('@process-definitions/'.length));
      }

      if (source.startsWith('@portal/')) {
        return path.resolve(portalSrc, source.slice('@portal/'.length));
      }

      if (source.startsWith('@cockpit/')) {
        return path.resolve(cockpitSrc, source.slice('@cockpit/'.length));
      }

      if (!source.startsWith('@/')) {
        return null;
      }

      const rel = source.slice(2);
      let bases;
      if (isCockpitImporter(importer)) {
        bases = [cockpitSrc, webSrc, portalSrc];
      } else if (isPortalImporter(importer)) {
        bases = [portalSrc, cockpitSrc, webSrc];
      } else {
        bases = [webSrc, portalSrc, cockpitSrc];
      }

      for (const base of bases) {
        const candidate = existsAsModule(path.resolve(base, rel));
        if (candidate) {
          return candidate;
        }
      }

      return path.resolve(cockpitSrc, rel);
    },
  };
}
