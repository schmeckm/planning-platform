<template>
  <div class="results">
    <h2 class="section-title">Simulation Results</h2>

    <div v-if="!store.activeSimulation" class="empty-state">
      <div class="empty-icon">◎</div>
      <h3>No Simulation Run Yet</h3>
      <p>Load data and click "Run Simulation" to evaluate constraints.</p>
    </div>

    <div v-else>
      <!-- Summary Cards -->
      <div class="summary-cards">
        <SummaryCard
          v-for="(val, key) in store.activeSimulation.metadata.summary"
          :key="key"
          :label="formatKey(key)"
          :value="val"
        />
        <SummaryCard label="Duration" :value="`${store.activeSimulation.metadata.durationMs ?? 0} ms`" />
      </div>

      <!-- Results Table -->
      <div class="results-table card">
        <div class="table-header">
          <span>Order ID</span>
          <span>Material</span>
          <span>Status</span>
          <span>Score</span>
          <span>Blockers</span>
          <span>Warnings</span>
        </div>
        <div
          v-for="result in store.activeSimulation.results"
          :key="result.orderId"
          :class="['table-row', statusClass(result.schedulingStatus)]"
        >
          <span class="mono">{{ result.orderId }}</span>
          <span class="muted">{{ orderMaterial(result.orderId) }}</span>
          <span>
            <span :class="['badge', `badge-${statusClass(result.schedulingStatus)}`]">
              {{ result.schedulingStatus }}
            </span>
          </span>
          <span>
            <div class="mini-bar-wrap">
              <div class="mini-bar" :style="{ width: Math.round((result.score ?? 0) * 100) + '%', background: scoreColor(result.score ?? 0) }" />
              <span>{{ Math.round((result.score ?? 0) * 100) }}%</span>
            </div>
          </span>
          <span class="danger-count">{{ blockerCount(result) }}</span>
          <span class="warn-count">{{ warningCount(result) }}</span>
        </div>
      </div>

      <!-- Explanation per order -->
      <div class="explanations">
        <h3 class="subsection-title">Scheduling Explanations</h3>
        <div
          v-for="result in store.activeSimulation.results"
          :key="result.orderId"
          class="explanation-card card"
        >
          <div class="expl-header">
            <span class="mono">{{ result.orderId }}</span>
            <span :class="['badge', `badge-${statusClass(result.schedulingStatus)}`]">
              {{ result.schedulingStatus }}
            </span>
          </div>
          <pre class="expl-body">{{ result.explanation }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePlanningStore } from '../stores/planning.store';
import type { SimulationResult } from '../stores/planning.store';
import SummaryCard from './SummaryCard.vue';

const store = usePlanningStore();

function formatKey(k: string): string {
  return k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
}

function orderMaterial(orderId: string): string {
  return store.orders.find(o => o.id === orderId)?.materialId ?? '—';
}

function statusClass(s: string): string {
  const m: Record<string, string> = {
    FEASIBLE: 'feasible',
    INFEASIBLE: 'infeasible',
    SOFT_VIOLATION: 'soft-violation',
    PENDING: 'pending',
  };
  return m[s] ?? 'pending';
}

function scoreColor(score: number): string {
  if (score >= 0.8) return 'var(--PCP-success)';
  if (score >= 0.5) return 'var(--PCP-warning)';
  return 'var(--PCP-danger)';
}

function blockerCount(r: SimulationResult): number {
  return r.constraintResults.filter(c => !c.passed && c.severity === 'BLOCKER').length;
}

function warningCount(r: SimulationResult): number {
  return r.constraintResults.filter(c => c.severity === 'WARNING').length;
}
</script>

<style scoped>
.results { display: flex; flex-direction: column; gap: 24px; }
.section-title { font-size: 18px; font-weight: 600; }
.subsection-title { font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--PCP-text-muted); margin-bottom: 12px; }

.empty-state { text-align: center; padding: 80px; color: var(--PCP-text-muted); }
.empty-icon { font-size: 64px; opacity: 0.15; margin-bottom: 16px; }
.empty-state h3 { font-size: 20px; color: var(--PCP-text); margin-bottom: 8px; }
.empty-state p { font-size: 14px; max-width: 380px; margin: 0 auto; }

.summary-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }

.results-table {
  border-radius: var(--PCP-radius);
  overflow: hidden;
}

.table-header, .table-row {
  display: grid;
  grid-template-columns: 180px 1fr 160px 120px 80px 80px;
  align-items: center;
  padding: 10px 16px;
  gap: 12px;
  font-size: 12px;
}

.table-header {
  background: var(--PCP-surface2);
  color: var(--PCP-text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 11px;
}

.table-row {
  border-top: 1px solid var(--PCP-border);
  transition: background 0.1s;
}

.table-row:hover { background: var(--PCP-surface2); }

.mono { font-family: 'JetBrains Mono', monospace; font-size: 11px; }
.muted { color: var(--PCP-text-muted); }

.mini-bar-wrap { display: flex; align-items: center; gap: 6px; }
.mini-bar { height: 4px; border-radius: 2px; flex-shrink: 0; transition: width 0.5s; }

.danger-count { color: var(--PCP-danger); font-weight: 600; text-align: center; }
.warn-count { color: var(--PCP-warning); font-weight: 600; text-align: center; }

.explanations { display: flex; flex-direction: column; gap: 12px; }

.explanation-card { padding: 16px; }

.expl-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }

.expl-body {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--PCP-text-muted);
  white-space: pre-wrap;
  line-height: 1.6;
  background: var(--PCP-surface2);
  border-radius: 6px;
  padding: 10px;
}
</style>
