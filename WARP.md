# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Développement — commandes essentielles

### Installation et démarrage

```bash
# Installer les dépendances
npm install

# Démarrer le serveur de développement (http://localhost:3000)
npm run dev

# Build de production (export statique vers out/)
npm run build

# Lancer en production
npm start
```

### Qualité du code

```bash
# Lint (ESLint)
npm run lint

# Vérification des types (TypeScript)
npm run typecheck
```

### Configuration initiale (Supabase)

```bash
# Copier le fichier d'exemple
cp .env.example .env.local

# Puis éditez .env.local et renseignez :
# NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon
```

**Note** : Voir `SETUP_SUPABASE.md` pour la configuration détaillée de Supabase (tables, buckets, RLS).

**Tests** : À date, aucun script de test n'est défini dans `package.json`.

## Architecture high-level

### Stack technique

- **Framework** : Next.js 13 (App Router) avec export statique (`output: 'export'`)
- **UI** : React 18 + Tailwind CSS + shadcn/ui (Radix UI)
- **Backend** : Supabase (Auth, Database, Storage)
- **TypeScript** : Configuration stricte
- **Icônes** : Lucide React
- **Notifications** : Sonner

### Pattern de Layout

**Double Layout Pattern** pour séparer Server et Client Components :

1. **`app/layout.tsx`** (Server Component)
   - Installe les providers globaux : `ThemeProvider`, `ColorThemeProvider`, `AuthProvider`
   - Monte le `<Toaster />` (sonner) au niveau racine
   - Wrapper `<AppLayout>{children}</AppLayout>`

2. **`components/AppLayout.tsx`** (Client Component)
   - Gère la structure UI : `<Sidebar />`, `<Topbar />`, zone de contenu
   - Synchronise la largeur de la sidebar (256px expanded / 64px collapsed)
   - État persisté dans `localStorage.sidebarExpanded`
   - Communication via événement custom `sidebar-toggle` et `storage`

### Système de double thème

Le projet implémente **deux systèmes de thème indépendants** :

1. **ThemeContext** (`contexts/ThemeContext.tsx`)
   - Mode : clair / sombre / système
   - Applique la classe `dark` sur `<html>`
   - Persistance : `localStorage.theme`
   - Synchronisé avec les préférences système

2. **ColorThemeContext** (`contexts/ColorThemeContext.tsx`)
   - 4 presets : ocean, forest, sun, rose
   - Mode custom avec couleurs personnalisables
   - Applique les CSS variables : `--theme-primary`, `--theme-secondary`, `--theme-accent`
   - Persistance : `localStorage.colorTheme` et `localStorage.customColors`

### Contextes globaux

**AuthContext** (`contexts/AuthContext.tsx`)
- Expose : `user`, `session`, `loading`, `signIn()`, `signOut()`
- Écoute `onAuthStateChange` de Supabase
- Délègue la logique à `authService`

### Service Layer

Architecture avec couche service pour la logique métier (pattern `{ data, error }`) :

- **`services/authService.ts`** : Wrapper Supabase Auth (email/password)
- **`services/photoService.ts`** : CRUD pour la table `photos` + gestion `display_order`
- **`services/musicService.ts`** : CRUD pour la table `music_tracks` + gestion `display_order`
- **`services/storageService.ts`** : Upload/delete fichiers sur buckets Supabase (`photo-files`, `audio-files`)

**Convention** : Chaque méthode retourne `{ data, error }` pour une gestion d'erreur cohérente.

### Composants UI

- **shadcn/ui** : Bibliothèque complète sous `components/ui/`
- **Tailwind CSS** : Styling avec l'utilitaire `cn()` (`lib/utils.ts`)
- **Alias de chemin** : `@/*` → racine du projet

## Backend Supabase

### Configuration

- **Client** : `lib/supabaseClient.ts`
- **Variables requises** (`.env.local`) :
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Base de données

**Tables** (types dans `lib/supabaseClient.ts`) :
- `photos` : galerie photos (id, title, description, image_url, display_order, created_at)
- `music_tracks` : bibliothèque musicale (id, title, artist, album, audio_url, cover_image_url, duration, display_order, user_id, created_at)

**RLS (Row Level Security)** :
- `SELECT` : public (anon, authenticated)
- `INSERT` / `UPDATE` / `DELETE` : authenticated uniquement

### Storage

**Buckets** :
- `photo-files` : images (public)
- `audio-files` : fichiers audio

**Auth** : Supabase Auth avec email/password

## Structure des routes

### Pages publiques

- `/` — Page d'accueil
- `/photos` — Galerie photos
- `/musique` — Créations musicales (lecteur + embeds SoundCloud)
- `/videos` — Galerie vidéos
- `/textes` — Créations textuelles
- `/applications` — Portfolio d'applications
- `/a-propos` — Page à propos
- `/contact` — Page de contact
- `/parametres` — Paramètres d'apparence

### Pages admin (protégées)

- `/login` — Authentification
- `/admin/photos` — Gestion galerie photos (upload, réordonnancement, suppression)
- `/admin/music` — Gestion bibliothèque musicale

**Protection** : Les pages `/admin/*` sont wrapées dans `<ProtectedRoute>` qui redirige vers `/login` si non authentifié.

## Points clés de développement

### Client vs Server Components

- **Utiliser `'use client'`** pour :
  - Hooks React (useState, useEffect, etc.)
  - Event handlers
  - Contextes
  - Animations/interactions

- **Server Component** par défaut pour :
  - Layouts avec metadata uniquement
  - Composants purement statiques

### Persistance UI

**localStorage** (clés utilisées) :
- `theme` : mode clair/sombre/système
- `colorTheme` : preset de couleur sélectionné
- `customColors` : couleurs custom (JSON)
- `sidebarExpanded` : état de la sidebar (boolean)

**Événements** :
- `storage` : synchronisation entre onglets
- `sidebar-toggle` : communication custom pour la sidebar

### Export statique

- Mode configuré dans `next.config.js` : `output: 'export'`
- Pas de `getServerSideProps` ou `getStaticProps` (App Router)
- Images : `unoptimized: true`
- Pas d'API routes (`app/api/` ne fonctionnera pas)
- Variables d'environnement : préfixe `NEXT_PUBLIC_` pour client-side

### Gestion d'erreur

**Pattern service** :
```typescript
async function serviceMethod() {
  try {
    const { data, error } = await supabaseCall();
    if (error) return { data: null, error };
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
```

**Pattern composant** :
```typescript
const handleAction = async () => {
  const { error } = await service.method();
  if (error) {
    toast.error('Message d\'erreur');
    return;
  }
  toast.success('Succès !');
};
```

## Documentation de référence

Pour plus de détails sur l'architecture, les patterns et les workflows :

- **README.md** — Démarrage rapide et technologies
- **SETUP_SUPABASE.md** — Configuration Supabase pas à pas
- **CLAUDE.md** — Architecture complète et patterns de développement
- **AGENTS.md** — Conventions de code et workflows pour agents IA
