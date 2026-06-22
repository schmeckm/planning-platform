import catalog from '../../../../../config/featureCatalog.json';
import { normalizePortalRole } from '../utils/portalRole.js';

const PORTAL_TO_COCKPIT_ROLES = {
  admin: ['ADMIN'],
  user: ['DS'],
};

const ROLE_PERMISSIONS = {
  ADMIN: ['*', 'users:manage', 'rules:write'],
  MPS: [
    'orders:read', 'batches:read',
    'allocation:simulate', 'allocation:execute',
    'exceptions:read', 'exceptions:comment', 'exceptions:escalate',
    'whatif:run', 'copilot:use',
    'jobs:read', 'jobs:create', 'agents:run',
    'rules:read', 'audit:read',
  ],
  DS: [
    'orders:read', 'batches:read',
    'allocation:simulate', 'allocation:execute',
    'exceptions:read', 'exceptions:comment',
    'whatif:run', 'copilot:use',
    'jobs:read', 'jobs:create',
    'rules:read', 'audit:read',
  ],
  PLANNING_MANAGER: [
    'orders:read', 'batches:read',
    'exceptions:read', 'audit:read', 'rules:read',
    'control_tower:manage',
  ],
  REPORTING: ['orders:read', 'batches:read', 'audit:read', 'rules:read', 'exceptions:read'],
};

export function resolveCockpitRoles(portalUser) {
  const explicit = portalUser?.cockpitRoles;
  if (Array.isArray(explicit) && explicit.length > 0) {
    return explicit.filter((r) => r in ROLE_PERMISSIONS);
  }
  const portalRole = normalizePortalRole(portalUser?.role);
  return PORTAL_TO_COCKPIT_ROLES[portalRole] || ['PLANNER'];
}

function mergePermissions(roles) {
  const merged = new Set();
  for (const role of roles) {
    for (const perm of (ROLE_PERMISSIONS[role] || [])) {
      merged.add(perm);
    }
  }
  return [...merged];
}

function hasPermissionForRoles(roles, permission) {
  if (!permission) return true;
  const perms = mergePermissions(roles);
  return perms.includes('*') || perms.includes(permission);
}

export function getDefaultFeatureIdsForCockpitRoles(cockpitRoles) {
  if (cockpitRoles.includes('ADMIN')) {
    return catalog.features.map((f) => f.id);
  }
  return catalog.features
    .filter((f) => hasPermissionForRoles(cockpitRoles, f.permission))
    .filter((f) => f.defaultEnabled !== false)
    .map((f) => f.id);
}

export function getPermittedFeatureIdsForCockpitRoles(cockpitRoles) {
  if (cockpitRoles.includes('ADMIN')) {
    return catalog.features.map((f) => f.id);
  }
  return catalog.features
    .filter((f) => hasPermissionForRoles(cockpitRoles, f.permission))
    .map((f) => f.id);
}

export function cockpitPermissionsForRoles(cockpitRoles) {
  return mergePermissions(cockpitRoles);
}
