<template>
  <div class="summary-card card">
    <div class="sc-value">{{ value }}</div>
    <div class="sc-label">{{ label }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; value: string | number }>();
</script>

<style scoped>
.summary-card {
  padding: 16px;
  text-align: center;
}

.sc-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--PCP-text);
  line-height: 1;
  margin-bottom: 6px;
  font-family: 'JetBrains Mono', monospace;
}

.sc-label {
  font-size: 11px;
  color: var(--PCP-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>
