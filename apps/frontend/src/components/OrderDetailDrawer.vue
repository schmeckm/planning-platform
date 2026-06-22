<template>
  <div class="drawer-overlay" @click.self="$emit('close')">
    <div class="drawer">
      <div class="drawer-header">
        <div>
          <h3>{{ order.id }}</h3>
          <p>{{ order.materialId }}</p>
        </div>
        <button class="drawer-close" @click="$emit('close')">✕</button>
      </div>

      <div class="drawer-body">
        <!-- Status -->
        <div class="detail-section">
          <span :class="['badge', statusBadge]">{{ order.schedulingStatus }}</span>
          <PriorityBadge :priority="order.priority" />
          <span v-if="order.patientId" class="patient-tag">👤 {{ order.patientId }}</span>
        </div>

        <!-- Key Fields -->
        <div class="detail-section">
          <h4>Order Details</h4>
          <div class="detail-grid">
            <DetailRow label="Material" :value="order.materialId" />
            <DetailRow label="Batch" :value="order.batchId ?? '—'" />
            <DetailRow label="Quantity" :value="`${order.quantity} ${order.unit}`" />
            <DetailRow label="Earliest Start" :value="formatDt(order.earliestStart)" />
            <DetailRow label="Latest Finish" :value="formatDt(order.latestFinish)" />
            <DetailRow v-if="order.scheduledStart" label="Scheduled Start" :value="formatDt(order.scheduledStart)" />
            <DetailRow v-if="order.scheduledFinish" label="Scheduled Finish" :value="formatDt(order.scheduledFinish)" />
          </div>
        </div>

        <!-- Constraint Results -->
        <div class="detail-section" v-if="orderResults?.constraintResults?.length">
          <h4>Constraint Evaluation</h4>
          <div class="score-bar-container">
            <div class="score-label">Scheduling Score: {{ scorePercent }}%</div>
            <div class="score-bar">
              <div
                class="score-fill"
                :style="{ width: scorePercent + '%', background: scoreColor }"
              />
            </div>
          </div>

          <div class="constraint-list">
            <div
              v-for="cr in orderResults.constraintResults"
              :key="cr.constraintId"
              :class="['constraint-item', cr.passed ? 'passed' : 'failed', cr.severity.toLowerCase()]"
            >
              <div class="ci-header">
                <span :class="['ci-icon']">{{ cr.passed ? '✓' : '✕' }}</span>
                <span class="ci-name">{{ cr.constraintId }}</span>
                <span :class="['ci-severity', `sev-${cr.severity.toLowerCase()}`]">{{ cr.severity }}</span>
              </div>
              <div class="ci-message">{{ cr.message }}</div>
              <div class="ci-explanation">{{ cr.explanation }}</div>
              <div v-if="cr.correctionHint" class="ci-hint">
                → {{ cr.correctionHint }}
              </div>
            </div>
          </div>
        </div>

        <!-- Explanation -->
        <div class="detail-section" v-if="orderResults?.explanation">
          <h4>Scheduling Explanation</h4>
          <pre class="explanation-text">{{ orderResults.explanation }}</pre>
        </div>

        <!-- Tags -->
        <div class="detail-section" v-if="Object.keys(order.tags).length">
          <h4>Tags</h4>
          <div class="tags">
            <span v-for="(v, k) in order.tags" :key="k" class="tag">{{ k }}: {{ v }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PlanningOrder, SimulationRun } from '../stores/planning.store';
import PriorityBadge from './PriorityBadge.vue';

const props = defineProps<{
  order: PlanningOrder;
  simulation: SimulationRun | null;
}>();

defineEmits<{ close: [] }>();

const orderResults = computed(() =>
  props.simulation?.results.find(r => r.orderId === props.order.id),
);

const scorePercent = computed(() => {
  const s = orderResults.value?.score;
  return s !== undefined ? Math.round(s * 100) : 0;
});

const scoreColor = computed(() => {
  const p = scorePercent.value;
  if (p >= 80) return 'var(--PCP-success)';
  if (p >= 50) return 'var(--PCP-warning)';
  return 'var(--PCP-danger)';
});

const statusBadge = computed(() => {
  const m: Record<string, string> = {
    FEASIBLE: 'badge badge-feasible',
    INFEASIBLE: 'badge badge-infeasible',
    SOFT_VIOLATION: 'badge badge-soft-violation',
    PENDING: 'badge badge-pending',
  };
  return m[props.order.schedulingStatus] ?? 'badge badge-pending';
});

function formatDt(d: string): string {
  return new Date(d).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}
</script>

<script lang="ts">
export default {
  components: {
    DetailRow: {
      props: ['label', 'value'],
      template: `<div class="detail-row"><span class="dr-label">{{ label }}</span><span class="dr-value">{{ value }}</span></div>`,
    },
  },
};
</script>

<style scoped>
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 200;
  display: flex;
  justify-content: flex-end;
}

.drawer {
  width: 560px;
  max-width: 95vw;
  background: var(--PCP-surface);
  border-left: 1px solid var(--PCP-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideIn 0.2s ease;
}

@keyframes slideIn { from { transform: translateX(40px); opacity: 0; } to { transform: none; opacity: 1; } }

.drawer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--PCP-border);
  background: var(--PCP-surface2);
}

.drawer-header h3 {
  font-family: 'JetBrains Mono', monospace;
  font-size: 15px;
  font-weight: 600;
}

.drawer-header p { font-size: 12px; color: var(--PCP-text-muted); margin-top: 2px; }

.drawer-close {
  background: none;
  border: none;
  color: var(--PCP-text-muted);
  cursor: pointer;
  font-size: 18px;
  padding: 4px;
  line-height: 1;
}

.drawer-body { flex: 1; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 20px; }

.detail-section { display: flex; flex-direction: column; gap: 10px; }
.detail-section h4 { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--PCP-text-muted); }

.detail-section:first-child { flex-direction: row; align-items: center; gap: 8px; }

.patient-tag {
  font-size: 11px;
  padding: 2px 8px;
  background: rgba(99,102,241,0.15);
  border-radius: 10px;
  color: var(--PCP-primary);
}

.detail-grid { display: flex; flex-direction: column; gap: 6px; }

.detail-row { display: flex; align-items: baseline; gap: 8px; font-size: 13px; }
.dr-label { color: var(--PCP-text-muted); min-width: 130px; flex-shrink: 0; }
.dr-value { color: var(--PCP-text); font-family: 'JetBrains Mono', monospace; font-size: 12px; }

.score-bar-container { display: flex; flex-direction: column; gap: 4px; }
.score-label { font-size: 12px; color: var(--PCP-text-muted); }
.score-bar { height: 6px; background: var(--PCP-border); border-radius: 3px; overflow: hidden; }
.score-fill { height: 100%; border-radius: 3px; transition: width 0.5s; }

.constraint-list { display: flex; flex-direction: column; gap: 8px; }

.constraint-item {
  border-radius: 6px;
  padding: 10px 12px;
  border: 1px solid;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.constraint-item.passed {
  background: rgba(34,197,94,0.06);
  border-color: rgba(34,197,94,0.2);
}

.constraint-item.failed {
  background: rgba(239,68,68,0.06);
  border-color: rgba(239,68,68,0.2);
}

.constraint-item.failed.warning {
  background: rgba(245,158,11,0.06);
  border-color: rgba(245,158,11,0.2);
}

.ci-header { display: flex; align-items: center; gap: 8px; }
.ci-icon { font-size: 13px; font-weight: 700; }
.passed .ci-icon { color: var(--PCP-success); }
.failed .ci-icon { color: var(--PCP-danger); }

.ci-name {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--PCP-text);
  flex: 1;
}

.ci-severity {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 1px 6px;
  border-radius: 8px;
}

.sev-blocker { background: rgba(239,68,68,0.2); color: var(--PCP-danger); }
.sev-warning { background: rgba(245,158,11,0.2); color: var(--PCP-warning); }
.sev-recommendation { background: rgba(56,189,248,0.2); color: var(--PCP-info); }

.ci-message { font-size: 12px; color: var(--PCP-text); font-weight: 500; }
.ci-explanation { font-size: 11px; color: var(--PCP-text-muted); line-height: 1.5; }
.ci-hint { font-size: 11px; color: var(--PCP-info); font-style: italic; }

.explanation-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--PCP-text-muted);
  white-space: pre-wrap;
  background: var(--PCP-surface2);
  border: 1px solid var(--PCP-border);
  border-radius: 6px;
  padding: 12px;
  line-height: 1.6;
}

.tags { display: flex; flex-wrap: wrap; gap: 6px; }
.tag {
  font-size: 11px;
  padding: 3px 10px;
  background: var(--PCP-surface2);
  border: 1px solid var(--PCP-border);
  border-radius: 12px;
  color: var(--PCP-text-muted);
  font-family: 'JetBrains Mono', monospace;
}
</style>
