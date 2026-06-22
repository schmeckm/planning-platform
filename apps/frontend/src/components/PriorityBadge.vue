<template>
  <span :class="['priority-badge', `priority--${priority.toLowerCase()}`]">{{ priority }}</span>
</template>

<script setup lang="ts">
defineProps<{ priority: string }>();
</script>

<style scoped>
.priority-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.priority--critical { background: rgba(239,68,68,0.2); color: var(--PCP-danger); }
.priority--high { background: rgba(245,158,11,0.2); color: var(--PCP-warning); }
.priority--normal { background: rgba(56,189,248,0.15); color: var(--PCP-info); }
.priority--low { background: rgba(124,139,161,0.15); color: var(--PCP-text-muted); }
</style>
