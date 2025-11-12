# Guide de Développement

<cite>
**Fichiers Référencés dans ce Document**
- [AGENTS.md](file://AGENTS.md)
- [AI_TOOLS.md](file://AI_TOOLS.md)
- [package.json](file://package.json)
- [scripts/generate-lqip-for-existing.ts](file://scripts/generate-lqip-for-existing.ts)
- [scripts/check-bundle-size.js](file://scripts/check-bundle-size.js)
- [README.md](file://README.md)
- [CLAUDE.md](file://CLAUDE.md)
- [tsconfig.json](file://tsconfig.json)
- [next.config.js](file://next.config.js)
- [components/OptimizedImage.tsx](file://components/OptimizedImage.tsx)
- [services/photoService.ts](file://services/photoService.ts)
- [contexts/ThemeContext.tsx](file://contexts/ThemeContext.tsx)
</cite>

## Table des Matières
1. [Introduction](#introduction)
2. [Conventions de Code](#conventions-de-code)
3. [Workflows de Développement](#workflows-de-développement)
4. [Scripts NPM](#scripts-npm)
5. [Scripts Utilitaires](#scripts-utilitaires)
6. [Architecture du Projet](#architecture-du-projet)
7. [Patterns de Développement](#patterns-de-développement)
8. [Débogage et Tests](#débogage-et-tests)
9. [Contribution au Projet](#contribution-au-projet)
10. [Bonnes Pratiques](#bonnes-pratiques)

## Introduction

Ce guide fournit une documentation complète pour les développeurs travaillant sur le projet Portfolio Next.js. Le projet utilise l'App Router de Next.js 13 avec export statique, un système de double thème (clair/sombre + couleurs personnalisables), et intègre Supabase pour l'authentification et la base de données.

### Technologies Principales
- **Framework** : Next.js 13 (App Router, Export Statique)
- **UI** : React 18 + Tailwind CSS
- **Composants** : shadcn/ui (Radix UI + Tailwind)
- **Backend** : Supabase (Auth, Database, Storage)
- **TypeScript** : Configuration stricte
- **Icônes** : Lucide React
- **Notifications** : Sonner

## Conventions de Code

### Langue et Nommage

Le projet suit des conventions strictes pour la langue et le nommage :

**Langue des Codes :**
- **Code** : Anglais pour les noms de variables, fonctions, types
- **Commentaires et documentation** : Français
- **Messages utilisateur** : Français
- **Logs** : Français pour les messages, anglais pour les clés

**Nommage des Fichiers :**
- Composants React : `PascalCase.tsx` (ex: `TagManager.tsx`)
- Services : `camelCase.ts` (ex: `photoService.ts`)
- Utilitaires : `camelCase.ts` (ex: `validators.ts`)
- Contextes : `PascalCaseContext.tsx` (ex: `ThemeContext.tsx`)

**Variables et Fonctions :**
- Variables : `camelCase` (ex: `isLoading`, `photoList`)
- Fonctions : `camelCase` (ex: `handleSubmit`, `loadPhotos`)
- Constantes : `UPPER_SNAKE_CASE` (ex: `DEFAULT_TTL`, `PRESET_COLORS`)
- Types/Interfaces : `PascalCase` (ex: `PhotoService`, `CacheOptions`)

**Composants React :**
- Composants : `PascalCase` (ex: `OptimizedImage`, `TagBadge`)
- Props interfaces : `ComponentNameProps` (ex: `OptimizedImageProps`)
- Hooks personnalisés : `useCamelCase` (ex: `useTheme`, `useAuth`)

### Structure des Fichiers

#### Template de Composant React (Client)
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

#### Template de Service
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

  // Autres méthodes...
};
```

**Sources de la section**
- [AGENTS.md](file://AGENTS.md#L1-L681)

## Workflows de Développement

### Utilisation des Agents IA

Le projet est configuré pour fonctionner avec plusieurs outils d'IA en ligne de commande :

#### Claude Code (Anthropic)
**Outil principal** utilisé pour le développement de ce projet.

**Commandes disponibles :**
- `/agents-update` - Met à jour CLAUDE.md et AGENTS.md

**Configuration :**
- Dossier : `.claude/commands/`
- Format : Markdown avec frontmatter YAML

#### Gemini CLI (Google)
Assistant IA de Google avec accès au code.

**Commandes disponibles :**
- `gemini run agents-update` - Met à jour la documentation

**Configuration :**
- Dossier : `.gemini/prompts/`
- Format : YAML

#### Codex CLI (Anthropic)
Alternative CLI pour Claude.

**Commandes disponibles :**
- `codex agents-update` - Met à jour la documentation

**Configuration :**
- Dossier : `.codex/commands/`
- Format : Markdown

### Commande `agents-update`

Cette commande est disponible pour **les 3 outils** et fait exactement la même chose :

**Ce qu'elle fait :**
1. ✅ Lit CLAUDE.md et AGENTS.md actuels
2. 🔍 Analyse le projet complet
3. 🔄 Identifie les changements non documentés
4. 📝 Met à jour les deux fichiers
5. 📊 Fournit un résumé des modifications

**Quand l'utiliser :**
- ✅ Après avoir ajouté un nouveau contexte
- ✅ Après avoir créé un nouveau service
- ✅ Après avoir ajouté une nouvelle route/page
- ✅ Après des changements majeurs dans l'architecture
- ✅ Régulièrement pour garder la doc à jour

**Sources de la section**
- [AI_TOOLS.md](file://AI_TOOLS.md#L1-L196)

## Scripts NPM

Le projet définit plusieurs scripts npm pour différents aspects du développement :

### Scripts de Développement

| Script | Description | Commande |
|--------|-------------|----------|
| `dev` | Serveur de développement (port 3000) | `npm run dev` |
| `build` | Build de production (export statique) | `npm run build` |
| `start` | Serveur de production | `npm start` |

### Scripts de Qualité de Code

| Script | Description | Commande |
|--------|-------------|----------|
| `lint` | Vérifier le code (ESLint) | `npm run lint` |
| `typecheck` | Vérifier les types TypeScript | `npm run typecheck` |
| `analyze` | Analyse du bundle avec visualisation | `npm run analyze` |
| `check-bundle` | Vérification des budgets de bundle | `npm run check-bundle` |

### Scripts de Maintenance

| Script | Description | Commande |
|--------|-------------|----------|
| `generate-lqip` | Instructions pour générer des LQIP | `npm run generate-lqip` |
| `audit` | Audit de sécurité des dépendances | `npm run audit` |
| `audit:fix` | Correction automatique des vulnérabilités | `npm run audit:fix` |

### Configuration TypeScript

Le projet utilise une configuration TypeScript stricte avec les options suivantes :

```json
{
  "compilerOptions": {
    "strict": true,
    "noEmit": true,
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

**Sources de la section**
- [package.json](file://package.json#L1-L91)
- [tsconfig.json](file://tsconfig.json#L1-L42)

## Scripts Utilitaires

### Génération de LQIP pour Images Existantes

Le script `generate-lqip-for-existing.ts` permet de migrer les images existantes pour ajouter des placeholders de faible qualité (LQIP).

**Utilisation :**
1. Visitez `/admin/migrate-lqip` dans votre navigateur
2. Le script s'exécutera automatiquement
3. Il traite les images par lots pour éviter la surcharge

**Caractéristiques :**
- Traite les photos sans `blur_data_url`
- Génère des LQIP avec Canvas API
- Met à jour la base de données avec les placeholders
- Gestion des erreurs et logs détaillés

### Vérification des Tailles de Bundle

Le script `check-bundle-size.js` analyse les tailles des bundles pour détecter les violations de budget.

**Budgets définis :**
- **Assets** : Maximum 250KB par fichier
- **Entrypoints** : Maximum 400KB combinés

**Analyse effectuée :**
- Fichiers JavaScript et CSS
- Entrypoints principaux (chunks)
- Génération de rapports détaillés

**Sources de la section**
- [scripts/generate-lqip-for-existing.ts](file://scripts/generate-lqip-for-existing.ts#L1-L104)
- [scripts/check-bundle-size.js](file://scripts/check-bundle-size.js#L1-L160)

## Architecture du Projet

### Structure des Routes

Le projet utilise l'App Router avec la structure suivante :

**Pages Publiques :**
- `/` - Page d'accueil
- `/a-propos` - Page à propos
- `/applications` - Portfolio d'applications
- `/musique` - Créations musicales
- `/photos` - Galerie photos
- `/videos` - Galerie vidéos
- `/textes` - Créations textuelles
- `/contact` - Page de contact
- `/parametres` - Paramètres d'apparence

**Pages d'Authentification :**
- `/login` - Page de connexion/authentification

**Pages d'Administration :**
- `/admin/photos` - Administration de la galerie photos
- `/admin/music` - Administration de la bibliothèque musicale
- `/admin/videos` - Administration de la galerie vidéos
- `/admin/texts` - Administration des textes
- `/admin/migrate-lqip` - Utilitaire de migration LQIP

### Système de Thèmes

**Double système de thèmes géré par deux contextes :**

1. **ThemeContext** (`contexts/ThemeContext.tsx`)
   - Gère le mode clair/sombre/système
   - Applique la classe `dark` sur `<html>`
   - Synchronisé avec les préférences système
   - État persisté dans localStorage

2. **ColorThemeContext** (`contexts/ColorThemeContext.tsx`)
   - 4 thèmes prédéfinis : ocean, forest, sun, rose
   - Mode custom avec couleurs personnalisables
   - Applique les CSS custom properties
   - État persisté dans localStorage

3. **AuthContext** (`contexts/AuthContext.tsx`)
   - Gère l'authentification via Supabase
   - Expose `user`, `session`, `loading`
   - Écoute les changements d'état d'authentification

### Couche Service

**Services principaux :**
- `authService.ts` - Wrapper autour de Supabase Auth
- `photoService.ts` - Gestion des photos (CRUD + ordre d'affichage)
- `musicService.ts` - Gestion des morceaux de musique
- `videoService.ts` - Gestion des vidéos
- `textService.ts` - Gestion des textes
- `categoryService.ts` - Gestion des catégories
- `storageService.ts` - Gestion du stockage Supabase

**Services de tags spécialisés :**
- `tagService.ts` - Gestion globale des tags
- `photoTagService.ts` - Relations entre photos et tags
- `musicTagService.ts` - Relations entre morceaux et tags
- `videoTagService.ts` - Relations entre vidéos et tags

**Sources de la section**
- [CLAUDE.md](file://CLAUDE.md#L65-L293)
- [contexts/ThemeContext.tsx](file://contexts/ThemeContext.tsx#L1-L96)
- [services/photoService.ts](file://services/photoService.ts#L1-L221)

## Patterns de Développement

### Gestion d'État et Effets

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

### Gestion des Erreurs

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

### Cache et Invalidation

```typescript
// Clés de cache structurées avec namespaces
const cacheKey = `${resource}:${operation}:${id}`;

// Exemple : 'photos:all', 'photos:single:123', 'texts:search:term'

// Invalidation par pattern
cache.invalidatePattern('photos:'); // Invalide toutes les photos
cache.invalidatePattern('texts:search:'); // Invalide toutes les recherches
```

### Logging Structuré

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

### Optimisation des Images

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
```

**Sources de la section**
- [AGENTS.md](file://AGENTS.md#L362-L681)
- [components/OptimizedImage.tsx](file://components/OptimizedImage.tsx#L1-L159)

## Débogage et Tests

### Configuration de Débogage

**Variables d'environnement importantes :**
- `NODE_ENV=development` pour le mode développement
- `ANALYZE=true` pour activer l'analyse de bundle
- Variables Supabase configurées dans `.env.local`

**Outils de débogage recommandés :**
- Console du navigateur pour les erreurs client
- DevTools React pour inspecter les composants
- Network tab pour surveiller les requêtes API
- Application tab pour inspecter le localStorage

### Tests et Validation

**Tests de qualité de code :**
```bash
# Vérification du code
npm run lint

# Vérification des types TypeScript
npm run typecheck

# Analyse des performances
npm run analyze
npm run check-bundle
```

**Tests d'intégration :**
- Tests de l'authentification avec Supabase
- Tests des services CRUD
- Tests de performance des images
- Tests d'accessibilité (a11y)

### Débogage des Performances

**Monitoring des Core Web Vitals :**
- CLS (Cumulative Layout Shift)
- FCP (First Contentful Paint)
- INP (Interaction to Next Paint)
- LCP (Largest Contentful Paint)
- TTFB (Time to First Byte)

**Outils de performance :**
- `components/WebVitals.tsx` - Collecte automatique
- `lib/analytics.ts` - RUM (Real User Monitoring)
- Bundle analyzer pour identifier les gros paquets

**Sources de la section**
- [README.md](file://README.md#L81-L91)
- [CLAUDE.md](file://CLAUDE.md#L237-L241)

## Contribution au Projet

### Processus de Contribution

1. **Lecture de la documentation**
   - Consulter [CLAUDE.md](file://CLAUDE.md) pour l'architecture
   - Suivre [AGENTS.md](file://AGENTS.md) pour les conventions
   - Lire [README.md](file://README.md) pour le démarrage

2. **Exécution des vérifications**
   ```bash
   # Vérifier la qualité du code
   npm run typecheck
   npm run lint
   
   # Tester les fonctionnalités
   npm run dev
   ```

3. **Utilisation des outils IA**
   - Exécuter `/agents-update` après des changements majeurs
   - Maintenir CLAUDE.md et AGENTS.md à jour

### Bonnes Pratiques de Contribution

**Code Quality :**
- Respecter les conventions de nommage
- Ajouter des commentaires français pour la documentation
- Utiliser des types TypeScript stricts
- Implémenter la gestion d'erreurs appropriée

**Performance :**
- Utiliser `OptimizedImage` pour toutes les images
- Implémenter le lazy loading quand approprié
- Optimiser les bundles avec des imports dynamiques
- Surveiller les tailles de bundle

**Accessibilité :**
- Fournir des attributs `alt` pour les images
- Utiliser des balises sémantiques
- Assurer un contraste suffisant (WCAG AA)
- Support complet du clavier

**Sécurité :**
- Valider les entrées avec Zod côté client ET serveur
- Utiliser `isomorphic-dompurify` pour le contenu HTML
- Éviter `dangerouslySetInnerHTML` sauf avec sanitization
- Implémenter le rate limiting pour les actions sensibles

### Workflow de Développement

1. **Créer une nouvelle page**
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

2. **Ajouter un nouveau service**
   - Créer `services/newService.ts`
   - Suivre le template de service
   - Implémenter pattern `{ data, error }`
   - Utiliser le cache pour les opérations de lecture

3. **Ajouter une nouvelle table Supabase**
   - Créer la table dans Supabase
   - Ajouter le type dans `lib/supabaseClient.ts`
   - Créer le service associé
   - Mettre à jour la documentation

**Sources de la section**
- [README.md](file://README.md#L151-L172)
- [AGENTS.md](file://AGENTS.md#L499-L681)

## Bonnes Pratiques

### Performance

**Optimisations recommandées :**
- **Code splitting** : Utiliser dynamic imports pour les gros composants
- **Lazy loading** : Images avec `OptimizedImage`, composants avec `React.lazy`
- **Caching** : Utiliser `lib/cache.ts` pour les données
- **Préchargement** : `PrefetchData` pour les données critiques
- **Virtualisation** : `@tanstack/react-virtual` pour les longues listes

### Accessibilité (a11y)

**Principes fondamentaux :**
- Toujours fournir `alt` pour les images
- Utiliser des balises sémantiques (`<main>`, `<nav>`, `<article>`, etc.)
- Assurer un contraste suffisant (WCAG AA minimum)
- Support complet du clavier
- Attributs ARIA appropriés

### Sécurité

**Mesures de sécurité :**
- **Validation** : Toujours valider avec Zod côté client ET serveur
- **Sanitization** : Utiliser `isomorphic-dompurify` pour le contenu HTML
- **CORS** : Configuré au niveau de Supabase
- **XSS** : Éviter `dangerouslySetInnerHTML` sauf avec sanitization
- **CSRF** : Géré par Supabase Auth
- **Rate limiting** : Utiliser `lib/rateLimiter.ts` pour les actions sensibles

### Configuration Next.js

**Optimisations webpack :**
- Chunks séparés pour vendor, markdown, et radix-ui
- `removeConsole` en production (sauf error/warn)
- Source maps désactivés en production
- Bundle analyzer intégré avec `@next/bundle-analyzer`

**Export statique :**
- Mode export statique (`output: 'export'`)
- Images non optimisées pour compatibilité
- ESLint ignoré pendant les builds

**Sources de la section**
- [next.config.js](file://next.config.js#L1-L63)
- [AGENTS.md](file://AGENTS.md#L610-L681)
- [CLAUDE.md](file://CLAUDE.md#L51-L64)