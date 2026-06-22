export type ReleaseCategory =
  | 'platform'
  | 'constraints'
  | 'adapters'
  | 'industry-packs'
  | 'modules'
  | 'documentation'

export interface ReleaseEntry {
  version: string
  subtitle: string
  /** ISO date: YYYY-MM-DD */
  date: string
  link: string
  categories: ReleaseCategory[]
}

export const releaseCategories: Record<
  ReleaseCategory,
  { label: string; labelDe: string }
> = {
  platform: { label: 'Platform Core', labelDe: 'Plattform-Kern' },
  constraints: { label: 'Constraints', labelDe: 'Constraints' },
  adapters: { label: 'Adapters', labelDe: 'Adapter' },
  'industry-packs': { label: 'Industry Packs', labelDe: 'Industrie-Packs' },
  modules: { label: 'Modules', labelDe: 'Module' },
  documentation: { label: 'Documentation', labelDe: 'Dokumentation' },
}

/** Newest first. Add a row here when publishing a release note page. */
export const releases: ReleaseEntry[] = [
  {
    version: '0.1.0',
    subtitle: 'The scheduling kernel takes shape',
    date: '2026-06-21',
    link: '/community/release-notes/0.1.0',
    categories: [
      'platform',
      'constraints',
      'adapters',
      'industry-packs',
      'modules',
      'documentation',
    ],
  },
]

export function releasesByYear(locale: 'en' | 'de' = 'en'): Array<{
  year: string
  items: ReleaseEntry[]
}> {
  const grouped = new Map<string, ReleaseEntry[]>()

  for (const release of releases) {
    const year = release.date.slice(0, 4)
    const bucket = grouped.get(year) ?? []
    bucket.push(release)
    grouped.set(year, bucket)
  }

  return [...grouped.entries()]
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([year, items]) => ({ year, items }))
}

export function categoryCounts(): Record<ReleaseCategory, number> {
  const counts = Object.fromEntries(
    Object.keys(releaseCategories).map((key) => [key, 0]),
  ) as Record<ReleaseCategory, number>

  for (const release of releases) {
    for (const category of release.categories) {
      counts[category] += 1
    }
  }

  return counts
}

export function formatReleaseDate(
  isoDate: string,
  locale: 'en' | 'de' = 'en',
): string {
  const date = new Date(`${isoDate}T12:00:00`)
  return new Intl.DateTimeFormat(locale === 'de' ? 'de-DE' : 'en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}
