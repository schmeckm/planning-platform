import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@portal/stores/authStore';
import { applyCockpitAuthToStore } from '../cockpit/authBridge.js';
import { setupPlanningGuards } from '../cockpit/guards.js';
import { buildPlanningRoutes } from '../cockpit/routes.js';
import { PLANNING_PREFIX } from '../cockpit/pathUtils.js';
import { installPlanningRouterBridge } from '../cockpit/planningRouterBridge.js';
import { isPortalAdmin } from '../utils/portalRole.js';
import { resolvePostLoginPath } from '../utils/postLoginRedirect.js';

import PublicLayout from '@portal/layouts/PublicLayout.vue';
import AppLayout from '@portal/layouts/AppLayout.vue';
import CockpitEmbedLayout from '../layouts/CockpitEmbedLayout.vue';

import HomeView from '@portal/views/HomeView.vue';
import LoginView from '@portal/views/LoginView.vue';
import AuthCallbackView from '@portal/views/AuthCallbackView.vue';
import ForgotPasswordView from '@portal/views/ForgotPasswordView.vue';
import ResetPasswordView from '@portal/views/ResetPasswordView.vue';
import RegisterView from '@portal/views/RegisterView.vue';
import VerifyEmailView from '@portal/views/VerifyEmailView.vue';
import LegalPageView from '@portal/views/legal/LegalPageView.vue';
import OssLicensesView from '@portal/views/legal/OssLicensesView.vue';
import PlatformView from '@portal/views/PlatformView.vue';
import ProcessHubView from '@portal/views/process/ProcessHubView.vue';
import ProcessDomainView from '@portal/views/process/ProcessDomainView.vue';
import DashboardView from '@portal/views/DashboardView.vue';
import AppShell from '../views/AppShell.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: PublicLayout,
      children: [
        { path: '', name: 'home', component: HomeView, meta: { landingLayout: true } },
        { path: 'login', name: 'login', component: LoginView, meta: { titleKey: 'auth.login', landingLayout: true } },
        { path: 'register', name: 'register', component: RegisterView, meta: { titleKey: 'auth.registerTitle' } },
        { path: 'verify-email', name: 'verify-email', component: VerifyEmailView, meta: { titleKey: 'auth.verifyEmailTitle' } },
        { path: 'forgot-password', name: 'forgot-password', component: ForgotPasswordView, meta: { titleKey: 'auth.forgotPasswordTitle' } },
        { path: 'reset-password', name: 'reset-password', component: ResetPasswordView, meta: { titleKey: 'auth.resetPasswordTitle' } },
        { path: 'auth/callback', name: 'auth-callback', component: AuthCallbackView, meta: { titleKey: 'auth.callbackTitle' } },
        { path: 'legal/privacy', name: 'legal-privacy', component: LegalPageView, meta: { titleKey: 'legal.privacyTitle', legalPage: 'privacy' } },
        { path: 'legal/impressum', name: 'legal-impressum', component: LegalPageView, meta: { titleKey: 'legal.impressumTitle', legalPage: 'impressum' } },
        { path: 'legal/oss', name: 'legal-oss', component: OssLicensesView, meta: { titleKey: 'legal.ossTitle' } },
        { path: 'platform', name: 'platform', component: PlatformView, meta: { titleKey: 'platform.title', landingLayout: true } },
        {
          path: 'platform/processes',
          name: 'platform-processes',
          component: ProcessHubView,
          meta: { titleKey: 'platform.processes.title', landingLayout: true },
        },
        {
          path: 'platform/processes/commercial-pharma',
          name: 'platform-process-commercial',
          component: ProcessDomainView,
          meta: { titleKey: 'platform.pharmaPackaging.title', landingLayout: true },
        },
        {
          path: 'platform/processes/clinical-pharma',
          name: 'platform-process-clinical',
          component: ProcessDomainView,
          meta: { titleKey: 'platform.clinicalPackaging.title', landingLayout: true },
        },
        {
          path: 'platform/processes/cgt',
          name: 'platform-process-cgt',
          component: ProcessDomainView,
          meta: { titleKey: 'platform.cgtPackaging.title', landingLayout: true },
        },
      ],
    },
    {
      path: '/',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: DashboardView,
          meta: { titleKey: 'nav.dashboard' },
        },
        {
          path: 'platform/opp',
          name: 'opp-scheduling',
          component: AppShell,
          meta: { titleKey: 'platform.title' },
        },
        {
          path: 'planning',
          component: CockpitEmbedLayout,
          meta: { isPlanning: true },
          children: [
            { path: '', redirect: { name: 'DailyWizard' } },
            ...buildPlanningRoutes(),
          ],
        },
      ],
    },
    {
      path: PLANNING_PREFIX,
      redirect: `${PLANNING_PREFIX}/wizard`,
    },
  ],
});

setupPlanningGuards(router);
installPlanningRouterBridge(router);

router.beforeEach(async (to, _from, next) => {
  const auth = useAuthStore();

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return next({ name: 'login', query: { redirect: to.fullPath } });
  }

  if (to.meta.requiresAdmin && !isPortalAdmin(auth.user?.role)) {
    return next({ name: 'dashboard' });
  }

  if (to.name === 'login' && auth.isAuthenticated) {
    return next({ path: resolvePostLoginPath({ requestedRedirect: to.query.redirect }) });
  }

  if (auth.isAuthenticated && (to.path.startsWith(PLANNING_PREFIX) || to.meta.requiresAuth)) {
    try {
      await applyCockpitAuthToStore(auth.user);
    } catch {
      // Cockpit session falls back to offline profile
    }
  }

  next();
});

export default router;
