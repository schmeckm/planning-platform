<script setup lang="ts">
import { computed } from 'vue'
import {
  releasesByYear,
  formatReleaseDate,
  type ReleaseEntry,
} from '../data/releases'

const props = withDefaults(
  defineProps<{
    locale?: 'en' | 'de'
    basePath?: string
  }>(),
  {
    locale: 'en',
    basePath: '',
  },
)

const sections = computed(() => releasesByYear(props.locale))

function releaseLink(release: ReleaseEntry): string {
  if (props.basePath) {
    return `${props.basePath}${release.link}`
  }
  return release.link
}

function cardTitle(release: ReleaseEntry): string {
  return `${release.version}: ${release.subtitle}`
}
</script>

<template>
  <div class="release-notes">
    <section
      v-for="section in sections"
      :key="section.year"
      class="release-notes__year"
    >
      <h2 class="release-notes__year-title">{{ section.year }}</h2>

      <div class="release-notes__grid">
        <a
          v-for="release in section.items"
          :key="release.version"
          :href="releaseLink(release)"
          class="release-note-card"
        >
          <div class="release-note-card__body">
            <span class="release-note-card__title">{{ cardTitle(release) }}</span>
            <time
              class="release-note-card__date"
              :datetime="release.date"
            >
              {{ formatReleaseDate(release.date, locale) }}
            </time>
          </div>
          <span class="release-note-card__chevron" aria-hidden="true">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </span>
        </a>
      </div>
    </section>

    <p v-if="sections.length === 0" class="release-notes__empty">
      {{
        locale === 'de'
          ? 'Noch keine Release Notes veröffentlicht.'
          : 'No release notes published yet.'
      }}
    </p>
  </div>
</template>

<style scoped>
.release-notes {
  margin-top: 1.5rem;
}

.release-notes__year + .release-notes__year {
  margin-top: 2.5rem;
}

.release-notes__year-title {
  margin: 0 0 1rem;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.3;
  color: var(--vp-c-text-1);
}

.release-notes__grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .release-notes__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 960px) {
  .release-notes__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.release-note-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg);
  text-decoration: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.release-note-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 4px 14px rgba(0, 127, 88, 0.12);
  transform: translateY(-1px);
}

.release-note-card__body {
  flex: 1;
  min-width: 0;
}

.release-note-card__title {
  display: block;
  font-size: 0.98rem;
  font-weight: 600;
  line-height: 1.35;
  color: var(--vp-c-brand-1);
}

.release-note-card:hover .release-note-card__title {
  color: var(--vp-c-brand-2);
}

.release-note-card__date {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.82rem;
  color: var(--vp-c-text-3);
}

.release-note-card__chevron {
  flex-shrink: 0;
  width: 1.1rem;
  height: 1.1rem;
  color: var(--vp-c-text-3);
}

.release-note-card:hover .release-note-card__chevron {
  color: var(--vp-c-brand-1);
}

.release-notes__empty {
  color: var(--vp-c-text-2);
}
</style>
