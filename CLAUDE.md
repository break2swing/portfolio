# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Portfolio personnel Next.js 13 avec export statique, utilisant l'App Router et un système de double thème (clair/sombre + couleurs personnalisables).

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
- `/` - Page d'accueil
- `/a-propos` - Page à propos
- `/applications` - Portfolio d'applications
- `/musique` - Créations musicales
- `/photos` - Galerie photos
- `/videos` - Galerie vidéos
- `/textes` - Créations textuelles
- `/contact` - Page de contact
- `/parametres` - Paramètres d'apparence

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
           └─ AppLayout (client component)
              ├─ Sidebar (collapsible, largeur variable)
              ├─ Topbar
              └─ Main content area
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
- `services/photoService.ts` - Gestion des photos
- `services/storageService.ts` - Gestion du stockage Supabase

Les services encapsulent les appels Supabase et sont utilisés par les contextes et composants.

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
- **Storage** : Service de stockage de fichiers disponible
- Configuration via variables d'environnement (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)

### Notifications

**Sonner** est utilisé pour les notifications toast :
- Composant `<Toaster />` monté au niveau root dans `layout.tsx`
- Import depuis `@/components/ui/sonner`

## Dependencies Notes

- **React Hook Form** + **Zod** disponibles pour les formulaires
- **Lucide React** pour les icônes
- **date-fns** pour la manipulation de dates
- **Recharts** pour les graphiques (si nécessaire)
