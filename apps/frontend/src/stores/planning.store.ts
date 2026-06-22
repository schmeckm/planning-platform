import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';

const api = axios.create({ baseURL: '/api/pcp/v1' });

function readPortalToken(): string | null {
  try {
    const raw = localStorage.getItem('portal.auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: string };
    return parsed.token ?? null;
  } catch {
    return null;
  }
}

api.interceptors.request.use((config) => {
  const token = readPortalToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface PlanningOrder {
  id: string;
  externalId?: string;
  materialId: string;
  batchId?: string;
  quantity: number;
  unit: string;
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
  status: string;
  schedulingStatus: 'FEASIBLE' | 'INFEASIBLE' | 'SOFT_VIOLATION' | 'UNSCHEDULED' | 'PENDING';
  earliestStart: string;
  latestFinish: string;
  scheduledStart?: string;
  scheduledFinish?: string;
  patientId?: string;
  tags: Record<string, string>;
}

export interface SimulationResult {
  orderId: string;
  schedulingStatus: string;
  scheduledStart?: string;
  scheduledFinish?: string;
  score?: number;
  explanation: string;
  constraintResults: ConstraintResult[];
}

export interface ConstraintResult {
  constraintId: string;
  constraintVersion: string;
  severity: string;
  passed: boolean;
  score: number;
  message: string;
  explanation: string;
  correctionHint?: string;
}

export interface SimulationRun {
  id: string;
  name: string;
  startedAt: string;
  finishedAt?: string;
  status: string;
  results: SimulationResult[];
  metadata: { summary?: Record<string, number>; durationMs?: number };
}

export interface ConstraintPlugin {
  id: string;
  version: string;
  name: string;
  description: string;
  domain: string;
  defaultSeverity: string;
  tags: string[];
}

export const usePlanningStore = defineStore('planning', () => {
  const orders = ref<PlanningOrder[]>([]);
  const resources = ref<unknown[]>([]);
  const batches = ref<unknown[]>([]);
  const materials = ref<unknown[]>([]);
  const simulations = ref<SimulationRun[]>([]);
  const constraints = ref<ConstraintPlugin[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const activeSimulation = ref<SimulationRun | null>(null);

  const feasibleOrders = computed(() =>
    orders.value.filter(o => o.schedulingStatus === 'FEASIBLE'),
  );
  const infeasibleOrders = computed(() =>
    orders.value.filter(o => o.schedulingStatus === 'INFEASIBLE'),
  );
  const pendingOrders = computed(() =>
    orders.value.filter(o => o.schedulingStatus === 'PENDING' || o.schedulingStatus === 'UNSCHEDULED'),
  );

  async function loadFromAdapter(adapterId = 'mock.pharma') {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.post('/simulations/load-adapter', { adapterId });
      await fetchAll();
      return res.data;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function fetchAll() {
    const [ordersRes, resourcesRes, batchesRes, materialsRes, constraintsRes] = await Promise.all([
      api.get<{ data: PlanningOrder[] }>('/orders'),
      api.get<{ data: unknown[] }>('/resources'),
      api.get<{ data: unknown[] }>('/batches'),
      api.get<{ data: unknown[] }>('/materials'),
      api.get<{ data: ConstraintPlugin[] }>('/constraints'),
    ]);
    orders.value = ordersRes.data.data;
    resources.value = resourcesRes.data.data;
    batches.value = batchesRes.data.data;
    materials.value = materialsRes.data.data;
    constraints.value = constraintsRes.data.data;
  }

  async function runSimulation(name = 'Manual Simulation Run') {
    loading.value = true;
    error.value = null;
    try {
      const res = await api.post<SimulationRun>('/simulations', {
        name,
        triggeredBy: 'planner',
      });
      activeSimulation.value = res.data;
      await fetchAll();
      const simsRes = await api.get<{ data: SimulationRun[] }>('/simulations');
      simulations.value = simsRes.data.data;
      return res.data;
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function fetchSimulations() {
    const res = await api.get<{ data: SimulationRun[] }>('/simulations');
    simulations.value = res.data.data;
  }

  return {
    orders,
    resources,
    batches,
    materials,
    simulations,
    constraints,
    loading,
    error,
    activeSimulation,
    feasibleOrders,
    infeasibleOrders,
    pendingOrders,
    loadFromAdapter,
    fetchAll,
    runSimulation,
    fetchSimulations,
  };
});
