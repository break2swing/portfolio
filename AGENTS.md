# AGENTS.md - Conventions de développement

Ce fichier contient les conventions, patterns et templates spécifiques au projet pour guider le développement.

## Conventions générales

### Langue

- **Code** : Anglais pour les noms de variables, fonctions, types
- **Commentaires et documentation** : Français
- **Messages utilisateur** : Français
- **Logs** : Français pour les messages, anglais pour les clés

### Nommage

**Fichiers** :
- Composants React : `PascalCase.tsx` (ex: `TagManager.tsx`)
- Services : `camelCase.ts` (ex: `photoService.ts`)
- Utilitaires : `camelCase.ts` (ex: `validators.ts`)
- Contextes : `PascalCaseContext.tsx` (ex: `ThemeContext.tsx`)

**Variables et fonctions** :
- Variables : `camelCase` (ex: `isLoading`, `photoList`)
- Fonctions : `camelCase` (ex: `handleSubmit`, `loadPhotos`)
- Constantes : `UPPER_SNAKE_CASE` (ex: `DEFAULT_TTL`, `PRESET_COLORS`)
- Types/Interfaces : `PascalCase` (ex: `PhotoService`, `CacheOptions`)

**Composants React** :
- Composants : `PascalCase` (ex: `OptimizedImage`, `TagBadge`)
- Props interfaces : `ComponentNameProps` (ex: `OptimizedImageProps`)
- Hooks personnalisés : `useCamelCase` (ex: `useTheme`, `useAuth`)

## Structure des fichiers

### Template de composant React (client)

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { serviceLogger } from '@/lib/logger';

const logger = serviceLogger.child('component-name');

interface ComponentNameProps {
  title: string;
  onAction?: () => void;
  className?: string;
}

/**
 * Description du composant en français
 *
 * @param title - Description du paramètre
 * @param onAction - Callback optionnel
 * @param className - Classes CSS additionnelles
 */
export function ComponentName({
  title,
  onAction,
  className
}: ComponentNameProps) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Effet avec cleanup si nécessaire
    logger.debug('Component mounted');

    return () => {
      logger.debug('Component unmounted');
    };
  }, []);

  const handleClick = async () => {
    setLoading(true);

    try {
      logger.info('Action triggered');
      await onAction?.();
    } catch (error) {
      logger.error('Action failed', error as Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <h2>{title}</h2>
      <Button onClick={handleClick} disabled={loading}>
        {loading ? 'Chargement...' : 'Action'}
      </Button>
    </div>
  );
}
```

### Template de service

```typescript
import { supabaseClient } from '@/lib/supabaseClient';
import { cache } from '@/lib/cache';
import { serviceLogger } from '@/lib/logger';
import type { Photo } from '@/lib/supabaseClient';

const logger = serviceLogger.child('photo-service');

export const photoService = {
  /**
   * Récupère toutes les photos
   * @returns Liste des photos avec gestion d'erreur
   */
  async getAllPhotos() {
    const cacheKey = 'photos:all';

    // Vérifier le cache
    const cached = cache.get<Photo[]>(cacheKey);
    if (cached) {
      logger.debug('Photos loaded from cache');
      return { photos: cached, error: null };
    }

    try {
      logger.info('Fetching photos from database');

      const { data, error } = await supabaseClient
        .from('photos')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        logger.error('Failed to fetch photos', error);
        return { photos: null, error };
      }

      // Mettre en cache
      cache.set(cacheKey, data, { ttl: 5 * 60 * 1000 });
      logger.debug('Photos cached', { count: data.length });

      return { photos: data, error: null };
    } catch (error) {
      logger.error('Unexpected error fetching photos', error as Error);
      return { photos: null, error: error as Error };
    }
  },

  /**
   * Crée une nouvelle photo
   * @param photoData - Données de la photo
   */
  async createPhoto(photoData: Omit<Photo, 'id' | 'created_at'>) {
    try {
      logger.info('Creating photo', { title: photoData.title });

      const { data, error } = await supabaseClient
        .from('photos')
        .insert(photoData)
        .select()
        .single();

      if (error) {
        logger.error('Failed to create photo', error);
        return { photo: null, error };
      }

      // Invalider le cache
      cache.invalidatePattern('photos:');
      logger.debug('Cache invalidated');

      return { photo: data, error: null };
    } catch (error) {
      logger.error('Unexpected error creating photo', error as Error);
      return { photo: null, error: error as Error };
    }
  },

  /**
   * Met à jour une photo
   * @param id - ID de la photo
   * @param updates - Champs à mettre à jour
   */
  async updatePhoto(id: string, updates: Partial<Photo>) {
    try {
      logger.info('Updating photo', { id });

      const { data, error } = await supabaseClient
        .from('photos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update photo', error, { id });
        return { photo: null, error };
      }

      // Invalider le cache
      cache.invalidatePattern('photos:');

      return { photo: data, error: null };
    } catch (error) {
      logger.error('Unexpected error updating photo', error as Error, { id });
      return { photo: null, error: error as Error };
    }
  },

  /**
   * Supprime une photo
   * @param id - ID de la photo
   */
  async deletePhoto(id: string) {
    try {
      logger.info('Deleting photo', { id });

      const { error } = await supabaseClient
        .from('photos')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error('Failed to delete photo', error, { id });
        return { error };
      }

      // Invalider le cache
      cache.invalidatePattern('photos:');

      return { error: null };
    } catch (error) {
      logger.error('Unexpected error deleting photo', error as Error, { id });
      return { error: error as Error };
    }
  },
};
```

### Template de contexte React

```typescript
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { serviceLogger } from '@/lib/logger';

const logger = serviceLogger.child('my-context');

interface MyContextValue {
  data: string | null;
  loading: boolean;
  loadData: () => Promise<void>;
}

const MyContext = createContext<MyContextValue | undefined>(undefined);

interface MyProviderProps {
  children: ReactNode;
}

export function MyProvider({ children }: MyProviderProps) {
  const [data, setData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    logger.debug('Provider mounted');
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    try {
      logger.info('Loading data');
      // Logique de chargement...
      setData('loaded data');
    } catch (error) {
      logger.error('Failed to load data', error as Error);
    } finally {
      setLoading(false);
    }
  };

  const value: MyContextValue = {
    data,
    loading,
    loadData,
  };

  return <MyContext.Provider value={value}>{children}</MyContext.Provider>;
}

export function useMyContext() {
  const context = useContext(MyContext);

  if (context === undefined) {
    throw new Error('useMyContext doit être utilisé à l\'intérieur d\'un MyProvider');
  }

  return context;
}
```

### Template de schéma Zod

```typescript
import { z } from 'zod';

/**
 * Schéma de validation pour les photos
 */
export const photoSchema = z.object({
  title: z
    .string()
    .min(1, 'Le titre est requis')
    .max(200, 'Le titre ne peut pas dépasser 200 caractères')
    .trim(),

  description: z
    .string()
    .max(1000, 'La description ne peut pas dépasser 1000 caractères')
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),

  image_url: z
    .string()
    .url('URL invalide')
    .min(1, 'L\'URL de l\'image est requise'),

  display_order: z
    .number()
    .int('L\'ordre doit être un entier')
    .nonnegative('L\'ordre doit être positif')
    .default(0),
});

/**
 * Schéma pour la création (sans champs auto-générés)
 */
export const createPhotoSchema = photoSchema.omit({
  display_order: true
});

/**
 * Schéma pour la mise à jour (tous les champs optionnels)
 */
export const updatePhotoSchema = photoSchema.partial();

/**
 * Types TypeScript inférés des schémas
 */
export type PhotoFormData = z.infer<typeof photoSchema>;
export type CreatePhotoFormData = z.infer<typeof createPhotoSchema>;
export type UpdatePhotoFormData = z.infer<typeof updatePhotoSchema>;
```

## Patterns de développement

### Gestion d'état et effets

**useState** :
```typescript
// Toujours initialiser avec le bon type
const [items, setItems] = useState<Item[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<Error | null>(null);
```

**useEffect** :
```typescript
// Toujours avec cleanup si nécessaire
useEffect(() => {
  let isMounted = true;

  const fetchData = async () => {
    const data = await api.getData();
    if (isMounted) {
      setData(data);
    }
  };

  fetchData();

  return () => {
    isMounted = false;
  };
}, [dependencies]);
```

### Gestion des erreurs

**Dans les services** :
```typescript
try {
  const result = await operation();
  return { data: result, error: null };
} catch (error) {
  logger.error('Operation failed', error as Error, { context });
  return { data: null, error: error as Error };
}
```

**Dans les composants** :
```typescript
const handleAction = async () => {
  setLoading(true);
  setError(null);

  try {
    const { data, error } = await service.operation();

    if (error) {
      setError(error);
      toast.error('Erreur', { description: error.message });
      return;
    }

    toast.success('Succès', { description: 'Opération réussie' });
    setData(data);
  } catch (error) {
    logger.error('Unexpected error', error as Error);
    toast.error('Erreur', { description: 'Une erreur inattendue s\'est produite' });
  } finally {
    setLoading(false);
  }
};
```

### Cache et invalidation

```typescript
// Clés de cache structurées avec namespaces
const cacheKey = `${resource}:${operation}:${id}`;

// Exemple : 'photos:all', 'photos:single:123', 'texts:search:term'

// Invalidation par pattern
cache.invalidatePattern('photos:'); // Invalide toutes les photos
cache.invalidatePattern('texts:search:'); // Invalide toutes les recherches
```

### Logging structuré

```typescript
// Créer un logger enfant pour chaque module
const logger = serviceLogger.child('module-name');

// Niveaux de log appropriés
logger.debug('Detailed info for debugging', { context });
logger.info('Important operation', { result });
logger.warn('Something unusual', { warning });
logger.error('Operation failed', error, { context });

// Sanitization automatique des données sensibles
logger.info('User login', { email: 'user@example.com', password: 'secret' });
// Affichera : { email: 'user@example.com', password: '[REDACTED]' }
```

### Analytics et Web Vitals

```typescript
// Événements personnalisés
import { trackEvent } from '@/lib/analytics';

trackEvent('photo_uploaded', {
  size: file.size,
  type: file.type,
});

// Les Core Web Vitals sont automatiquement collectés via WebVitals component
```

### Optimisation des images

```typescript
// Utiliser OptimizedImage pour toutes les images
import { OptimizedImage } from '@/components/OptimizedImage';
import { generateBlurPlaceholder, generateSrcSet, generateSizes } from '@/lib/image';

// Avec LQIP
const blurDataURL = await generateBlurPlaceholder(imageUrl);

<OptimizedImage
  src={imageUrl}
  alt="Description"
  width={800}
  height={600}
  sizes={generateSizes('half')}
  blurDataURL={blurDataURL}
  priority={false}
/>

// Les srcset peuvent être générés côté serveur ou fournis manuellement
```

## Workflows spécifiques

### Ajouter une nouvelle page

1. Créer le fichier `app/nouvelle-route/page.tsx`
2. Utiliser `'use client'` si interactivité nécessaire
3. Ajouter la route dans CLAUDE.md section "Structure des Routes"
4. Utiliser `ProtectedRoute` si authentification requise
5. Tester la navigation depuis Sidebar

```typescript
// app/nouvelle-route/page.tsx
'use client';

export default function NouvellePage() {
  return (
    <div>
      <h1>Nouvelle page</h1>
    </div>
  );
}
```

### Ajouter un nouveau service

1. Créer `services/newService.ts`
2. Suivre le template de service ci-dessus
3. Créer un logger enfant : `serviceLogger.child('new-service')`
4. Implémenter pattern `{ data, error }`
5. Utiliser le cache pour les opérations de lecture
6. Invalider le cache sur mutations
7. Ajouter le service dans CLAUDE.md section "Service Layer"

### Ajouter une nouvelle table Supabase

1. Créer la table dans Supabase
2. Ajouter le type dans `lib/supabaseClient.ts`
3. Ajouter le type au `Database` type
4. Créer le service associé
5. Créer les schémas Zod de validation dans `lib/validators.ts`
6. Mettre à jour CLAUDE.md section "Supabase Integration"

### Ajouter un système de tags à un type de contenu

1. Créer la table de liaison `{content}_tags` dans Supabase
2. Ajouter le type dans `lib/supabaseClient.ts`
3. Créer le service de tags : `services/{content}TagService.ts`
4. Implémenter les méthodes :
   - `getTagsForContent(contentId)` - Récupère les tags d'un contenu
   - `addTagToContent(contentId, tagId)` - Ajoute un tag
   - `removeTagFromContent(contentId, tagId)` - Retire un tag
   - `updateContentTags(contentId, tagIds)` - Met à jour tous les tags
5. Utiliser le cache avec pattern `{content}-tags:{id}`

## Accessibilité (a11y)

### Principes

- Toujours fournir `alt` pour les images
- Utiliser des balises sémantiques (`<main>`, `<nav>`, `<article>`, etc.)
- Assurer un contraste suffisant (WCAG AA minimum)
- Support complet du clavier
- Attributs ARIA appropriés

### Exemple de composant accessible

```typescript
<button
  onClick={handleClick}
  disabled={loading}
  aria-label="Supprimer la photo"
  aria-busy={loading}
  aria-disabled={loading}
>
  <Trash2 className="h-4 w-4" />
  <span className="sr-only">Supprimer</span>
</button>

<img
  src={imageUrl}
  alt="Description de l'image"
  aria-describedby="image-caption"
/>
<p id="image-caption">Légende de l'image</p>
```

## Sécurité

### Principes

- **Validation** : Toujours valider avec Zod côté client ET serveur
- **Sanitization** : Utiliser `isomorphic-dompurify` pour le contenu HTML
- **CORS** : Configuré au niveau de Supabase
- **XSS** : Éviter `dangerouslySetInnerHTML` sauf avec sanitization
- **CSRF** : Géré par Supabase Auth
- **Rate limiting** : Utiliser `lib/rateLimiter.ts` pour les actions sensibles

### Exemple de sanitization

```typescript
import DOMPurify from 'isomorphic-dompurify';

// Pour du contenu HTML
const cleanHTML = DOMPurify.sanitize(userInput);

// Pour du Markdown (déjà sanitizé par react-markdown)
<ReactMarkdown remarkPlugins={[remarkGfm]}>
  {content}
</ReactMarkdown>
```

## Performance

### Principes

- **Code splitting** : Utiliser dynamic imports pour les gros composants
- **Lazy loading** : Images avec `OptimizedImage`, composants avec `React.lazy`
- **Caching** : Utiliser `lib/cache.ts` pour les données
- **Préchargement** : `PrefetchData` pour les données critiques
- **Virtualisation** : `@tanstack/react-virtual` pour les longues listes
- **Bundle size** : Surveiller avec `npm run analyze`

### Exemple de dynamic import

```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), {
  loading: () => <Loader2 className="animate-spin" />,
  ssr: false,
});
```

### Exemple de virtualisation

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const rowVirtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50,
  overscan: 5,
});
```

## Tests

### Principes

- Tester la logique métier (services)
- Tester les composants critiques
- Tester les validations Zod
- Tests d'intégration pour les workflows complets

### Structure de test (si implémenté)

```typescript
import { describe, it, expect } from 'vitest';
import { photoService } from '@/services/photoService';

describe('photoService', () => {
  it('should fetch all photos', async () => {
    const { photos, error } = await photoService.getAllPhotos();

    expect(error).toBeNull();
    expect(photos).toBeInstanceOf(Array);
  });

  it('should handle errors gracefully', async () => {
    // Mock d'une erreur Supabase
    const { photos, error } = await photoService.getAllPhotos();

    expect(photos).toBeNull();
    expect(error).toBeTruthy();
  });
});
```

---

**Note finale** : Ce fichier doit être maintenu à jour lors de l'ajout de nouveaux patterns ou conventions. Les exemples doivent refléter l'état actuel du codebase.
