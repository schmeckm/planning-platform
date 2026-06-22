import { getFeatureIdForPath, findFirstAccessiblePath } from '../../../../../cockpit/src/config/features.js';
import { useAuthStore as useCockpitAuthStore } from '../../../../../cockpit/src/stores/auth.js';
import { PLANNING_PREFIX, toCockpitPath } from './pathUtils.js';

export function setupPlanningGuards(router) {
  router.beforeEach((to, _from, next) => {
    if (!to.path.startsWith(PLANNING_PREFIX)) {
      next();
      return;
    }

    const cockpitAuth = useCockpitAuthStore();
    const cockpitPath = toCockpitPath(to.path);
    const featureId = to.meta.featureId || getFeatureIdForPath(cockpitPath);

    if (!featureId || !cockpitAuth.isAuthenticated || cockpitAuth.canAccessPath(cockpitPath)) {
      next();
      return;
    }

    const fallbackPath = findFirstAccessiblePath(
      (path) => cockpitAuth.canAccessPath(path),
      cockpitPath,
    );

    if (!fallbackPath) {
      next({ path: `${PLANNING_PREFIX}/help`, query: { accessDenied: featureId } });
      return;
    }

    if (cockpitPath === fallbackPath) {
      next();
      return;
    }

    next({ path: `${PLANNING_PREFIX}${fallbackPath}`, query: { accessDenied: featureId } });
  });
}
