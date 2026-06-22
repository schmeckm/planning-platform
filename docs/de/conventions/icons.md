# Icons

Die Open Planning Platform verwendet eine konsistente, professionelle Icon-Sprache auf allen Oberflächen.

## Icon-Standard

**Alle Icons in OPP verwenden [Lucide](https://lucide.dev/) als primäre Icon-Bibliothek.**

Lucide ist:
- Open Source (ISC-Lizenz)
- Konsistentes Stroke-Design (`stroke-width: 1.6`, `stroke-linecap: round`, `stroke-linejoin: round`)
- Framework-agnostisch (Vue, React, reines SVG)
- Von major Open-Source-Plattformen genutzt (Linear, Vercel u. a.)
- Über 1.500 Icons für alle UI- und Domain-Anforderungen

## Warum keine Emojis?

| | Emojis | Lucide SVG Icons |
|---|---|---|
| Konsistenz | ❌ Variieren je OS / Browser | ✅ Pixel-perfekt überall |
| Farbsteuerung | ❌ Nicht kontrollierbar | ✅ Erbt `currentColor` |
| Größenskalierung | ❌ Begrenzt | ✅ Beliebige Größe |
| Dark Mode | ❌ Passt sich ggf. nicht an | ✅ Passt sich automatisch an |
| Professionalität | ❌ Informell | ✅ Produktionsreif |
| Barrierefreiheit | ❌ Screen-Reader variiert | ✅ `aria-label` kontrolliert |

## Verwendung in Vue (Planungsboard)

```bash
npm install lucide-vue-next
```

```vue
<script setup>
import { ShieldCheck, GitBranch, Layers, AlertTriangle } from 'lucide-vue-next'
</script>

<template>
  <ShieldCheck :size="20" stroke-width="1.6" />
  <AlertTriangle :size="20" stroke-width="1.6" class="icon--warning" />
</template>
```

**Immer `stroke-width="1.6"`** verwenden — der Standard (2) ist bei kleinen Größen zu schwer.

## Domain Icon-Tabelle

Diese Icons sind die **offizielle Zuordnung** für OPP-Konzepte:

| Konzept | Lucide Icon | Import-Name |
|---|---|---|
| Constraint / Regel | `shield` | `Shield` |
| Constraint verletzt (BLOCKER) | `shield-x` | `ShieldX` |
| Constraint bestanden | `shield-check` | `ShieldCheck` |
| Constraint-Warnung | `alert-triangle` | `AlertTriangle` |
| Auftrag / Produktionsauftrag | `clipboard-list` | `ClipboardList` |
| Operation / Schritt | `git-commit` | `GitCommit` |
| Ressource / Maschine | `cpu` | `Cpu` |
| Kalender / Verfügbarkeit | `calendar` | `Calendar` |
| Material / Inventar | `package` | `Package` |
| Charge | `layers` | `Layers` |
| Simulationslauf | `play-circle` | `PlayCircle` |
| Audit-Trail | `history` | `History` |
| ERP-Adapter | `plug` | `Plug` |
| Industrie-Pack | `building-2` | `Building2` |
| Community / Beitrag | `users` | `Users` |
| Dokumentation | `book-open` | `BookOpen` |
| Einstellungen / Konfiguration | `settings` | `Settings` |
| API / Endpunkt | `server` | `Server` |
| Validierung / GxP | `badge-check` | `BadgeCheck` |
| KI / Wissen | `brain` | `Brain` |
| Roadmap / Plan | `map` | `Map` |
| Warnung / Abweichung | `alert-circle` | `AlertCircle` |
| Blockiert / Fehler | `x-circle` | `XCircle` |
| Erfolgreich / Freigegeben | `check-circle` | `CheckCircle` |

## Icon-Größen

| Kontext | Größe | stroke-width |
|---|---|---|
| Inline im Text | `16px` | `1.6` |
| Button / Label | `18px` | `1.6` |
| Karten- / Panel-Header | `20px` | `1.6` |
| Feature-Karte (groß) | `24px` | `1.5` |
| Hero / Illustration | `32–48px` | `1.4` |

## Verboten

- Emojis als UI-Icons (nur in Markdown-Text erlaubt, nicht in UI-Komponenten)
- Font Awesome (Lizenzkomplexität)
- Material Design Icons (visueller Stil inkonsistent mit Lucide)
- Ad-hoc SVGs ohne Eintrag in die Tabelle oben

## Neues Icon zur Tabelle hinzufügen

1. Beste Übereinstimmung auf [lucide.dev](https://lucide.dev/) finden
2. Zur Tabelle oben per PR hinzufügen
3. PR mit `docs:icons` taggen
