import {
  resolveCockpitRoles,
  getDefaultFeatureIdsForCockpitRoles,
  getPermittedFeatureIdsForCockpitRoles,
  cockpitPermissionsForRoles,
} from './portalFeatureCatalog.js';
import { mergeAlwaysOnFeatures } from './featureAccess.js';
import { normalizePortalRole } from '../utils/portalRole.js';

const PORTAL_ROLE_TO_USERNAME = {
  admin: 'admin',
  user: 'ds',
};

const FALLBACK_SESSIONS = {
  admin: {
    userId: 'USR-ADMIN01',
    username: 'admin',
    displayName: 'Portal Administrator',
    role: 'ADMIN',
    roles: ['ADMIN'],
    permissions: ['*', 'users:manage', 'rules:write'],
  },
  user: {
    userId: 'USR-DS01',
    username: 'ds',
    displayName: 'Portal User',
    role: 'DS',
    roles: ['DS'],
    permissions: [
      'orders:read', 'batches:read', 'allocation:simulate', 'allocation:execute',
      'exceptions:read', 'exceptions:comment', 'whatif:run', 'copilot:use',
      'jobs:read', 'jobs:create', 'rules:read', 'audit:read',
    ],
  },
};

function resolveFeatureIds(portalUser, cockpitRoles) {
  const portalRole = normalizePortalRole(portalUser?.role);
  const defaults = getDefaultFeatureIdsForCockpitRoles(cockpitRoles);
  const custom = portalUser?.preferences?.enabledFeatures;

  if (!Array.isArray(custom)) {
    return {
      enabledFeatureIds: mergeAlwaysOnFeatures(portalRole, defaults),
      usesCustomFeatures: false,
    };
  }

  const permitted = new Set(getPermittedFeatureIdsForCockpitRoles(cockpitRoles));
  return {
    enabledFeatureIds: mergeAlwaysOnFeatures(
      portalRole,
      custom.filter((id) => permitted.has(id)),
    ),
    usesCustomFeatures: true,
  };
}

function enrichSession(base, portalUser) {
  const cockpitRoles = resolveCockpitRoles(portalUser);
  const primaryRole = cockpitRoles[0] ?? 'PLANNER';
  const permissions = cockpitPermissionsForRoles(cockpitRoles);
  const featureState = resolveFeatureIds(portalUser, cockpitRoles);

  return {
    ...base,
    role: primaryRole,
    roles: cockpitRoles,
    isManager: cockpitRoles.includes('PLANNING_MANAGER'),
    permissions,
    displayName: portalUser.displayName || base.displayName,
    email: portalUser.email,
    portalUserId: portalUser.id,
    ...featureState,
  };
}

export async function syncCockpitAuthFromPortal(portalUser) {
  if (!portalUser) {
    localStorage.removeItem('hap_user');
    return null;
  }

  const portalRole = normalizePortalRole(portalUser.role);
  const loginUsername = PORTAL_ROLE_TO_USERNAME[portalRole] || 'planner';

  try {
    const { apiV2 } = await import('../../../../../cockpit/src/api/v2.js');
    const session = await apiV2.login(loginUsername);
    const enriched = enrichSession(session, portalUser);
    localStorage.setItem('hap_user', JSON.stringify(enriched));
    return enriched;
  } catch {
    const fallback = enrichSession(FALLBACK_SESSIONS[portalRole] ?? FALLBACK_SESSIONS.user, portalUser);
    localStorage.setItem('hap_user', JSON.stringify(fallback));
    return fallback;
  }
}

export async function applyCockpitAuthToStore(portalUser) {
  const session = await syncCockpitAuthFromPortal(portalUser);
  if (!session) {
    return null;
  }

  const { useAuthStore } = await import('../../../../../cockpit/src/stores/auth.js');
  const cockpitAuth = useAuthStore();
  cockpitAuth.setUserSession(session);
  return session;
}

export function clearCockpitAuth() {
  localStorage.removeItem('hap_user');
}
