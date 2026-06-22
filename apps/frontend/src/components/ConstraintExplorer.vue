<template>
  <div class="explorer">
    <div class="explorer-header">
      <h2 class="section-title">Constraint Plugin Registry</h2>
      <div class="explorer-controls">
        <select v-model="domainFilter" class="domain-select">
          <option value="">All Domains</option>
          <option v-for="d in domains" :key="d" :value="d">{{ d }}</option>
        </select>
        <button class="btn btn-secondary" @click="runSelfTest" :disabled="selfTesting">
          {{ selfTesting ? '⟳ Testing...' : '⊕ Run Self-Tests' }}
        </button>
      </div>
    </div>

    <div v-if="selfTestResult" class="self-test-summary" :class="selfTestResult.allPassed ? 'passed' : 'failed'">
      <span>{{ selfTestResult.allPassed ? '✓ All self-tests passed' : '✕ Some self-tests failed' }}</span>
      <span>{{ selfTestResult.passedPlugins }}/{{ selfTestResult.totalPlugins }} plugins healthy</span>
    </div>

    <div class="plugin-grid">
      <div
        v-for="plugin in filteredPlugins"
        :key="plugin.id"
        class="plugin-card card"
        :class="{ 'plugin-card--selected': selectedPlugin?.id === plugin.id }"
        @click="selectedPlugin = selectedPlugin?.id === plugin.id ? null : plugin"
      >
        <div class="plugin-header">
          <div class="plugin-domain-badge" :class="`domain-${plugin.domain.toLowerCase()}`">
            {{ plugin.domain }}
          </div>
          <div class="plugin-version">v{{ plugin.version }}</div>
        </div>
        <div class="plugin-name">{{ plugin.name }}</div>
        <div class="plugin-id">{{ plugin.id }}</div>
        <div class="plugin-tags">
          <span v-for="tag in plugin.tags.slice(0, 4)" :key="tag" class="tag">{{ tag }}</span>
        </div>

        <div v-if="selectedPlugin?.id === plugin.id" class="plugin-detail">
          <p>{{ plugin.description }}</p>
          <div class="detail-row-sm">
            <span class="dr-label">Default Severity</span>
            <span :class="['badge', `sev-badge-${plugin.defaultSeverity.toLowerCase()}`]">
              {{ plugin.defaultSeverity }}
            </span>
          </div>
        </div>

        <div v-if="selfTestResult" class="plugin-test-status">
          <template v-for="r in selfTestResult.results" :key="r.pluginId">
            <div v-if="r.pluginId === plugin.id" :class="r.passed ? 'test-pass' : 'test-fail'">
              {{ r.passed ? `✓ ${r.testsPassed} tests passed` : `✕ ${r.testsFailed} tests failed` }}
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { usePlanningStore } from '../stores/planning.store';
import type { ConstraintPlugin } from '../stores/planning.store';
import axios from 'axios';

const store = usePlanningStore();
const domainFilter = ref('');
const selectedPlugin = ref<ConstraintPlugin | null>(null);
const selfTesting = ref(false);
const selfTestResult = ref<Record<string, unknown> | null>(null);

const domains = computed(() => [...new Set(store.constraints.map(c => c.domain))].sort());

const filteredPlugins = computed(() =>
  domainFilter.value
    ? store.constraints.filter(c => c.domain === domainFilter.value)
    : store.constraints,
);

async function runSelfTest() {
  selfTesting.value = true;
  try {
    const res = await axios.post('/api/pcp/v1/constraints/self-test');
    selfTestResult.value = res.data;
  } finally {
    selfTesting.value = false;
  }
}
</script>

<style scoped>
.explorer { display: flex; flex-direction: column; gap: 20px; }

.explorer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.section-title { font-size: 18px; font-weight: 600; }
.explorer-controls { display: flex; gap: 8px; align-items: center; }

.domain-select {
  background: var(--PCP-surface2);
  border: 1px solid var(--PCP-border);
  border-radius: var(--PCP-radius);
  color: var(--PCP-text);
  padding: 7px 12px;
  font-size: 13px;
  cursor: pointer;
}

.self-test-summary {
  display: flex;
  justify-content: space-between;
  padding: 10px 16px;
  border-radius: var(--PCP-radius);
  font-size: 13px;
  font-weight: 600;
}

.self-test-summary.passed { background: rgba(34,197,94,0.1); color: var(--PCP-success); border: 1px solid rgba(34,197,94,0.3); }
.self-test-summary.failed { background: rgba(239,68,68,0.1); color: var(--PCP-danger); border: 1px solid rgba(239,68,68,0.3); }

.plugin-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }

.plugin-card {
  padding: 14px;
  cursor: pointer;
  transition: border-color 0.15s;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.plugin-card:hover { border-color: var(--PCP-primary); }
.plugin-card--selected { border-color: var(--PCP-primary); background: rgba(99,102,241,0.06); }

.plugin-header { display: flex; align-items: center; justify-content: space-between; }

.plugin-domain-badge {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 10px;
  letter-spacing: 0.05em;
}

.domain-generic { background: rgba(56,189,248,0.15); color: var(--PCP-info); }
.domain-pharma { background: rgba(99,102,241,0.15); color: var(--PCP-primary); }
.domain-cgt { background: rgba(34,197,94,0.15); color: var(--PCP-success); }
.domain-biologics { background: rgba(245,158,11,0.15); color: var(--PCP-warning); }

.plugin-version { font-size: 11px; color: var(--PCP-text-muted); font-family: 'JetBrains Mono', monospace; }
.plugin-name { font-size: 13px; font-weight: 600; }
.plugin-id { font-size: 11px; color: var(--PCP-text-muted); font-family: 'JetBrains Mono', monospace; }

.plugin-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.tag { font-size: 10px; padding: 1px 6px; background: var(--PCP-surface2); border: 1px solid var(--PCP-border); border-radius: 8px; color: var(--PCP-text-muted); }

.plugin-detail {
  border-top: 1px solid var(--PCP-border);
  padding-top: 10px;
  font-size: 12px;
  color: var(--PCP-text-muted);
  line-height: 1.5;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-row-sm { display: flex; align-items: center; gap: 8px; }
.dr-label { font-size: 11px; color: var(--PCP-text-muted); }

.sev-badge-blocker { font-size: 10px; font-weight: 700; padding: 1px 7px; border-radius: 8px; background: rgba(239,68,68,0.2); color: var(--PCP-danger); text-transform: uppercase; }
.sev-badge-warning { font-size: 10px; font-weight: 700; padding: 1px 7px; border-radius: 8px; background: rgba(245,158,11,0.2); color: var(--PCP-warning); text-transform: uppercase; }

.plugin-test-status { font-size: 11px; font-weight: 600; }
.test-pass { color: var(--PCP-success); }
.test-fail { color: var(--PCP-danger); }
</style>
