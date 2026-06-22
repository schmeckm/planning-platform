/** Cockpit route definitions for OPP web (prefix /planning). */
export const COCKPIT_ROUTE_DEFS = [
  { path: 'shopfloor-board', name: 'ShopfloorAddonBoard', featureId: 'shopfloor-addon-board', component: () => import('@cockpit/views/ShopfloorAddonBoardView.vue') },
  { path: 'wizard', name: 'DailyWizard', featureId: 'daily-wizard', component: () => import('@cockpit/views/DailyWizardView.vue') },
  { path: 'dashboard', name: 'PlanningDashboard', featureId: 'dashboard', component: () => import('@cockpit/views/DashboardView.vue') },
  { path: 'help', name: 'PlanningHelp', featureId: 'help', component: () => import('@cockpit/views/HelpView.vue') },
  { path: 'daily-planning', name: 'DailyPlanning', featureId: 'daily-planning', component: () => import('@cockpit/views/DailyPlanningDashboardView.vue') },
  { path: 'simulation', name: 'Simulation', featureId: 'simulation', component: () => import('@cockpit/views/SimulationView.vue') },
  { path: 'orders', name: 'Orders', featureId: 'orders', component: () => import('@cockpit/views/OrdersView.vue') },
  { path: 'allocations', name: 'Allocations', featureId: 'allocations', component: () => import('@cockpit/views/AllocationsView.vue') },
  { path: 'confirmed-assignments', name: 'ConfirmedBatchAssignments', featureId: 'confirmed-assignments', component: () => import('@cockpit/views/ConfirmedBatchAssignmentsView.vue') },
  { path: 'inventory', name: 'BatchInventory', featureId: 'inventory', component: () => import('@cockpit/views/BatchInventoryView.vue') },
  { path: 'rules', name: 'Rules', featureId: 'rules-legacy', component: () => import('@cockpit/views/RulesView.vue') },
  { path: 'reports', name: 'Reports', featureId: 'reports', component: () => import('@cockpit/views/ReportsView.vue') },
  { path: 'analytics', name: 'PerformanceAnalytics', featureId: 'analytics', component: () => import('@cockpit/views/PerformanceAnalyticsView.vue') },
  { path: 'prognosis', name: 'MlPrognosis', featureId: 'ml-prognosis', component: () => import('@cockpit/views/MlPrognosisView.vue') },
  { path: 'audit', name: 'PlanningAuditTrail', featureId: 'audit', component: () => import('@cockpit/views/AuditTrailView.vue') },
  { path: 'admin', name: 'PlanningAdministration', featureId: 'admin-system', component: () => import('@cockpit/views/AdministrationView.vue') },
  { path: 'admin/data/:entitySlug', name: 'AdminDataManagement', featureId: 'admin-data', component: () => import('@cockpit/views/admin/AdminDataLayout.vue') },
  { path: 'rule-management', name: 'RuleManagement', featureId: 'rule-management', component: () => import('@cockpit/views/v2/RuleManagementView.vue') },
  { path: 'what-if', name: 'WhatIf', featureId: 'what-if', component: () => import('@cockpit/views/v2/WhatIfView.vue') },
  { path: 'exceptions', name: 'Exceptions', featureId: 'exceptions', component: () => import('@cockpit/views/v2/ExceptionsView.vue') },
  { path: 'mass-jobs', name: 'MassJobs', featureId: 'mass-jobs', component: () => import('@cockpit/views/v2/MassJobsView.vue') },
  { path: 'copilot', name: 'Copilot', featureId: 'allocation-copilot', component: () => import('@cockpit/views/v2/CopilotView.vue') },
  { path: 'executive', name: 'ExecutiveCockpit', featureId: 'executive-cockpit', component: () => import('@cockpit/views/v3/ExecutiveCockpitView.vue') },
  { path: 'agents', name: 'AgentConsole', featureId: 'agent-console', component: () => import('@cockpit/views/v3/AgentConsoleView.vue') },
  { path: 'copilot-v3', name: 'CopilotV3', featureId: 'planning-copilot', component: () => import('@cockpit/views/v3/CopilotV3View.vue') },
  { path: 'autopilot', name: 'Autopilot', featureId: 'autopilot', component: () => import('@cockpit/views/v3/AutopilotView.vue') },
  { path: 'control-tower', name: 'ControlTower', featureId: 'control-tower', component: () => import('@cockpit/views/v4/ControlTowerView.vue') },
  { path: 'planning', name: 'Planning', featureId: 'time-planning', component: () => import('@cockpit/views/v5/PlanningHubView.vue') },
  { path: 'line-optimization', name: 'LineOptimization', featureId: 'line-optimization', component: () => import('@cockpit/views/LineOptimizationView.vue') },
  { path: 'detailed-scheduling', name: 'DetailedScheduling', featureId: 'detailed-scheduling', component: () => import('@cockpit/views/DetailedSchedulingView.vue') },
];

export function buildPlanningRoutes() {
  const routes = [];
  for (const route of COCKPIT_ROUTE_DEFS) {
    const base = {
      path: route.path,
      name: route.name,
      component: route.component,
      meta: {
        featureId: route.featureId,
        requiresAuth: true,
        isPlanning: true,
      },
    };
    if (route.name === 'AdminDataManagement') {
      routes.push({
        path: 'admin/data',
        redirect: { name: 'AdminDataManagement', params: { entitySlug: 'planning-orders' } },
      });
      base.meta.hidePageHeading = true;
      routes.push(base);
      continue;
    }
    if (route.name === 'DailyWizard') {
      base.meta.hidePageHeading = true;
    }
    routes.push(base);
  }
  return routes;
}
