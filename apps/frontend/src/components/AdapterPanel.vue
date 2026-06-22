<template>
  <div class="adapters">
    <h2 class="section-title">Data Adapters</h2>
    <p class="subtitle">
      External systems are mapped into the canonical planning model via adapters.
      No adapter can write directly to the planning kernel.
    </p>

    <div class="adapter-grid">
      <div v-for="adapter in adapters" :key="adapter.id" class="adapter-card card">
        <div class="adapter-header">
          <div :class="['adapter-status', isLive(adapter.id) ? 'status-ok' : 'status-stub']">
            {{ isLive(adapter.id) ? 'Live' : 'Stub' }}
          </div>
          <span class="adapter-version">v{{ adapter.version }}</span>
        </div>
        <div class="adapter-name">{{ adapter.name }}</div>
        <div class="adapter-system">Source: {{ adapter.sourceSystem }}</div>
        <p class="adapter-desc">{{ adapter.description }}</p>
        <button
          class="btn btn-secondary adapter-load-btn"
          :disabled="store.loading || !isLive(adapter.id)"
          @click="loadAdapter(adapter.id)"
        >
          {{ store.loading ? 'Loading…' : 'Load Data' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { usePlanningStore } from '../stores/planning.store';

const store = usePlanningStore();

interface AdapterMeta {
  id: string;
  name: string;
  version: string;
  sourceSystem: string;
  description: string;
}

const adapters = ref<AdapterMeta[]>([]);
const liveIds = new Set(['mock.pharma', 'hae.postgres']);

function isLive(id: string) {
  return liveIds.has(id);
}

async function loadAdapter(id: string) {
  await store.loadFromAdapter(id);
}

onMounted(async () => {
  try {
    const res = await axios.get<{ data: AdapterMeta[] }>('/api/pcp/v1/adapters');
    adapters.value = res.data.data;
  } catch {
    adapters.value = [
      {
        id: 'mock.pharma',
        name: 'Mock Pharma Adapter',
        version: '1.0.0',
        sourceSystem: 'MOCK',
        description: 'Development mock data for pharma and CGT scenarios.',
      },
      {
        id: 'hae.postgres',
        name: 'Hard Allocation Engine Adapter',
        version: '1.0.0',
        sourceSystem: 'HAE',
        description: 'Reads live data from the HAE PostgreSQL database.',
      },
    ];
  }
});
</script>

<style scoped>
.adapters { display: flex; flex-direction: column; gap: 24px; }
.section-title { font-size: 18px; font-weight: 600; }
.subtitle { font-size: 13px; color: var(--PCP-text-muted); max-width: 600px; }
.adapter-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.adapter-card { padding: 16px; display: flex; flex-direction: column; gap: 8px; }
.adapter-header { display: flex; align-items: center; justify-content: space-between; }
.adapter-status { font-size: 11px; font-weight: 600; padding: 2px 10px; border-radius: 10px; }
.status-ok { background: rgba(34,197,94,0.15); color: var(--PCP-success); }
.status-stub { background: rgba(124,139,161,0.15); color: var(--PCP-text-muted); }
.adapter-version { font-size: 11px; color: var(--PCP-text-muted); font-family: 'JetBrains Mono', monospace; }
.adapter-name { font-size: 14px; font-weight: 600; }
.adapter-system { font-size: 11px; color: var(--PCP-primary); }
.adapter-desc { font-size: 12px; color: var(--PCP-text-muted); line-height: 1.5; flex: 1; }
.adapter-load-btn { width: 100%; text-align: center; margin-top: 4px; }
</style>
