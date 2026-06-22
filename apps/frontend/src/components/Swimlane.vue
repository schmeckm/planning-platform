<template>
  <div :class="['swimlane', `swimlane--${statusClass}`]">
    <div class="swimlane-header">
      <span class="swimlane-icon">{{ icon }}</span>
      <span class="swimlane-title">{{ title }}</span>
      <span class="swimlane-count">{{ orders.length }}</span>
    </div>
    <div class="swimlane-body">
      <div
        v-for="order in orders"
        :key="order.id"
        class="order-card"
        @click="$emit('select', order)"
      >
        <div class="order-card-top">
          <span class="order-card-id">{{ order.id }}</span>
          <PriorityBadge :priority="order.priority" />
        </div>
        <div class="order-card-mat">{{ order.materialId }}</div>
        <div class="order-card-meta">
          <span>{{ order.quantity }} {{ order.unit }}</span>
          <span v-if="order.patientId" class="patient-tag">👤 {{ order.patientId }}</span>
        </div>
        <div class="order-card-dates">
          {{ formatDate(order.earliestStart) }} → {{ formatDate(order.latestFinish) }}
        </div>
      </div>
      <div v-if="orders.length === 0" class="swimlane-empty">None</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PlanningOrder } from '../stores/planning.store';
import PriorityBadge from './PriorityBadge.vue';

defineProps<{
  title: string;
  icon: string;
  statusClass: string;
  orders: PlanningOrder[];
}>();

defineEmits<{ select: [order: PlanningOrder] }>();

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}
</script>

<style scoped>
.swimlane {
  background: var(--PCP-surface);
  border: 1px solid var(--PCP-border);
  border-radius: var(--PCP-radius);
  overflow: hidden;
}

.swimlane--feasible { border-top: 3px solid var(--PCP-success); }
.swimlane--infeasible { border-top: 3px solid var(--PCP-danger); }
.swimlane--pending { border-top: 3px solid var(--PCP-primary); }

.swimlane-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--PCP-border);
  background: var(--PCP-surface2);
}

.swimlane-icon { font-size: 16px; }
.swimlane-title { font-size: 13px; font-weight: 600; flex: 1; }

.swimlane-count {
  background: var(--PCP-border);
  border-radius: 12px;
  padding: 1px 9px;
  font-size: 12px;
  font-weight: 600;
  min-width: 24px;
  text-align: center;
}

.swimlane-body { padding: 12px; display: flex; flex-direction: column; gap: 8px; min-height: 80px; }

.order-card {
  background: var(--PCP-surface2);
  border: 1px solid var(--PCP-border);
  border-radius: 6px;
  padding: 10px 12px;
  cursor: pointer;
  transition: border-color 0.15s;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.order-card:hover { border-color: var(--PCP-primary); }

.order-card-top { display: flex; align-items: center; justify-content: space-between; }

.order-card-id {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--PCP-text);
  font-weight: 500;
}

.order-card-mat { font-size: 12px; color: var(--PCP-text-muted); }

.order-card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--PCP-text);
}

.patient-tag {
  font-size: 11px;
  padding: 1px 7px;
  background: rgba(99,102,241,0.15);
  border-radius: 10px;
  color: var(--PCP-primary);
}

.order-card-dates { font-size: 11px; color: var(--PCP-text-muted); }

.swimlane-empty { font-size: 13px; color: var(--PCP-text-muted); text-align: center; padding: 20px; }
</style>
