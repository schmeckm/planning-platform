import { defineConfig } from 'vitepress'

const enNav = [
  { text: 'Developers', link: '/developers/' },
  { text: 'Guide', link: '/guide/concept' },
  { text: 'Constraints', link: '/constraints/interface' },
  { text: 'Conventions', link: '/conventions/code-style' },
  { text: 'Industries', link: '/industries/pharma' },
  { text: 'Adapters', link: '/adapters/overview' },
  { text: 'Modules', link: '/modules/shopfloor' },
  { text: 'Community', link: '/community/contributing' },
  {
    text: 'v0.1.0',
    items: [
      { text: 'Release Notes', link: '/community/release-notes/' },
      { text: 'Changelog', link: '/community/changelog' },
      { text: 'Roadmap', link: '/community/roadmap' },
    ],
  },
]

const deNav = [
  { text: 'Entwickler', link: '/de/developers/' },
  { text: 'Leitfaden', link: '/de/guide/concept' },
  { text: 'Constraints', link: '/de/constraints/interface' },
  { text: 'Konventionen', link: '/de/conventions/code-style' },
  { text: 'Industrie-Packs', link: '/de/industries/pharma' },
  { text: 'Adapter', link: '/de/adapters/overview' },
  { text: 'Module', link: '/de/modules/shopfloor' },
  { text: 'Community', link: '/de/community/contributing' },
  {
    text: 'v0.1.0',
    items: [
      { text: 'Release Notes', link: '/de/community/release-notes/' },
      { text: 'Änderungsprotokoll', link: '/de/community/changelog' },
      { text: 'Roadmap', link: '/de/community/roadmap' },
    ],
  },
]

const enSidebar = {
  '/developers/': [
    {
      text: 'Developer Hub',
      items: [
        { text: 'Overview', link: '/developers/' },
        { text: 'What you can change', link: '/developers/extension-model' },
        { text: 'Build addons & modules', link: '/developers/build-addons' },
        { text: 'Contribute', link: '/developers/contribute' },
      ],
    },
    {
      text: 'Reference',
      items: [
        { text: 'Getting started', link: '/guide/getting-started' },
        { text: 'Architecture', link: '/guide/architecture' },
        { text: 'Data model', link: '/guide/data-model' },
        { text: 'Write a constraint', link: '/constraints/writing' },
        { text: 'Build an adapter', link: '/adapters/custom' },
        { text: 'Industry packs', link: '/industries/custom' },
        { text: 'PR & review', link: '/conventions/pr-process' },
        { text: 'Release process', link: '/conventions/release-notes' },
        { text: 'Governance', link: '/community/governance' },
      ],
    },
  ],
  '/guide/': [
    {
      text: 'Introduction',
      items: [
        { text: 'What is PCP?', link: '/guide/concept' },
        { text: 'Getting Started', link: '/guide/getting-started' },
        { text: 'Architecture', link: '/guide/architecture' },
        { text: 'Data Model', link: '/guide/data-model' },
        { text: 'Shopfloor Module', link: '/modules/shopfloor' },
      ],
    },
  ],
  '/constraints/': [
    {
      text: 'Constraint System',
      items: [
        { text: 'Plugin Interface', link: '/constraints/interface' },
        { text: 'Writing a Constraint', link: '/constraints/writing' },
        { text: 'Scoring & Severity', link: '/constraints/scoring' },
        { text: 'Testing Constraints', link: '/constraints/testing' },
        { text: 'Built-in Constraints', link: '/constraints/builtin' },
      ],
    },
  ],
  '/conventions/': [
    {
      text: 'Developer Conventions',
      items: [
        { text: 'Code Style', link: '/conventions/code-style' },
        { text: 'Icons', link: '/conventions/icons' },
        { text: 'PR & Review Process', link: '/conventions/pr-process' },
        { text: 'Commit Messages', link: '/conventions/commits' },
        { text: 'Documentation', link: '/conventions/documentation' },
        { text: 'Release Notes', link: '/conventions/release-notes' },
      ],
    },
  ],
  '/industries/': [
    {
      text: 'Industry Packs',
      items: [
        { text: 'Pharma Manufacturing', link: '/industries/pharma' },
        { text: 'Cell & Gene Therapy', link: '/industries/cgt' },
        { text: 'Packaging', link: '/industries/packaging' },
        { text: 'Food & Beverage', link: '/industries/food' },
        { text: 'Semiconductor', link: '/industries/semiconductor' },
        { text: 'Build Your Own Pack', link: '/industries/custom' },
      ],
    },
  ],
  '/adapters/': [
    {
      text: 'Adapters',
      items: [
        { text: 'Overview', link: '/adapters/overview' },
        { text: 'SAP S/4HANA', link: '/adapters/sap-s4' },
        { text: 'SAP ECC / PP/DS', link: '/adapters/sap-ecc' },
        { text: 'MES', link: '/adapters/mes' },
        { text: 'LIMS', link: '/adapters/lims' },
        { text: 'ERPNext', link: '/adapters/erpnext' },
        { text: 'CSV / Excel', link: '/adapters/csv' },
        { text: 'Build an Adapter', link: '/adapters/custom' },
      ],
    },
  ],
  '/modules/': [
    {
      text: 'Operational Modules',
      items: [
        { text: 'Overview', link: '/modules/' },
        { text: 'Shopfloor Transparency', link: '/modules/shopfloor' },
      ],
    },
  ],
  '/community/': [
    {
      text: 'Community',
      items: [
        { text: 'Contributing', link: '/community/contributing' },
        { text: 'Roadmap', link: '/community/roadmap' },
        { text: 'Release Notes', link: '/community/release-notes/' },
        { text: 'Changelog', link: '/community/changelog' },
        { text: 'Governance', link: '/community/governance' },
      ],
    },
  ],
  '/community/release-notes/': [
    {
      text: 'Release Notes',
      items: [{ text: 'All releases', link: '/community/release-notes/' }],
    },
  ],
}

const deSidebar = {
  '/de/developers/': [
    {
      text: 'Entwickler-Hub',
      items: [
        { text: 'Übersicht', link: '/de/developers/' },
        { text: 'Was du ändern kannst', link: '/de/developers/extension-model' },
        { text: 'Addons & Module bauen', link: '/de/developers/build-addons' },
        { text: 'Beitragen', link: '/de/developers/contribute' },
      ],
    },
    {
      text: 'Referenz',
      items: [
        { text: 'Erste Schritte', link: '/de/guide/getting-started' },
        { text: 'Architektur', link: '/de/guide/architecture' },
        { text: 'Datenmodell', link: '/de/guide/data-model' },
        { text: 'Constraint schreiben', link: '/de/constraints/writing' },
        { text: 'Adapter bauen', link: '/de/adapters/custom' },
        { text: 'Industry Packs', link: '/de/industries/custom' },
        { text: 'PR & Review', link: '/de/conventions/pr-process' },
        { text: 'Release-Prozess', link: '/de/conventions/release-notes' },
        { text: 'Governance', link: '/de/community/governance' },
      ],
    },
  ],
  '/de/guide/': [
    {
      text: 'Einführung',
      items: [
        { text: 'Was ist PCP?', link: '/de/guide/concept' },
        { text: 'Erste Schritte', link: '/de/guide/getting-started' },
        { text: 'Architektur', link: '/de/guide/architecture' },
        { text: 'Datenmodell', link: '/de/guide/data-model' },
        { text: 'Shopfloor-Modul', link: '/de/modules/shopfloor' },
      ],
    },
  ],
  '/de/constraints/': [
    {
      text: 'Constraint-System',
      items: [
        { text: 'Plugin-Interface', link: '/de/constraints/interface' },
        { text: 'Constraint schreiben', link: '/de/constraints/writing' },
        { text: 'Schweregrade', link: '/de/constraints/scoring' },
        { text: 'Tests', link: '/de/constraints/testing' },
        { text: 'Mitgelieferte Constraints', link: '/de/constraints/builtin' },
      ],
    },
  ],
  '/de/conventions/': [
    {
      text: 'Entwickler-Konventionen',
      items: [
        { text: 'Code-Stil', link: '/de/conventions/code-style' },
        { text: 'Icons', link: '/de/conventions/icons' },
        { text: 'PR & Review', link: '/de/conventions/pr-process' },
        { text: 'Commit-Nachrichten', link: '/de/conventions/commits' },
        { text: 'Dokumentation', link: '/de/conventions/documentation' },
        { text: 'Release Notes', link: '/de/conventions/release-notes' },
      ],
    },
  ],
  '/de/industries/': [
    {
      text: 'Industrie-Packs',
      items: [
        { text: 'Pharma-Produktion', link: '/de/industries/pharma' },
        { text: 'Cell & Gene Therapy', link: '/de/industries/cgt' },
        { text: 'Verpackung', link: '/de/industries/packaging' },
        { text: 'Lebensmittel', link: '/de/industries/food' },
        { text: 'Halbleiter', link: '/de/industries/semiconductor' },
        { text: 'Eigenes Pack erstellen', link: '/de/industries/custom' },
      ],
    },
  ],
  '/de/adapters/': [
    {
      text: 'Adapter',
      items: [
        { text: 'Übersicht', link: '/de/adapters/overview' },
        { text: 'SAP S/4HANA', link: '/de/adapters/sap-s4' },
        { text: 'MES', link: '/de/adapters/mes' },
        { text: 'LIMS', link: '/de/adapters/lims' },
        { text: 'CSV / Excel', link: '/de/adapters/csv' },
        { text: 'Eigenen Adapter bauen', link: '/de/adapters/custom' },
      ],
    },
  ],
  '/de/modules/': [
    {
      text: 'Operative Module',
      items: [
        { text: 'Übersicht', link: '/de/modules/' },
        { text: 'Shopfloor-Transparenz', link: '/de/modules/shopfloor' },
      ],
    },
  ],
  '/de/community/': [
    {
      text: 'Community',
      items: [
        { text: 'Mitwirken', link: '/de/community/contributing' },
        { text: 'Roadmap', link: '/de/community/roadmap' },
        { text: 'Release Notes', link: '/de/community/release-notes/' },
        { text: 'Änderungsprotokoll', link: '/de/community/changelog' },
        { text: 'Governance', link: '/de/community/governance' },
      ],
    },
  ],
  '/de/community/release-notes/': [
    {
      text: 'Release Notes',
      items: [{ text: 'Alle Releases', link: '/de/community/release-notes/' }],
    },
  ],
}

export default defineConfig({
  title: 'Pharma Collective Platform',
  description:
    'The open-source scheduling kernel for manufacturing — modular, explainable, industry-ready.',

  ignoreDeadLinks: [/^\/platform/],

  appearance: 'dark',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#0a0e17' }],
    ['meta', { property: 'og:title', content: 'Pharma Collective Platform' }],
    [
      'meta',
      {
        property: 'og:description',
        content:
          'The open-source scheduling kernel for manufacturing — modular, explainable, industry-ready.',
      },
    ],
  ],

  locales: {
    root: {
      label: 'English',
      lang: 'en-US',
      themeConfig: {
        nav: enNav,
        sidebar: enSidebar,
      },
    },
    de: {
      label: 'Deutsch',
      lang: 'de-DE',
      title: 'Pharma Collective Platform',
      description:
        'Der Open-Source-Planungskern für die Fertigung — modular, erklärbar, industrietauglich.',
      themeConfig: {
        nav: deNav,
        sidebar: deSidebar,
        outlineTitle: 'Auf dieser Seite',
        lastUpdatedText: 'Zuletzt aktualisiert',
        editLink: {
          pattern:
            'https://github.com/schmeckm/planningplatform/edit/main/open-planning-platform/docs/:path',
          text: 'Diese Seite auf GitHub bearbeiten',
        },
        docFooter: {
          prev: 'Vorherige Seite',
          next: 'Nächste Seite',
        },
      },
    },
  },

  themeConfig: {
    logo: '/images/opp-logo.png',
    siteTitle: 'Pharma Collective Platform',

    socialLinks: [
      { icon: 'github', link: 'https://github.com/schmeckm/planningplatform' },
    ],

    footer: {
      message: 'Released under the Apache 2.0 License.',
      copyright: 'Pharma Collective Platform Contributors',
    },

    search: {
      provider: 'local',
    },

    editLink: {
      pattern:
        'https://github.com/schmeckm/planningplatform/edit/main/open-planning-platform/docs/:path',
      text: 'Edit this page on GitHub',
    },
  },
})
