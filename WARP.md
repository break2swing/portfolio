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

### Analyse et audit

```bash
# Analyser la taille du bundle
npm run analyze

# Vérifier la taille du bundle
npm run check-bundle

# Audit de sécurité
npm run audit

# Correction automatique des vulnérabilités
npm run audit:fix

# Générer les LQIP pour les images (Low Quality Image Placeholder)
npm run generate-lqip
# Note : Visiter /admin/migrate-lqip dans le navigateur
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
- **Gestion d'état** : React Context + Custom Hooks
- **Optimisation** : Bundle Analyzer, Image Compression, LQIP (Low Quality Image Placeholder)
- **Performance** : Web Vitals monitoring, Virtual scrolling (@tanstack/react-virtual)
- **Drag & Drop** : @dnd-kit (sortable, core, utilities)
- **Markdown** : react-markdown + remark-gfm + react-syntax-highlighter
- **Formulaires** : react-hook-form + zod (validation)
- **UI Components** : embla-carousel, recharts, vaul, cmdk
- **Sécurité** : dompurify (sanitization), rate limiting

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
- **`services/videoService.ts`** : CRUD pour la table `videos` + validation d'URL + rate limiting
- **`services/textService.ts`** : CRUD pour la table `texts` + cache + logging
- **`services/storageService.ts`** : Upload/delete fichiers sur buckets Supabase (`photo-files`, `audio-files`)
- **`services/githubService.ts`** : Intégration GitHub API pour repositories
- **`services/repositoryService.ts`** : CRUD pour repositories (local/GitHub)
- **`services/playlistService.ts`** : Gestion des playlists musicales
- **`services/categoryService.ts`** : CRUD pour les catégories
- **`services/tagService.ts`** : CRUD pour les tags
- **`services/photoTagService.ts`** : Relations photos-tags
- **`services/musicTagService.ts`** : Relations music-tags
- **`services/videoTagService.ts`** : Relations videos-tags

**Convention** : Chaque méthode retourne `{ data, error }` pour une gestion d'erreur cohérente.

**Fonctionnalités avancées** :
- Cache avec TTL et invalidation par pattern (`lib/cache.ts`)
- Logging structuré (`lib/logger.ts`)
- Validation d'URL et sanitization (`lib/urlValidation.ts`)
- Rate limiting pour protéger les API (`lib/rateLimiter.ts`)

### Custom Hooks

Le projet utilise plusieurs hooks personnalisés pour la logique réutilisable :

- **`hooks/useAuth.ts`** : Hook pour l'authentification
- **`hooks/useBookmarks.ts`** : Gestion des favoris
- **`hooks/useClickOutside.ts`** : Détection des clics en dehors d'un élément
- **`hooks/useDebounce.ts`** : Debouncing pour les inputs
- **`hooks/useFilters.ts`** : Gestion des filtres (catégories, tags, recherche)
- **`hooks/useGlobalSearch.ts`** : Recherche globale dans le portfolio
- **`hooks/use-toast.ts`** : Hook pour les notifications (shadcn/ui)

### Composants UI

- **shadcn/ui** : Bibliothèque complète sous `components/ui/`
- **Tailwind CSS** : Styling avec l'utilitaire `cn()` (`lib/utils.ts`)
- **Alias de chemin** : `@/*` → racine du projet

**Composants personnalisés** :
- **Layout** : `AppLayout`, `Sidebar`, `MobileSidebar`, `Topbar`
- **Navigation** : `SkipToContent`, `GlobalSearch`, `AdvancedFilters`
- **Médias** : `OptimizedImage` (LQIP), `VirtualizedPhotoGrid`, `PhotoViewerModal`
- **Musique** : `AudioPlayer`, `AudioVisualization`, `PlaylistManager`, `TrackList`
- **Vidéos** : Composants de gestion vidéo
- **Textes** : `MarkdownViewer`, `CodeViewer`
- **Applications** : `RepositoryCard`, `RepositoryDetail`, `FileExplorer`
- **Interactions** : `BookmarkButton`, `ShareButton`, `RefreshButton`
- **Performance** : `PrefetchData`, `WebVitals`
- **Sécurité** : `ProtectedRoute` (wrapper pour routes admin)

## Backend Supabase

### Configuration

- **Client** : `lib/supabaseClient.ts`
- **Variables requises** (`.env.local`) :
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Base de données

**Tables** (types dans `lib/supabaseClient.ts`) :
- `photos` : galerie photos (id, title, description, image_url, blur_data_url, display_order, user_id, created_at)
- `music_tracks` : bibliothèque musicale (id, title, artist, album, audio_url, cover_image_url, duration, display_order, user_id, created_at)
- `videos` : galerie vidéos (id, title, description, video_url, thumbnail_url, duration, display_order, user_id, created_at)
- `texts` : créations textuelles (id, title, subtitle, content, excerpt, author, published_date, category_id, is_published, view_count, display_order, user_id, created_at, updated_at)
- `categories` : catégories pour textes (id, name, slug, description, color, display_order, created_at, updated_at)
- `tags` : tags réutilisables (id, name, slug, color, created_at, updated_at)
- `photo_tags` : relation photos-tags (photo_id, tag_id, created_at)
- `music_tags` : relation music-tags (music_track_id, tag_id, created_at)
- `video_tags` : relation videos-tags (video_id, tag_id, created_at)
- `text_tags` : relation texts-tags (text_id, tag_id, created_at)
- `repositories` : applications/repositories (id, name, description, source_type, github_owner, github_repo, github_branch, storage_path, language, is_public, display_order, user_id, created_at, updated_at)
- `repository_files` : fichiers de repositories (id, repository_id, path, content, size, is_directory, last_modified, created_at)
- `playlists` : playlists musicales (id, name, description, user_id, is_public, display_order, created_at, updated_at)
- `playlist_tracks` : relation playlists-tracks (id, playlist_id, track_id, display_order, added_at)

**RLS (Row Level Security)** :
- `SELECT` : public (anon, authenticated)
- `INSERT` / `UPDATE` / `DELETE` : authenticated uniquement

**Schéma SQL** : Voir `database/schema.sql` pour la structure complète

### Storage

**Buckets** :
- `photo-files` : images (public)
- `audio-files` : fichiers audio
- Configuration : compression d'image côté client (browser-image-compression)
- LQIP : génération de placeholders basse qualité pour améliorer le LCP

**Auth** : Supabase Auth avec email/password
- Session persistante avec auto-refresh
- Détection de session dans URL

## Structure des routes

### Pages publiques

- `/` — Page d'accueil
- `/photos` — Galerie photos (avec virtualisation)
- `/musique` — Créations musicales (lecteur + playlists)
- `/videos` — Galerie vidéos
- `/textes` — Créations textuelles (Markdown + catégories + tags)
- `/applications` — Portfolio d'applications (GitHub integration)
- `/applications/[id]` — Détail d'une application (viewer de code)
- `/favoris` — Page des favoris
- `/a-propos` — Page à propos
- `/contact` — Page de contact
- `/parametres` — Paramètres d'apparence

### Pages admin (protégées)

- `/login` — Authentification
- `/admin/photos` — Gestion galerie photos (upload, réordonnancement, suppression, tags)
- `/admin/music` — Gestion bibliothèque musicale (upload, playlists, tags)
- `/admin/videos` — Gestion galerie vidéos (upload, tags)
- `/admin/textes` — Gestion créations textuelles (Markdown, catégories, tags)
- `/admin/applications` — Gestion portfolio applications (local/GitHub)
- `/admin/migrate-lqip` — Outil de migration LQIP pour images existantes

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

## Fonctionnalités avancées

### Système de tags et catégories

- **Catégories** : Pour les textes uniquement (hiérarchie sémantique)
- **Tags** : Système transversal pour photos, musiques, vidéos et textes
- **Relations many-to-many** : tables de jonction pour chaque type de contenu
- **Filtres avancés** : Combinaison catégories + tags + recherche textuelle

### Optimisation des performances

- **Virtual scrolling** : Pour les grandes listes (photos, textes)
- **LQIP (Low Quality Image Placeholder)** : Améliore le LCP (Largest Contentful Paint)
- **Lazy loading** : Images et composants chargés à la demande
- **Cache** : Stratégie de cache avec TTL pour réduire les appels Supabase
- **Bundle analysis** : Monitoring de la taille du bundle
- **Web Vitals** : Monitoring des Core Web Vitals en production

### Recherche et filtres

- **Recherche globale** : Recherche multi-contenu (photos, musiques, vidéos, textes, applications)
- **Filtres avancés** : Par catégorie, tags, date, type de contenu
- **Debouncing** : Optimisation des requêtes de recherche

### Intégration GitHub

- **Repositories** : Affichage de projets GitHub
- **File explorer** : Navigation dans les fichiers du repository
- **Code viewer** : Coloration syntaxique avec react-syntax-highlighter
- **Metadata** : Langages, statistiques, README

### Système de favoris

- **Bookmarks** : Marquer des contenus favoris
- **Persistance** : localStorage pour préserver les favoris
- **Page dédiée** : `/favoris` pour retrouver tous les contenus favoris

### Sécurité

- **Rate limiting** : Protection contre les abus d'API
- **URL validation** : Validation stricte des URLs de médias
- **Content sanitization** : DOMPurify pour nettoyer le HTML/Markdown
- **RLS (Row Level Security)** : Policies Supabase strictes

## Structure des dossiers

```
portfolio/
├── .bolt/              # Configuration Bolt
├── .claude/            # Configuration Claude
├── .codex/             # Configuration Codex
├── .cursor/            # Configuration Cursor
├── .gemini/            # Configuration Gemini
├── .github/            # GitHub workflows
├── .kiro/              # Configuration Kiro
├── .plan/              # Plans de développement
├── .specstory/         # Spécifications
├── .taskmaster/        # Gestion des tâches
├── .vscode/            # Configuration VS Code
├── app/                # Pages Next.js (App Router)
├── components/         # Composants React
├── contexts/           # React Contexts
├── database/           # Schémas SQL
├── docs/               # Documentation
├── hooks/              # Custom hooks
├── lib/                # Utilitaires et clients
├── public/             # Fichiers statiques
├── scripts/            # Scripts utilitaires
└── services/           # Couche service (logique métier)
```

## Documentation de référence

Pour plus de détails sur l'architecture, les patterns et les workflows :

- **README.md** — Démarrage rapide et technologies
- **SETUP_SUPABASE.md** — Configuration Supabase pas à pas
- **SETUP_PHOTOS.md** — Configuration spécifique pour la galerie photos
- **SETUP_TEXTS.md** — Configuration spécifique pour les textes
- **CLAUDE.md** — Architecture complète et patterns de développement
- **AGENTS.md** — Conventions de code et workflows pour agents IA
- **AI_TOOLS.md** — Guide des outils IA (Claude, Gemini, Codex)
- **GEMINI.md** — Configuration spécifique Gemini
