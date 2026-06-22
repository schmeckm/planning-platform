/** Normalizes portal role from DB/API. */
export function normalizePortalRole(role) {
  return String(role || 'user').trim().toLowerCase() === 'admin' ? 'admin' : 'user';
}

export function isPortalAdmin(role) {
  return normalizePortalRole(role) === 'admin';
}

export function isManager(cockpitRoles) {
  return Array.isArray(cockpitRoles) && cockpitRoles.includes('PLANNING_MANAGER');
}

export function isCockpitAdmin(cockpitRoles) {
  return Array.isArray(cockpitRoles) && cockpitRoles.includes('ADMIN');
}
