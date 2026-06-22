<script setup lang="ts">
import { computed } from 'vue'
import { categoryCounts, releaseCategories, type ReleaseCategory } from '../data/releases'

const props = withDefaults(
  defineProps<{
    locale?: 'en' | 'de'
  }>(),
  {
    locale: 'en',
  },
)

const categories = computed(() => {
  const counts = categoryCounts()
  return (Object.keys(releaseCategories) as ReleaseCategory[]).map((id) => ({
    id,
    label:
      props.locale === 'de'
        ? releaseCategories[id].labelDe
        : releaseCategories[id].label,
    count: counts[id],
  }))
})
</script>

<template>
  <aside class="release-sidebar" aria-label="Release categories">
    <h2 class="release-sidebar__title">
      {{ locale === 'de' ? 'Kategorien' : 'Categories' }}
    </h2>
    <ul class="release-sidebar__list">
      <li v-for="category in categories" :key="category.id">
        <span class="release-sidebar__item">
          <span>{{ category.label }}</span>
          <span class="release-sidebar__count">{{ category.count }}</span>
        </span>
      </li>
    </ul>
  </aside>
</template>

<style scoped>
.release-sidebar {
  padding: 1rem 0;
}

.release-sidebar__title {
  margin: 0 0 0.75rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--vp-c-text-2);
}

.release-sidebar__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.release-sidebar__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.35rem 0;
  font-size: 0.92rem;
  color: var(--vp-c-text-2);
}

.release-sidebar__count {
  min-width: 1.5rem;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  background: var(--vp-c-bg-soft);
  font-size: 0.75rem;
  text-align: center;
  color: var(--vp-c-text-3);
}
</style>
