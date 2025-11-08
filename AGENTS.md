# AGENTS.md

Ce fichier contient les conventions, patterns et workflows spécifiques pour les agents d'IA travaillant sur ce projet.

## Conventions de Code

### Naming Conventions

- **Composants React** : PascalCase (ex: `AppLayout`, `ThemeToggle`)
- **Hooks personnalisés** : camelCase avec préfixe `use` (ex: `useTheme`, `useAuth`)
- **Services** : camelCase avec suffixe `Service` (ex: `authService`, `photoService`)
- **Contextes** : PascalCase avec suffixe `Context` (ex: `ThemeContext`, `AuthContext`)
- **Fichiers** : Match le nom du composant/service principal

### Structure des Fichiers

#### Composants React
```tsx
'use client'; // Si nécessaire

import { ... } from '...';

interface ComponentProps {
  // Props typées
}

export function ComponentName({ props }: ComponentProps) {
  // Hooks en premier
  // États locaux
  // Effets
  // Handlers

  return (
    // JSX
  );
}
```

#### Services
```ts
import { supabaseClient } from '@/lib/supabaseClient';

export const serviceName = {
  async method() {
    // Logique
  },
};
```

#### Contextes
```tsx
'use client';

import { createContext, useContext, ... } from 'react';

interface ContextType {
  // Types
}

const Context = createContext<ContextType | undefined>(undefined);

export function ContextProvider({ children }: { children: React.ReactNode }) {
  // Logic
  return <Context.Provider value={...}>{children}</Context.Provider>;
}

export function useContextName() {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error('useContextName doit être utilisé à l\'intérieur d\'un ContextProvider');
  }
  return context;
}
```

### Imports

Ordre des imports :
1. Imports React
2. Imports Next.js
3. Imports de bibliothèques tierces
4. Imports locaux (`@/...`)
5. Imports de types

```tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@supabase/supabase-js';
```

## Patterns à Suivre

### Client vs Server Components

**Utiliser 'use client' pour** :
- Composants avec hooks (useState, useEffect, etc.)
- Composants avec event handlers
- Composants utilisant des contextes
- Composants avec animations/interactions

**Garder en Server Component** :
- Layouts avec metadata uniquement
- Composants purement statiques sans interactivité

### Gestion d'État

**localStorage** :
- Préférences UI (sidebar, thèmes)
- Toujours vérifier l'existence avant lecture
- Pattern : `localStorage.getItem('key') ?? defaultValue`

**Contexts** :
- État global partagé (auth, thèmes)
- Toujours fournir un hook custom (`useContextName`)
- Toujours vérifier que le contexte existe dans le hook

**State local** :
- État spécifique au composant
- Formulaires (ou utiliser React Hook Form pour complexité)

### Error Handling

```tsx
// Services - retourner { data, error }
async function serviceMethod() {
  try {
    const { data, error } = await supabaseCall();
    if (error) return { data: null, error };
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

// Composants - gérer avec toast
const handleAction = async () => {
  const { error } = await service.method();
  if (error) {
    toast.error('Message d\'erreur');
    return;
  }
  toast.success('Succès !');
};
```

### Styling

- **Toujours utiliser Tailwind CSS** pour le styling
- Utiliser les classes `cn()` de `lib/utils` pour les conditional classes
- Respecter le système de design de shadcn/ui
- Classes de couleur via variables CSS : `bg-primary`, `text-accent`, etc.

```tsx
import { cn } from '@/lib/utils';

<div className={cn(
  "base-classes",
  condition && "conditional-classes",
  className // Prop optionnelle
)} />
```

### Notifications

- Utiliser `toast` depuis `sonner` pour tout retour utilisateur (succès/erreur) ; le `<Toaster />` est monté dans `app/layout.tsx`, donc aucun ajout local n'est nécessaire.
- Les messages sont en français, avec une phrase courte en `title` et un complément facultatif dans `description`.
- Les formulaires d'upload et les actions admin doivent afficher un toast de succès ET d'échec, en veillant à nettoyer les uploads ratés avant de signaler l'erreur.

### Layout Principal & Navigation

- `app/layout.tsx` est un Server Component qui installe `ThemeProvider`, `ColorThemeProvider`, `AuthProvider`, puis rend `<AppLayout>{children}</AppLayout>` et `<Toaster />`.
- `components/AppLayout` est client-only : il synchronise la largeur de la sidebar (`256px` ou `64px`) avec `localStorage.sidebarExpanded` et applique la valeur dans `style={{ marginLeft }}`. Toute modification du layout doit préserver cette logique pour éviter les décalages.
- `components/Sidebar` pilote la navigation. Actualisez le tableau `mainNavItems` lorsque vous créez une nouvelle page publique, et réutilisez le callback `onToggle` pour notifier `AppLayout`.
- Le `<Topbar />` contient la recherche (actuellement désactivée) et le `ThemeToggle`. Garder cette structure pour conserver l'alignement et la sticky bar (`sticky top-0`).

### LocalStorage & événements globaux

- Clés utilisées :
  - `theme` (`ThemeContext`)
  - `colorTheme` + `customColors` (`ColorThemeContext`)
  - `sidebarExpanded` (layout)
- `AppLayout` et `Sidebar` écoutent à la fois `storage` et un événement personnalisé `sidebar-toggle`. Si vous ajoutez un composant qui dépend de l'état de la sidebar, souscrivez au même event au lieu d'introduire un nouveau canal.
- Les contextes montent uniquement quand `window` est disponible ; ne lisez pas `localStorage` côté serveur.

### Authentification & Admin

- `AuthContext` expose `useAuth` (ré-exporté depuis `hooks/useAuth.ts`), ainsi que `signIn`, `signOut`, `user`, `session`, `loading`.
- `components/ProtectedRoute` redirige vers `/login` si l'utilisateur n'est pas connecté. Toutes les pages sous `/admin/*` doivent être encapsulées dans ce composant ou vérifier manuellement l'authentification.
- La page `app/login/page.tsx` utilise `useAuth().signIn` puis redirige vers `/admin/photos` en cas de succès. Réutilisez ce pattern pour toute future page d'auth.
- La sidebar affiche automatiquement `Admin Photos` et `Déconnexion` lorsqu'un `user` est présent. Ajoutez les entrées admin supplémentaires (`Admin Music`, `Admin Textes`, etc.) dans la zone `user && (...)` de `Sidebar.tsx` pour qu'elles n'apparaissent qu'aux utilisateurs connectés.

## Workflows Spécifiques

### Ajout d'un Nouveau Composant UI

1. Utiliser shadcn/ui CLI si disponible : `npx shadcx-ui@latest add [component]`
2. Sinon, créer dans `components/ui/` en suivant le pattern shadcn
3. Toujours exporter avec des noms explicites
4. Documenter les variants dans le composant

### Ajout d'une Nouvelle Page

1. Créer dossier dans `app/[route]/`
2. Créer `page.tsx` avec export default
3. Ajouter l'entrée dans la Sidebar si navigation nécessaire
4. Tester le responsive design
5. Vérifier le fonctionnement en mode clair/sombre

### Ajout d'un Service

1. Créer fichier dans `services/` avec suffix `Service.ts`
2. Export en tant qu'objet avec méthodes async
3. Pattern : toujours retourner `{ data, error }`
4. Importer le client Supabase si nécessaire
5. Créer le hook context si état global requis

### Modification des Thèmes

**Thème clair/sombre** :
- Modifier `contexts/ThemeContext.tsx`
- Utiliser les classes Tailwind `dark:` pour les styles conditionnels

**Couleurs** :
- Modifier `contexts/ColorThemeContext.tsx` pour les presets
- Variables CSS : `--theme-primary`, `--theme-secondary`, `--theme-accent`
- Format HSL : `"200 90% 50%"` (sans `hsl()`)

### Services Supabase existants

- `lib/supabaseClient.ts` crée le client en se basant sur `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY` et exporte les types `Photo`, `MusicTrack`, `Text`, `TextWithMetadata`, `Category`, `Tag`, `TextTag` et `Database`. Réutilisez ces types plutôt que de recréer des interfaces.
- `authService` est un simple wrapper autour de `supabaseClient.auth` (`getSession`, `signInWithPassword`, `signOut`, `onAuthStateChange`). Respectez le pattern `{ data?, error }` pour faciliter son usage dans `AuthContext`.
- `photoService` cible la table `photos` : `getAllPhotos`, `getPhotoById`, `getMaxDisplayOrder`, `createPhoto`, `updatePhoto`, `deletePhoto`, `updateDisplayOrder`. L'ordre d'affichage est numérique croissant (0,1,2,...).
- `musicService` cible `music_tracks` avec les mêmes helpers qu'au-dessus. La méthode `createTrack` ajoute automatiquement `user_id` (utilisateur courant) et journalise les étapes — conservez ces logs pour faciliter le debug des uploads audio.
- `textService` cible la table `texts` avec CRUD complet, gestion de l'ordre d'affichage, et méthodes spécialisées : `getTextsWithMetadata`, `getTextWithMetadata`, `getPublishedTexts`, `getTextsByCategory`, `getTextsByTag`, `searchTexts`, `createTextWithTags`, `updateTextWithTags`. La méthode `createText` ajoute automatiquement `user_id` et journalise les étapes.
- `categoryService` gère la table `categories` : CRUD complet avec `getAllCategories`, `getCategoryById`, `getCategoryBySlug`, `createCategory`, `updateCategory`, `deleteCategory`, `getMaxDisplayOrder`. Utilisé pour organiser les textes.
- `tagService` gère la table `tags` et les relations `text_tags` : CRUD des tags (`getAllTags`, `getTagById`, `getTagBySlug`, `createTag`, `updateTag`, `deleteTag`) et méthodes de liaison (`getTagsForText`, `addTagToText`, `removeTagFromText`, `setTagsForText`).
- `storageService` encapsule Supabase Storage avec deux buckets dédiés : `photo-files` (images) et `audio-files` (sons). Il fournit `uploadPhoto`, `uploadAudio`, `getPublicUrl`, `getAudioPublicUrl`, `deletePhoto`, `deleteAudio` ainsi que `extractFileNameFromUrl` pour simplifier les suppressions.

### Routes et navigation actuelles

- Pages publiques : `/`, `/musique`, `/photos`, `/videos`, `/textes`, `/applications`, `/a-propos`, `/contact`, `/parametres`.
- Auth & admin : `/login`, `/admin/photos`, `/admin/music`, `/admin/texts`. Les routes admin sont wrapées dans `ProtectedRoute` et doivent rester client-side.
- Seule `/admin/photos` est listée dans la sidebar par défaut. Si vous exposez `/admin/music` ou `/admin/texts` ou une nouvelle section, ajoutez-la dans la zone `user && (...)` de `Sidebar.tsx` pour qu'elle n'apparaisse qu'aux utilisateurs connectés.

### Gestion de la galerie Photos

- **Upload** : `PhotoUploadForm` offre drag & drop + prévisualisation (`FileReader`). Les validations acceptent `jpeg/png/webp/gif` ≤ 5 MB. Sur submit :
  1. `photoService.getMaxDisplayOrder()` pour calculer `display_order`.
  2. Générer un nom de fichier unique (`${Date.now()}-${random}`) puis `storageService.uploadPhoto` sur le bucket `photo-files`.
  3. Récupérer l'URL publique avec `storageService.getPublicUrl`.
  4. Insérer la ligne via `photoService.createPhoto`. En cas d'échec, supprimer immédiatement le fichier via `storageService.deletePhoto`.
- **Administration** : `PhotoList` gère la suppression (storage + table) et le drag-and-drop natif pour réordonner. L'ordre est recalculé côté client puis chaque ligne est mise à jour avec `photoService.updateDisplayOrder`. Préservez ce comportement pour éviter les trous dans la numérotation.
- **Front** : `PhotoGrid` + `PhotoCard` gèrent l'affichage responsive. `PhotoViewerModal` (dialog shadcn) ajoute navigation clavier (`←/→`), zoom +/- , téléchargement (via fetch + blob) et partage (`navigator.share` ou clipboard) avec des toasts adaptés. Toute nouvelle fonctionnalité doit rester compatible avec ces entrées clavier et garder `open` contrôlé par le parent.

### Gestion de la bibliothèque Musique

- **Upload** : `MusicUploadForm` accepte `mp3/mp4/wav/ogg` ≤ 10 MB et une cover `jpeg/png/webp` ≤ 2 MB. Le flux :
  1. `musicService.getMaxDisplayOrder()` pour calculer l'ordre.
  2. Upload audio (`storageService.uploadAudio` sur `audio-files`) puis récupérer l'URL via `getAudioPublicUrl`.
  3. Upload éventuel de la cover via `storageService.uploadPhoto` (bucket images) avec nettoyage si l'étape suivante échoue.
  4. Calculer la durée via un `<audio>` caché.
  5. Appeler `musicService.createTrack` avec le user authentifié (obtenu côté service via `supabaseClient.auth.getUser`). Sur erreur DB, supprimer les fichiers déjà envoyés.
- **Administration** : `TrackListAdmin` reprend le drag-and-drop natif pour réordonner et `AlertDialog` pour confirmer les suppressions. Les fichiers audio et cover sont supprimés via `storageService.extractFileNameFromUrl` avant d'appeler `musicService.deleteTrack`.
- **Lecteur public** : `AudioPlayer` orchestre lecture/pause, skip, volume, mute et s'appuie sur `AudioVisualization` pour afficher une visualisation canvas (types : `bars`, `wave`, `circle`, `dots`, `line`). `AudioVisualization` crée un `AudioContext`, donc conservez `'use client'` et vérifiez toujours que `audioElement` est défini avant d'appeler Web Audio API.
- **Page `/musique`** : affichage via des `Tabs` shadcn (lecteur vs embeds SoundCloud). Si vous ajoutez une nouvelle source, pensez à garder les tabs pour séparer les contenus et évitez de charger le lecteur si `tracks.length === 0`.

### Gestion de la bibliothèque Textes

- **Upload** : `TextUploadForm` permet de créer un texte avec titre, sous-titre, contenu Markdown, extrait, auteur, date de publication, catégorie, tags et statut de publication. Le flux :
  1. `textService.getMaxDisplayOrder()` pour calculer l'ordre.
  2. Appeler `textService.createTextWithTags` avec les données du texte et les IDs des tags sélectionnés. Le service ajoute automatiquement `user_id` et gère les relations `text_tags`.
  3. En cas d'erreur, afficher un toast d'erreur avec nettoyage si nécessaire.
- **Administration** : `TextListAdmin` gère la liste complète des textes avec drag-and-drop pour réordonner, édition via `TextEditModal`, suppression avec confirmation, et filtrage par statut de publication. Les catégories et tags sont gérés via `CategoryManager` et `TagManager`.
- **Affichage public** : `TextCard` affiche un aperçu du texte avec catégorie et tags. `TextDetailModal` utilise `MarkdownRenderer` (basé sur `react-markdown` + `remark-gfm`) pour afficher le contenu complet en Markdown. La page `/textes` affiche uniquement les textes publiés (`is_published: true`).
- **Catégories et Tags** : `CategoryManager` et `TagManager` permettent de créer, modifier et supprimer les catégories et tags. Les catégories ont un ordre d'affichage (`display_order`) et une couleur. Les tags ont une couleur et un slug. Utilisez `categoryService` et `tagService` pour toutes les opérations CRUD.
- **Recherche et filtrage** : `textService.searchTexts` permet la recherche full-text sur les titres (configurée pour le français). `getTextsByCategory` et `getTextsByTag` permettent de filtrer par catégorie ou tag. Ces méthodes retournent des `TextWithMetadata` avec les relations chargées.

## Commandes Utiles pour les Agents

```bash
# Vérifier les types avant commit
npm run typecheck

# Vérifier le linting
npm run lint

# Build pour vérifier l'export statique
npm run build

# Développement
npm run dev
```

## Points d'Attention

### Variables d'Environnement

- **Fichier** : `.env.local` (non commité, dans .gitignore)
- **Exemple** : `.env.example` (commité pour documenter les variables nécessaires)
- **Format** : Toutes les variables client-side doivent commencer par `NEXT_PUBLIC_`
- **Redémarrage requis** : Redémarrez `npm run dev` après modification
- **Documentation** : Voir `SETUP_SUPABASE.md` pour la configuration Supabase

Variables requises :
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Export Statique

- Pas de `getServerSideProps` ou `getStaticProps` (App Router)
- Images doivent avoir `unoptimized: true`
- Pas d'API routes dans `app/api/` (ne fonctionnera pas)
- Variables d'environnement : Préfixer avec `NEXT_PUBLIC_` pour client-side

### Supabase

- Toujours utiliser les services, jamais appeler directement le client dans les composants
- Les appels Supabase sont async - gérer le loading state
- Vérifier les erreurs avec `if (error)` systématiquement

### Performance

- Éviter les re-renders inutiles avec `useMemo`, `useCallback`
- Lazy load les composants lourds si nécessaire
- Optimiser les images (format WebP recommandé)

### Accessibilité

- shadcn/ui gère l'accessibilité de base
- Toujours ajouter des labels aux inputs
- Tester la navigation au clavier
- Vérifier le contraste des couleurs personnalisées

## Languages

- **Interface** : Français
- **Code** : Anglais (noms de variables, fonctions, commentaires techniques)
- **Messages utilisateur** : Français
- **Documentation** : Français
