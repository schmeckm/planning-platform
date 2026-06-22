import { PLANNING_PREFIX } from '../cockpit/pathUtils.js';

export const DEFAULT_APP_HOME = `${PLANNING_PREFIX}/wizard`;

const BLOCKED_REDIRECT_PREFIXES = ['/login', '/auth/callback', '/forgot-password', '/reset-password'];

export function resolvePostLoginPath(options = {}) {
  const requestedRedirect = options.requestedRedirect;
  if (typeof requestedRedirect === 'string' && requestedRedirect.startsWith('/') && !requestedRedirect.startsWith('//')) {
    const blocked = BLOCKED_REDIRECT_PREFIXES.some(
      (prefix) => requestedRedirect === prefix || requestedRedirect.startsWith(`${prefix}?`),
    );
    if (!blocked) {
      return requestedRedirect;
    }
  }
  return DEFAULT_APP_HOME;
}
