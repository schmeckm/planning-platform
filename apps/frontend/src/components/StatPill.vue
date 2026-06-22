<template>
  <div :class="['stat-pill', `stat-pill--${color}`]">
    <span class="stat-value">{{ value }}</span>
    <span class="stat-label">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; value: number; color: 'success' | 'danger' | 'warning' | 'primary' | 'info' }>();
</script>

<style scoped>
.stat-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid;
  font-size: 13px;
}

.stat-value { font-weight: 700; font-size: 15px; }
.stat-label { font-size: 11px; opacity: 0.8; }

.stat-pill--success { background: rgba(34,197,94,0.1); border-color: rgba(34,197,94,0.3); color: var(--PCP-success); }
.stat-pill--danger { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); color: var(--PCP-danger); }
.stat-pill--warning { background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.3); color: var(--PCP-warning); }
.stat-pill--primary { background: rgba(99,102,241,0.1); border-color: rgba(99,102,241,0.3); color: var(--PCP-primary); }
.stat-pill--info { background: rgba(56,189,248,0.1); border-color: rgba(56,189,248,0.3); color: var(--PCP-info); }
</style>
