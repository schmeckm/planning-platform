<template>
  <div class="app">
    <header class="app-header">
      <div class="header-brand">
        <img src="/logo.svg" alt="" class="brand-icon" />
        <div>
          <h1>Open Planning Platform</h1>
          <p class="brand-tagline">Modular · Extensible · Open</p>
        </div>
      </div>
      <nav class="header-nav">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['nav-btn', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </nav>
      <div class="header-actions">
        <button class="btn btn-secondary shopfloor-link" type="button" @click="openShopfloorBoard">
          Shopfloor Board
        </button>
        <span v-if="auth.user" class="user-label">{{ auth.user.email }}</span>
        <button class="btn btn-secondary" @click="loadHaeData" :disabled="store.loading">
          {{ store.loading ? 'Loading…' : 'Load HAE Data' }}
        </button>
        <button class="btn btn-primary" @click="runSim" :disabled="store.loading || store.orders.length === 0">
          {{ store.loading ? 'Running…' : 'Run Simulation' }}
        </button>
        <button class="btn btn-secondary" @click="logout">Logout</button>
      </div>
    </header>

    <div v-if="store.error" class="global-error">
      <span>{{ store.error }}</span>
      <button @click="store.error = null">×</button>
    </div>

    <main class="app-main">
      <div v-if="activeTab === 'board'" class="tab-content">
        <SchedulingBoard />
      </div>
      <div v-if="activeTab === 'results'" class="tab-content">
        <SimulationResults />
      </div>
      <div v-if="activeTab === 'constraints'" class="tab-content">
        <ConstraintExplorer />
      </div>
      <div v-if="activeTab === 'adapters'" class="tab-content">
        <AdapterPanel />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { usePlanningStore } from '../stores/planning.store';
import { useAuthStore } from '@portal/stores/authStore';
import SchedulingBoard from '../components/SchedulingBoard.vue';
import SimulationResults from '../components/SimulationResults.vue';
import ConstraintExplorer from '../components/ConstraintExplorer.vue';
import AdapterPanel from '../components/AdapterPanel.vue';

const store = usePlanningStore();
const auth = useAuthStore();
const router = useRouter();
const activeTab = ref('board');

const tabs = [
  { id: 'board', label: 'Scheduling Board' },
  { id: 'results', label: 'Simulation Results' },
  { id: 'constraints', label: 'Constraints' },
  { id: 'adapters', label: 'Adapters' },
];

async function loadHaeData() {
  await store.loadFromAdapter('hae.postgres');
}

async function runSim() {
  await store.runSimulation(`Simulation ${new Date().toLocaleTimeString()}`);
  activeTab.value = 'results';
}

function logout() {
  auth.logout();
  router.push('/login');
}

function openShopfloorBoard() {
  router.push('/planning/shopfloor-board');
}

onMounted(async () => {
  await store.fetchAll().catch(() => null);
  await store.fetchSimulations().catch(() => null);
  if (store.orders.length === 0) {
    await store.loadFromAdapter('hae.postgres').catch(() => null);
  }
});
</script>

<style scoped>
.app { display: flex; flex-direction: column; min-height: 100vh; }

.app-header {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 0 24px;
  height: 64px;
  background: var(--PCP-surface);
  border-bottom: 1px solid var(--PCP-border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 220px;
}

.brand-icon {
  width: 32px;
  height: 32px;
}

.header-brand h1 {
  font-size: 15px;
  font-weight: 700;
  color: var(--PCP-text);
  white-space: nowrap;
}

.brand-tagline {
  font-size: 11px;
  color: var(--PCP-text-muted);
  margin-top: 1px;
}

.header-nav {
  display: flex;
  gap: 4px;
  flex: 1;
}

.nav-btn {
  padding: 6px 14px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--PCP-radius);
  color: var(--PCP-text-muted);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.nav-btn:hover { color: var(--PCP-text); background: var(--PCP-surface2); }
.nav-btn.active {
  color: var(--PCP-primary);
  background: rgba(99,102,241,0.12);
  border-color: rgba(99,102,241,0.3);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-label {
  font-size: 12px;
  color: var(--PCP-text-muted);
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.shopfloor-link {
  white-space: nowrap;
}

.global-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 24px;
  background: rgba(239,68,68,0.12);
  border-bottom: 1px solid rgba(239,68,68,0.3);
  color: #fca5a5;
  font-size: 13px;
}

.global-error button {
  background: none;
  border: none;
  color: #fca5a5;
  cursor: pointer;
  font-size: 16px;
}

.app-main { flex: 1; overflow: auto; }
.tab-content { padding: 24px; }
</style>
