# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Portfolio personnel Next.js 13 avec export statique, utilisant l'App Router et un système de double thème (clair/sombre + couleurs personnalisables).

## Setup Initial

### Configuration des variables d'environnement

Le projet nécessite Supabase. Avant de démarrer :

1. Copiez `.env.example` vers `.env.local`
2. Remplissez les variables Supabase (voir `SETUP_SUPABASE.md` pour les détails)
3. Redémarrez le serveur après modification

**Important** : `.env.local` n'est pas commité (dans `.gitignore`)

## Development Commands

```bash
# Development server
npm run dev

# Build for production (static export)
npm run build

# Start production server
npm start

# Linting
npm run lint

# Type checking
npm run typecheck

# Bundle analysis
npm run analyze
npm run check-bundle

# LQIP generation for existing images
npm run generate-lqip  # Instructions pour utiliser /admin/migrate-lqip

# Security audit
npm run audit
npm run audit:fix
```

## Architecture

### Next.js Configuration

- **Mode export statique** (`output: 'export'` dans next.config.js)
- Images non optimisées pour compatibilité avec l'export statique
- ESLint ignoré pendant les builds
- App Router (Next.js 13+)
- **Optimisations webpack** :
  - Chunks séparés pour vendor, markdown (react-markdown), et radix-ui
  - `removeConsole` en production (sauf error/warn)
  - Source maps désactivés en production
- **Bundle analyzer** intégré avec `@next/bundle-analyzer`

### Structure des Routes

Le projet utilise l'App Router avec les routes suivantes :

**Pages publiques** :
- `/` - Page d'accueil
- `/a-propos` - Page à propos
- `/applications` - Portfolio d'applications
- `/musique` - Créations musicales
- `/photos` - Galerie photos
- `/videos` - Galerie vidéos
- `/textes` - Créations textuelles (affichage des textes publiés)
- `/contact` - Page de contact
- `/parametres` - Paramètres d'apparence

**Pages d'authentification** :
- `/login` - Page de connexion/authentification

**Pages d'administration** (protégées, nécessitent authentification) :
- `/admin/photos` - Administration de la galerie photos
- `/admin/music` - Administration de la bibliothèque musicale
- `/admin/videos` - Administration de la galerie vidéos
- `/admin/texts` - Administration des textes
- `/admin/migrate-lqip` - Utilitaire de migration LQIP pour images existantes

Chaque route a son propre fichier `page.tsx` dans un dossier dédié sous `app/`.

### Layout System

**Double Layout Pattern** :
1. `app/layout.tsx` - Root layout avec providers de contexte
2. `components/AppLayout.tsx` - Client component gérant la structure UI (sidebar + topbar)

Cette séparation permet d'avoir un layout côté serveur avec metadata et des composants interactifs côté client.

**Structure de base** :
```
<html> (app/layout.tsx)
  └─ ThemeProvider
     └─ ColorThemeProvider
        └─ AuthProvider
           ├─ PrefetchData (préchargement catégories/tags)
           ├─ AppLayout (client component)
           │  ├─ SkipToContent (a11y)
           │  ├─ Sidebar (collapsible, largeur variable)
           │  ├─ Topbar
           │  └─ Main content area
           ├─ Toaster (sonner notifications)
           └─ WebVitals (monitoring des performances)
```

### Theme System

**Double système de thèmes** géré par deux contextes séparés :

1. **ThemeContext** (`contexts/ThemeContext.tsx`)
   - Gère le mode clair/sombre/système
   - Applique la classe `dark` sur `<html>`
   - Synchronisé avec les préférences système
   - État persisté dans localStorage

2. **ColorThemeContext** (`contexts/ColorThemeContext.tsx`)
   - 4 thèmes prédéfinis : ocean, forest, sun, rose
   - Mode custom avec couleurs personnalisables
   - Applique les CSS custom properties `--theme-primary`, `--theme-secondary`, `--theme-accent`
   - État persisté dans localStorage

3. **AuthContext** (`contexts/AuthContext.tsx`)
   - Gère l'authentification via Supabase
   - Expose `user`, `session`, `loading`, `signIn()`, `signOut()`
   - Écoute les changements d'état d'authentification avec `onAuthStateChange`
   - Délègue la logique à `authService` pour la séparation des responsabilités

### Component Library

**shadcn/ui** - Collection complète de composants UI dans `components/ui/`:
- Tous les composants sont pré-installés (accordion, alert-dialog, button, card, etc.)
- Utilise Radix UI comme base
- Stylé avec Tailwind CSS
- Importés depuis `@/components/ui/*`

### Styling

- **Tailwind CSS 3.3.3** avec configuration personnalisée
- **CSS Variables** pour les thèmes de couleurs
- Plugin `tailwindcss-animate` pour les animations
- Alias de chemin : `@/*` pointe vers la racine du projet

### TypeScript

- Configuration stricte activée
- Module resolution : `bundler`
- Path alias configuré : `@/*` → `./*`
- Type checking avec `npm run typecheck`

## Development Patterns

### Client Components

Tous les composants interactifs doivent utiliser `'use client'` en première ligne car le projet utilise l'App Router avec export statique.

### State Management

- Contexts React pour la gestion globale (thèmes, authentification)
- localStorage pour la persistance des préférences UI
- Pas de state management externe (Redux, Zustand, etc.)

### Service Layer

Le projet utilise une couche service pour la logique métier :

**Services principaux** :
- `services/authService.ts` - Wrapper autour de Supabase Auth
- `services/photoService.ts` - Gestion des photos (CRUD + ordre d'affichage)
- `services/musicService.ts` - Gestion des morceaux de musique (CRUD + ordre d'affichage)
- `services/videoService.ts` - Gestion des vidéos (CRUD + ordre d'affichage)
- `services/textService.ts` - Gestion des textes (CRUD + ordre d'affichage, catégories, tags, recherche)
- `services/categoryService.ts` - Gestion des catégories pour les textes (CRUD + ordre d'affichage)
- `services/storageService.ts` - Gestion du stockage Supabase (photos, audio, vidéos)

**Services de tags spécialisés** :
- `services/tagService.ts` - Gestion globale des tags (CRUD)
- `services/photoTagService.ts` - Relations entre photos et tags
- `services/musicTagService.ts` - Relations entre morceaux et tags
- `services/videoTagService.ts` - Relations entre vidéos et tags

Les services encapsulent les appels Supabase et sont utilisés par les contextes et composants. Tous suivent le pattern de retour `{ data, error }` pour faciliter la gestion d'erreurs.

### Sidebar Behavior

La sidebar utilise un système de communication custom via événements :
- État stocké dans localStorage (`sidebarExpanded`)
- Largeur : 256px (expanded) / 64px (collapsed)
- Communication entre composants via événements `storage` et `sidebar-toggle`
- Le layout principal s'adapte via `marginLeft` dynamique

## Backend & Data

### Supabase Integration

Le projet utilise **Supabase** comme backend :
- Client initialisé dans `lib/supabaseClient.ts`
- **Authentification** : Gérée via `authService` avec email/password
- **Storage** : Service de stockage de fichiers disponible (buckets `photo-files` et `audio-files`)
- **Base de données** : Tables principales :
  - `photos` - Galerie de photos (avec champ `blur_data_url` pour LQIP)
  - `music_tracks` - Bibliothèque musicale
  - `videos` - Galerie de vidéos
  - `texts` - Textes et articles (avec support Markdown)
  - `categories` - Catégories pour organiser les textes
  - `tags` - Tags pour étiqueter tous les types de contenu
  - `text_tags`, `music_tags`, `video_tags`, `photo_tags` - Tables de liaison many-to-many
- Configuration via variables d'environnement (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)

**Types TypeScript** : `lib/supabaseClient.ts` exporte les types `Photo`, `MusicTrack`, `Video`, `Text`, `Category`, `Tag`, ainsi que les types enrichis `TextWithMetadata`, `MusicTrackWithTags`, `VideoWithTags`, `PhotoWithTags` et les types de liaison `TextTag`, `MusicTag`, `VideoTag`, `PhotoTag`. Le type `Database` contient toute la structure typée de la base.

### Notifications

**Sonner** est utilisé pour les notifications toast :
- Composant `<Toaster />` monté au niveau root dans `layout.tsx`
- Import depuis `@/components/ui/sonner`

### Système de bibliothèques utilitaires

Le projet inclut plusieurs bibliothèques système pour améliorer les performances et l'observabilité :

**Performance et cache** :
- `lib/cache.ts` - Système de cache côté client avec TTL, support sessionStorage
- `lib/image.ts` - Génération de LQIP (Low Quality Image Placeholder) avec Canvas API, génération srcset/sizes
- `lib/imageUtils.ts` - Utilitaires supplémentaires pour images

**Monitoring et logs** :
- `lib/logger.ts` - Système de logs structurés avec niveaux (debug/info/warn/error), namespaces, sanitization
- `lib/analytics.ts` - RUM (Real User Monitoring) pour Core Web Vitals, intégration Google Analytics/Vercel
- `components/WebVitals.tsx` - Collecte automatique des métriques (CLS, FCP, INP, LCP, TTFB)
- `components/PrefetchData.tsx` - Préchargement intelligent des données critiques (catégories/tags)

**Validation et sécurité** :
- `lib/validators.ts` - Schémas Zod pour texts, categories, tags (avec validation HSL/hex colors)
- `lib/fileValidation.ts` - Validation de fichiers uploadés
- `lib/urlValidation.ts` - Validation et sanitization d'URLs
- `lib/rateLimiter.ts` - Rate limiting côté client

**Recherche** :
- `lib/search.ts` - Fonctionnalités de recherche
- `lib/searchHistory.ts` - Gestion de l'historique de recherche

**Composants d'optimisation** :
- `components/OptimizedImage.tsx` - Composant d'image avec lazy loading (Intersection Observer), LQIP, srcset/sizes, fallback SVG

## Dependencies Notes

**UI et formulaires** :
- **shadcn/ui** + **Radix UI** - Composants UI accessibles
- **React Hook Form** + **Zod** disponibles pour les formulaires
- **Lucide React** pour les icônes
- **Tailwind CSS** + **tailwindcss-animate** pour le styling

**Fonctionnalités** :
- **date-fns** pour la manipulation de dates
- **Recharts** pour les graphiques
- **react-markdown** + **remark-gfm** pour le rendu Markdown des textes
- **isomorphic-dompurify** pour la sanitization XSS

**Performance** :
- **web-vitals** pour le monitoring des Core Web Vitals
- **browser-image-compression** pour la compression d'images côté client
- **@tanstack/react-virtual** pour la virtualisation de longues listes
- **@next/bundle-analyzer** pour l'analyse du bundle

**Notifications et UI** :
- **sonner** pour les notifications toast
- **next-themes** pour la gestion des thèmes clair/sombre
- **embla-carousel-react** pour les carrousels
- **vaul** pour les drawers

## Outils IA

Ce projet supporte plusieurs outils d'IA en CLI :
- **Claude Code** : `/agents-update` (ce fichier est optimisé pour Claude)
- **Gemini CLI** : `gemini run agents-update`
- **Codex CLI** : `codex agents-update`

Voir [AI_TOOLS.md](./AI_TOOLS.md) pour plus de détails sur l'utilisation des différents outils.

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md
