<template>
  <div class="cockpit-embed" :style="embedAccentStyle">
    <PageHeading embed />
    <RouterView v-slot="{ Component, route }">
      <component :is="Component" v-if="Component" :key="route.name" class="cockpit-embed__page" />
      <p v-else class="cockpit-embed__empty">{{ t('planning.routeMissing') }}</p>
    </RouterView>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { RouterView } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useThemeStore } from '@portal/stores/themeStore';
import { accentCssVars } from '@portal/utils/accentColor';
import '@styles/design-tokens.css';
import '@styles/buttons.css';
import '@styles/layout-spacing.css';
import '@styles/cockpit-ui.css';
import PageHeading from '@/components/layout/PageHeading.vue';

const { t } = useI18n();
const { accentColor } = storeToRefs(useThemeStore());

const embedAccentStyle = computed(() => accentCssVars(accentColor.value));
</script>

<style scoped>
.cockpit-embed__page {
  min-height: 12rem;
}

.cockpit-embed__empty {
  margin: 0;
  padding: 1rem 0;
  color: var(--color-muted);
}
</style>

<style>
.cockpit-embed .panel,
.cockpit-embed .kpi-card {
  background: var(--cockpit-surface) !important;
  border-color: var(--color-border) !important;
  color: var(--color-text);
  box-shadow: var(--shadow-sm);
}

.cockpit-embed .kpi-card--primary {
  border-top-color: var(--blue-500, var(--color-accent)) !important;
}

.cockpit-embed .page-heading__platform,
.cockpit-embed .page-heading__title,
.cockpit-embed .page-subtitle {
  font-size: var(--text-2xl) !important;
  font-weight: var(--font-weight-semibold) !important;
  color: var(--color-text) !important;
}

.cockpit-embed .p-card {
  background: var(--cockpit-surface) !important;
  color: var(--color-text) !important;
  border: 1px solid var(--color-border) !important;
}
</style>
