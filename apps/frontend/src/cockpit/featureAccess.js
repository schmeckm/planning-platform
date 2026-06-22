import catalog from '../../../../../config/featureCatalog.json';
import { normalizePortalRole } from '../utils/portalRole.js';

export function getAdminAlwaysOnFeatureIds(portalRole) {
  if (normalizePortalRole(portalRole) !== 'admin') {
    return [];
  }
  return catalog.features
    .filter((f) => f.section === 'governance' || f.permission === 'users:manage')
    .map((f) => f.id);
}

export function mergeAlwaysOnFeatures(portalRole, featureIds) {
  const merged = new Set(featureIds);
  for (const id of getAdminAlwaysOnFeatureIds(portalRole)) {
    merged.add(id);
  }
  return [...merged];
}
