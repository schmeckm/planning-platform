export const PLANNING_PREFIX = '/planning';

export function toCockpitPath(portalPath) {
  if (!portalPath.startsWith(PLANNING_PREFIX)) {
    return portalPath;
  }
  const stripped = portalPath.slice(PLANNING_PREFIX.length);
  return stripped || '/wizard';
}

export function toPortalPath(cockpitPath) {
  if (cockpitPath.startsWith(PLANNING_PREFIX)) {
    return cockpitPath;
  }
  return `${PLANNING_PREFIX}${cockpitPath.startsWith('/') ? cockpitPath : `/${cockpitPath}`}`;
}
