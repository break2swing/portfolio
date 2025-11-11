# Audit de Performance - Portfolio Next.js

**Date:** 2025-11-11
**Version:** 0.1.0

## 📊 Analyse initiale

### Build Time
- **Actuel:** > 2 minutes (timeout)
- **Objectif:** < 1 minute

### Bundle Size
- **À analyser:** `npm run analyze`
- **Objectif:** < 800KB total

## 🔍 Phase 1: Audit des dépendances

### Packages identifiés comme inutilisés

| Package | Taille estimée | Raison | Action |
|---------|---------------|--------|--------|
| `recharts` | ~400KB | Utilisé uniquement dans `ui/chart.tsx` jamais importé | ❌ SUPPRIMER |
| `vaul` | ~50KB | Utilisé uniquement dans `ui/drawer.tsx` jamais importé | ❌ SUPPRIMER |
| `input-otp` | ~20KB | Utilisé uniquement dans `ui/input-otp.tsx` jamais importé | ❌ SUPPRIMER |
| `react-resizable-panels` | ~30KB | Utilisé uniquement dans `ui/resizable.tsx` jamais importé | ❌ SUPPRIMER |
| `dompurify` | ~50KB | Doublon avec `isomorphic-dompurify` | ❌ SUPPRIMER |
| `@types/dompurify` | <1KB | Types pour package supprimé | ❌ SUPPRIMER |
| `next-themes` | ~10KB | ThemeContext custom utilisé à la place | ❌ SUPPRIMER |

**Total à supprimer:** ~560KB

### Packages à conserver

| Package | Utilisation | Notes |
|---------|-------------|-------|
| `cmdk` | GlobalSearch (Command menu) | ✅ Utilisé |
| `react-day-picker` | AdvancedFilters (calendrier) | ✅ Utilisé |
| `embla-carousel-react` | Mentionné dans docs | ⚠️ Vérifier utilisation réelle |
| `react-syntax-highlighter` | CodeViewer, MarkdownViewer | ✅ Utilisé |

### Packages Radix UI à auditer

Les composants UI les plus utilisés:
- ✅ button, input, label, textarea (forms)
- ✅ card (layouts)
- ✅ dialog, alert-dialog (modals)
- ✅ badge, separator (UI elements)
- ✅ select, tabs, switch (forms avancés)
- ✅ scroll-area, popover, dropdown-menu (interactions)

Composants potentiellement inutilisés:
- ⚠️ accordion, collapsible
- ⚠️ aspect-ratio, avatar
- ⚠️ breadcrumb, context-menu
- ⚠️ hover-card, menubar, navigation-menu
- ⚠️ progress, radio-group, slider
- ⚠️ toggle, toggle-group, tooltip

**Action:** Audit complet des imports Radix UI dans Phase 1.2

## 🎯 Phase 2: React Performance

### Contextes à optimiser

#### ThemeContext.tsx
```typescript
// AVANT
<ThemeContext.Provider value={{ theme, setTheme, cycleTheme, resolvedTheme }}>

// APRÈS
const value = useMemo(
  () => ({ theme, setTheme, cycleTheme, resolvedTheme }),
  [theme, resolvedTheme]
);
<ThemeContext.Provider value={value}>
```

#### ColorThemeContext.tsx
```typescript
// AVANT
<ColorThemeContext.Provider value={{ colorTheme, setColorTheme, customColors, setCustomColors }}>

// APRÈS
const value = useMemo(
  () => ({ colorTheme, setColorTheme, customColors, setCustomColors }),
  [colorTheme, customColors]
);
```

### Composants à mémoïser

- `Sidebar.tsx` → React.memo avec props comparison
- `PhotoGrid.tsx` → React.memo + optimisation des callbacks
- `AdvancedFilters.tsx` → React.memo
- `AppLayout.tsx` → useMemo pour style calculation

### Hooks à optimiser

#### useFilters.ts
- Séparer filtrage et tri en 2 useMemo
- Ajouter debouncing pour search (300ms)
- Optimiser availableTags calculation

## 🗄️ Phase 3: Database & Caching

### Cache Strategy

| Type de données | TTL actuel | TTL optimal | Stockage |
|----------------|-----------|-------------|----------|
| Photos/Videos/Music | 5 min | 15 min | session |
| Catégories | 5 min | 30 min | session |
| Tags | 5 min | 30 min | session |
| Favoris | - | - | localStorage + IndexedDB |

### Pagination

- Implémenter pagination côté serveur (25 items/page)
- Utiliser infinite scroll avec react-window
- Précharger page suivante au scroll

### Optimisation Supabase

```typescript
// AVANT
.select('*')

// APRÈS
.select('id,title,image_url,blur_data_url,created_at')
```

## 🖼️ Phase 4: Images

### LQIP automatique
- Script de build pour générer LQIP
- Stockage dans JSON pour référence rapide
- Compression optimale (10x10px, qualité 10%)

### Srcset automatique
- Générer 3 tailles: 320w, 640w, 1280w
- Attribut sizes intelligent basé sur viewport
- Support WebP avec fallback

### Compression upload
- Compression côté client avant upload (browser-image-compression)
- Max 1920px width, qualité 85%
- Génération thumbnail automatique

## 📦 Phase 5: Bundle Optimization

### Code Splitting

```javascript
// next.config.js
splitChunks: {
  cacheGroups: {
    // Existants
    vendor: { ... },
    markdown: { ... },
    radix: { ... },

    // Nouveaux
    dateFns: {
      name: 'date-fns',
      test: /[\\/]node_modules[\\/]date-fns[\\/]/,
      priority: 35,
    },
    lucide: {
      name: 'lucide',
      test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
      priority: 30,
    },
    admin: {
      name: 'admin',
      test: /[\\/]app[\\/]admin[\\/]/,
      priority: 40,
    },
  },
}
```

### Dynamic Imports

Routes à lazy load:
- `app/admin/*` → Lazy load complet
- `app/textes/page.tsx` → AdvancedFilters, MarkdownRenderer
- `app/photos/page.tsx` → PhotoViewerModal (déjà fait ✓)
- `app/videos/page.tsx` → VideoPlayerModal

### Tree Shaking

```typescript
// AVANT
import { format, parse, isAfter } from 'date-fns';

// APRÈS
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import isAfter from 'date-fns/isAfter';
```

## 🚀 Phase 6: Runtime Performance

### Logger optimization

```typescript
// lib/logger.ts
class Logger {
  private shouldLog(level: LogLevel): boolean {
    // Early return en production
    if (!this.isDevelopment && level !== 'error') return false;
    return LOG_LEVELS[level] >= LOG_LEVELS[this.currentLevel];
  }

  // Lazy evaluation du context
  debug(message: string, contextFn?: () => LogContext): void {
    if (!this.shouldLog('debug')) return;
    const context = contextFn ? contextFn() : undefined;
    // ...
  }
}
```

### Web Workers

Déplacer dans Workers:
- Filtrage complexe (useFilters)
- Recherche full-text
- Génération LQIP

## 🌐 Phase 7: Network Optimization

### Resource Hints

```tsx
// app/layout.tsx
<head>
  <link rel="preconnect" href={SUPABASE_URL} crossOrigin="anonymous" />
  <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
  <link rel="preload" as="font" href="/fonts/inter.woff2" crossOrigin="anonymous" />
  <link rel="preload" as="image" href="/og-image.jpg" />
</head>
```

### Prefetching

- Prefetch routes au hover (déjà dans Sidebar ✓)
- Prefetch données critiques (PrefetchData ✓)
- Implémenter predictive prefetch

## 📈 Phase 8: Monitoring

### Performance Budgets

```javascript
// scripts/performance-budget.js
const budgets = {
  'main.js': 200 * 1024,      // 200KB
  'vendor.js': 300 * 1024,    // 300KB
  'radix.js': 150 * 1024,     // 150KB
  'markdown.js': 100 * 1024,  // 100KB
  total: 800 * 1024,          // 800KB
};
```

### Lighthouse CI

- Automatiser tests sur chaque PR
- Score minimum: 90+ pour Performance
- Tracking des Core Web Vitals

## ✅ Checklist d'implémentation

### Phase 1 - Quick Wins (1-2h)
- [ ] Supprimer packages inutilisés (recharts, vaul, etc.)
- [ ] Optimiser imports (tree-shaking)
- [ ] Memoization contextes

### Phase 2 - React Performance (1 jour)
- [ ] React.memo sur composants lourds
- [ ] Optimiser useFilters
- [ ] Optimiser Sidebar
- [ ] Optimiser AppLayout

### Phase 3 - Bundle (1 jour)
- [ ] Analyser bundle actuel
- [ ] Ajouter chunks optimisés
- [ ] Dynamic imports routes admin
- [ ] Lazy load composants lourds

### Phase 4 - Images (1 jour)
- [ ] Script LQIP automatique
- [ ] Srcset automatique
- [ ] Compression upload
- [ ] Optimiser OptimizedImage

### Phase 5 - Database (1 jour)
- [ ] Implémenter pagination
- [ ] Optimiser requêtes Supabase
- [ ] Améliorer stratégie cache
- [ ] Batching

### Phase 6 - Runtime (1 jour)
- [ ] Optimiser logger
- [ ] Web Workers
- [ ] Hydration optimization

### Phase 7 - Polish (1 jour)
- [ ] Resource hints
- [ ] Performance budgets
- [ ] Lighthouse CI
- [ ] Documentation

## 🎯 Objectifs finaux

| Métrique | Avant | Objectif | Méthode de mesure |
|----------|-------|----------|-------------------|
| Build Time | >2min | <1min | `time npm run build` |
| Bundle Size | TBD | <800KB | `npm run analyze` |
| LCP | TBD | <2.5s | Lighthouse |
| FID/INP | TBD | <100ms | Lighthouse |
| CLS | TBD | <0.1 | Lighthouse |
| TTI | TBD | <3s | Lighthouse |
| FCP | TBD | <1.5s | Lighthouse |

## 📝 Notes

- Tous les changements doivent préserver la fonctionnalité actuelle
- Tests manuels requis après chaque phase
- Performance tracking avec Web Vitals en place ✓
- Cache system déjà implémenté ✓
- LQIP partiellement implémenté ✓

---

**Prochaine étape:** Commencer Phase 1 - Suppression packages inutilisés
