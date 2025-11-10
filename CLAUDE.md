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
```

## Architecture

### Next.js Configuration

- **Mode export statique** (`output: 'export'` dans next.config.js)
- Images non optimisées pour compatibilité avec l'export statique
- ESLint ignoré pendant les builds
- App Router (Next.js 13+)

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
- `/admin/texts` - Administration des textes

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
           ├─ AppLayout (client component)
           │  ├─ Sidebar (collapsible, largeur variable)
           │  ├─ Topbar
           │  └─ Main content area
           └─ Toaster (sonner notifications)
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
- `services/authService.ts` - Wrapper autour de Supabase Auth
- `services/photoService.ts` - Gestion des photos (CRUD + ordre d'affichage)
- `services/musicService.ts` - Gestion des morceaux de musique (CRUD + ordre d'affichage)
- `services/textService.ts` - Gestion des textes (CRUD + ordre d'affichage, catégories, tags, recherche)
- `services/categoryService.ts` - Gestion des catégories pour les textes (CRUD + ordre d'affichage)
- `services/tagService.ts` - Gestion des tags pour les textes (CRUD + relations text_tags)
- `services/storageService.ts` - Gestion du stockage Supabase (photos et fichiers audio)

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
  - `photos` - Galerie de photos
  - `music_tracks` - Bibliothèque musicale
  - `texts` - Textes et articles (avec support Markdown)
  - `categories` - Catégories pour organiser les textes
  - `tags` - Tags pour étiqueter les textes
  - `text_tags` - Table de liaison entre textes et tags
- Configuration via variables d'environnement (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)

**Types TypeScript** : `lib/supabaseClient.ts` exporte les types `Photo`, `MusicTrack`, `Text`, `TextWithMetadata`, `Category`, `Tag`, `TextTag` et `Database` pour une utilisation typée dans tout le projet.

### Notifications

**Sonner** est utilisé pour les notifications toast :
- Composant `<Toaster />` monté au niveau root dans `layout.tsx`
- Import depuis `@/components/ui/sonner`

## Dependencies Notes

- **React Hook Form** + **Zod** disponibles pour les formulaires
- **Lucide React** pour les icônes
- **date-fns** pour la manipulation de dates
- **Recharts** pour les graphiques (si nécessaire)
- **react-markdown** + **remark-gfm** pour le rendu Markdown des textes
- **sonner** pour les notifications toast
- **next-themes** pour la gestion des thèmes clair/sombre

## Outils IA

Ce projet supporte plusieurs outils d'IA en CLI :
- **Claude Code** : `/agents-update` (ce fichier est optimisé pour Claude)
- **Gemini CLI** : `gemini run agents-update`
- **Codex CLI** : `codex agents-update`

Voir [AI_TOOLS.md](./AI_TOOLS.md) pour plus de détails sur l'utilisation des différents outils.

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md
