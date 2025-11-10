# Bundle Analysis - Guide d'Analyse et d'Optimisation

Ce document explique comment analyser et optimiser le bundle JavaScript du portfolio Next.js.

## Vue d'ensemble

Le bundle JavaScript est analysé pour identifier les opportunités d'optimisation et maintenir des performances optimales. Ce guide couvre les outils, les processus et les stratégies pour réduire la taille du bundle.

## Outils utilisés

### @next/bundle-analyzer

Le projet utilise `@next/bundle-analyzer` pour visualiser la composition du bundle JavaScript.

**Installation** : Déjà installé dans `package.json`

**Configuration** : Configuré dans `next.config.js` avec le wrapper `withBundleAnalyzer()`

## Commandes disponibles

### Analyser le bundle

```bash
npm run analyze
```

Cette commande :
1. Lance un build de production avec `ANALYZE=true`
2. Génère un rapport interactif dans le navigateur
3. Ouvre automatiquement l'analyse dans votre navigateur par défaut

### Vérifier les budgets de performance

```bash
npm run check-bundle
```

Cette commande :
1. Analyse le fichier `build-manifest.json` généré après un build
2. Vérifie que les assets ne dépassent pas 250KB
3. Vérifie que les entrypoints ne dépassent pas 400KB
4. Affiche un rapport détaillé avec les tailles de chaque asset

**Note** : Vous devez d'abord exécuter `npm run build` avant de pouvoir vérifier les budgets.

## Budgets de performance

Les budgets suivants sont définis pour maintenir de bonnes performances :

- **Taille maximale d'un asset** : 250 KB
- **Taille maximale d'un entrypoint** : 400 KB

Ces budgets sont vérifiés automatiquement par le script `scripts/check-bundle-size.js`.

## Structure des chunks Webpack

Le projet utilise une configuration webpack personnalisée pour optimiser le code splitting :

### Vendor Chunk
- **Nom** : `vendor`
- **Contenu** : Toutes les dépendances de `node_modules`
- **Priorité** : 20
- **Objectif** : Séparer les dépendances tierces du code applicatif

### Markdown Chunk
- **Nom** : `markdown`
- **Contenu** : `react-markdown`, `remark-gfm`, `unified`, `micromark`, `mdast`
- **Priorité** : 30
- **Objectif** : Isoler les bibliothèques Markdown lourdes pour chargement à la demande

### Radix Chunk
- **Nom** : `radix`
- **Contenu** : Tous les composants `@radix-ui/*`
- **Priorité** : 25
- **Objectif** : Séparer les composants UI Radix pour chargement conditionnel

## Interprétation des résultats

### Identifier les gros contributeurs

Lors de l'analyse du bundle, recherchez :

1. **Chunks > 100KB** : Candidats prioritaires pour optimisation
2. **Duplications** : Même bibliothèque chargée plusieurs fois
3. **Bibliothèques lourdes** : 
   - `react-markdown` (~150KB)
   - `date-fns` (~80KB)
   - `recharts` (~200KB)

### Stratégies d'optimisation

#### 1. Code Splitting

Utiliser `next/dynamic` pour charger les composants à la demande :

```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
});
```

**Composants déjà optimisés** :
- `PhotoViewerModal` - Chargé uniquement lors de l'ouverture
- `TextEditModal` - Chargé uniquement en mode édition
- `MarkdownRenderer` - Chargé uniquement pour l'affichage de texte
- `PhotoUploadForm` - Chargé uniquement dans les pages admin

#### 2. Tree Shaking

S'assurer que les imports sont spécifiques :

```typescript
// ❌ Mauvais - importe toute la bibliothèque
import _ from 'lodash';

// ✅ Bon - importe uniquement ce qui est nécessaire
import debounce from 'lodash/debounce';
```

#### 3. Remplacement de dépendances lourdes

Considérer des alternatives plus légères :

- `date-fns` → `dayjs` (plus léger)
- `recharts` → `chart.js` ou `victory` (si nécessaire)
- `react-markdown` → Garder mais charger dynamiquement

#### 4. Optimisation des images

Les images sont déjà optimisées avec :
- Compression côté client avant upload
- Lazy loading avec `OptimizedImage`
- Placeholders LQIP pour améliorer le LCP

## Processus d'optimisation recommandé

### 1. Analyser régulièrement

Exécuter `npm run analyze` après chaque ajout de dépendance importante.

### 2. Identifier les régressions

Utiliser `npm run check-bundle` dans CI/CD pour détecter les régressions automatiquement.

### 3. Optimiser progressivement

- Commencer par les chunks les plus volumineux
- Appliquer le code splitting sur les composants lourds
- Vérifier l'impact avec Lighthouse

### 4. Documenter les décisions

Ajouter des commentaires dans le code expliquant pourquoi certaines optimisations ont été faites.

## Métriques de succès

Objectifs de performance :

- **Bundle initial** : < 200KB (gzipped)
- **TTI (Time to Interactive)** : < 3.5s
- **FCP (First Contentful Paint)** : < 1.8s
- **LCP (Largest Contentful Paint)** : < 2.5s

## Dépannage

### Le bundle analyzer ne s'ouvre pas automatiquement

Vérifier que le port 8888 n'est pas déjà utilisé. Modifier le port dans `next.config.js` si nécessaire.

### Les budgets échouent après un build

1. Vérifier quels assets dépassent les limites
2. Identifier les dépendances responsables
3. Appliquer le code splitting ou remplacer les dépendances lourdes

### Chunks dupliqués

Vérifier les dépendances avec `npm ls` pour identifier les versions dupliquées :

```bash
npm ls | grep -E "(react|react-dom)"
```

## Ressources supplémentaires

- [Next.js Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- [Webpack Code Splitting](https://webpack.js.org/guides/code-splitting/)
- [Next.js Dynamic Imports](https://nextjs.org/docs/advanced-features/dynamic-import)
- [Web Vitals](https://web.dev/vitals/)

## Notes techniques

- Le projet utilise l'export statique (`output: 'export'`), donc certaines optimisations Next.js ne sont pas disponibles
- Les images sont configurées avec `unoptimized: true` pour compatibilité avec l'export statique
- Le lazy loading est géré manuellement avec `OptimizedImage` et Intersection Observer

