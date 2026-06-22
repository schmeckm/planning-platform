<template>
  <div class="board">
    <div class="board-header">
      <h2 class="section-title">Scheduling Board</h2>
      <div class="board-stats">
        <StatPill label="Total" :value="store.orders.length" color="info" />
        <StatPill label="Feasible" :value="store.feasibleOrders.length" color="success" />
        <StatPill label="Blocked" :value="store.infeasibleOrders.length" color="danger" />
        <StatPill label="Pending" :value="store.pendingOrders.length" color="primary" />
      </div>
    </div>

    <div v-if="store.orders.length === 0" class="empty-state">
      <div class="empty-icon">⬡</div>
      <h3>No Orders Loaded</h3>
      <p>Click "Load Mock Data" to populate pharma + CGT orders, then "Run Simulation" to evaluate constraints.</p>
    </div>

    <div v-else>
      <!-- Swimlane layout -->
      <div class="swimlanes">
        <Swimlane
          title="Feasible Orders"
          icon="✓"
          status-class="feasible"
          :orders="store.feasibleOrders"
          @select="selectedOrder = $event"
        />
        <Swimlane
          title="Blocked Orders"
          icon="✕"
          status-class="infeasible"
          :orders="store.infeasibleOrders"
          @select="selectedOrder = $event"
        />
        <Swimlane
          title="Pending Evaluation"
          icon="◌"
          status-class="pending"
          :orders="store.pendingOrders"
          @select="selectedOrder = $event"
        />
      </div>

      <!-- Gantt-style timeline (simplified) -->
      <div class="timeline-section">
        <h3 class="subsection-title">Order Timeline</h3>
        <div class="timeline">
          <div
            v-for="order in store.orders"
            :key="order.id"
            class="timeline-row"
            :class="'timeline-row--' + statusClass(order.schedulingStatus)"
          >
            <div class="timeline-label">
              <span class="order-id">{{ order.id.substring(0, 12) }}</span>
              <span class="order-mat">{{ order.materialId.substring(0, 12) }}</span>
              <span :class="['badge', 'badge-' + statusClass(order.schedulingStatus)]">
                {{ order.schedulingStatus }}
              </span>
            </div>
            <div class="timeline-bar-container">
              <div
                class="timeline-bar"
                :class="'timeline-bar--' + statusClass(order.schedulingStatus)"
                :style="barStyle(order)"
                :title="barTooltip(order)"
              >
                <span class="bar-label">{{ order.quantity }} {{ order.unit }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Order Detail Drawer -->
    <OrderDetailDrawer
      v-if="selectedOrder"
      :order="selectedOrder"
      :simulation="store.activeSimulation"
      @close="selectedOrder = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { usePlanningStore } from '../stores/planning.store';
import type { PlanningOrder } from '../stores/planning.store';
import StatPill from './StatPill.vue';
import Swimlane from './Swimlane.vue';
import OrderDetailDrawer from './OrderDetailDrawer.vue';

const store = usePlanningStore();
const selectedOrder = ref<PlanningOrder | null>(null);

const timelineMin = () => {
  const dates = store.orders.map(o => new Date(o.earliestStart).getTime());
  return dates.length ? Math.min(...dates) : Date.now();
};

const timelineMax = () => {
  const dates = store.orders.map(o => new Date(o.latestFinish).getTime());
  return dates.length ? Math.max(...dates) : Date.now() + 86_400_000 * 30;
};

function barStyle(order: PlanningOrder): Record<string, string> {
  const min = timelineMin();
  const max = timelineMax();
  const range = max - min || 1;

  const start = new Date(order.scheduledStart ?? order.earliestStart).getTime();
  const end = new Date(order.scheduledFinish ?? order.latestFinish).getTime();

  const left = ((start - min) / range) * 100;
  const width = Math.max(((end - start) / range) * 100, 2);

  return {
    left: `${left.toFixed(1)}%`,
    width: `${width.toFixed(1)}%`,
  };
}

function barTooltip(order: PlanningOrder): string {
  return `${order.id}\nMaterial: ${order.materialId}\nQty: ${order.quantity} ${order.unit}\nStart: ${order.scheduledStart ?? order.earliestStart}\nFinish: ${order.scheduledFinish ?? order.latestFinish}`;
}

function statusClass(status: string): string {
  const map: Record<string, string> = {
    FEASIBLE: 'feasible',
    INFEASIBLE: 'infeasible',
    SOFT_VIOLATION: 'soft-violation',
    PENDING: 'pending',
    UNSCHEDULED: 'pending',
  };
  return map[status] ?? 'pending';
}
</script>

<style scoped>
.board { display: flex; flex-direction: column; gap: 24px; }

.board-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--PCP-text);
}

.board-stats { display: flex; gap: 8px; flex-wrap: wrap; }

.empty-state {
  text-align: center;
  padding: 80px 24px;
  color: var(--PCP-text-muted);
}

.empty-icon { font-size: 64px; opacity: 0.2; margin-bottom: 16px; }
.empty-state h3 { font-size: 20px; margin-bottom: 8px; color: var(--PCP-text); }
.empty-state p { font-size: 14px; max-width: 400px; margin: 0 auto; }

.swimlanes { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }

.subsection-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--PCP-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 12px;
}

.timeline {
  background: var(--PCP-surface);
  border: 1px solid var(--PCP-border);
  border-radius: var(--PCP-radius);
  overflow: hidden;
}

.timeline-row {
  display: flex;
  align-items: center;
  min-height: 44px;
  border-bottom: 1px solid var(--PCP-border);
}

.timeline-row:last-child { border-bottom: none; }

.timeline-label {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 320px;
  padding: 8px 16px;
  border-right: 1px solid var(--PCP-border);
  flex-shrink: 0;
}

.order-id {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--PCP-text);
  min-width: 100px;
}

.order-mat {
  font-size: 11px;
  color: var(--PCP-text-muted);
  min-width: 90px;
}

.timeline-bar-container {
  flex: 1;
  position: relative;
  height: 44px;
  overflow: hidden;
  padding: 8px 4px;
}

.timeline-bar {
  position: absolute;
  top: 8px;
  height: 28px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 4px;
  transition: opacity 0.2s;
  cursor: pointer;
}

.timeline-bar:hover { opacity: 0.8; }

.timeline-bar--feasible { background: rgba(34,197,94,0.25); border: 1px solid rgba(34,197,94,0.5); }
.timeline-bar--infeasible { background: rgba(239,68,68,0.25); border: 1px solid rgba(239,68,68,0.5); }
.timeline-bar--soft-violation { background: rgba(245,158,11,0.25); border: 1px solid rgba(245,158,11,0.5); }
.timeline-bar--pending { background: rgba(99,102,241,0.2); border: 1px solid rgba(99,102,241,0.4); }

.bar-label {
  font-size: 10px;
  white-space: nowrap;
  overflow: hidden;
  padding: 0 6px;
  color: var(--PCP-text);
  font-weight: 500;
}
</style>
