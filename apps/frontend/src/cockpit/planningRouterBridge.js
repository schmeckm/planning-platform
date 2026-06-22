import { PLANNING_PREFIX } from './pathUtils.js';

const PORTAL_ONLY_PREFIXES = [
  '/dashboard',
  '/login',
  '/auth',
  '/forgot-password',
  '/reset-password',
  '/register',
  '/verify-email',
  '/legal',
  '/platform',
];

function isPortalAdminRoute(path) {
  if (path === '/admin') return true;
  if (path.startsWith('/admin/data')) return false;
  return path.startsWith('/admin/');
}

function shouldPrefixPath(path) {
  if (!path.startsWith('/')) return false;
  if (path.startsWith(PLANNING_PREFIX)) return false;
  if (path === '/') return false;
  if (PORTAL_ONLY_PREFIXES.some((prefix) => path.startsWith(prefix))) return false;
  if (isPortalAdminRoute(path)) return false;
  return true;
}

function rewriteLocation(to) {
  if (typeof to === 'string') {
    return shouldPrefixPath(to) ? `${PLANNING_PREFIX}${to}` : to;
  }
  if (to && typeof to === 'object' && typeof to.path === 'string') {
    if (shouldPrefixPath(to.path)) {
      return { ...to, path: `${PLANNING_PREFIX}${to.path}` };
    }
  }
  return to;
}

export function installPlanningRouterBridge(router) {
  const originalPush = router.push.bind(router);
  const originalReplace = router.replace.bind(router);

  router.push = (to, ...args) => originalPush(rewriteLocation(to), ...args);
  router.replace = (to, ...args) => originalReplace(rewriteLocation(to), ...args);
}
