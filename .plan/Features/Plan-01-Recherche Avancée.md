# Plan d'Implémentation : Recherche Avancée avec Fuzzy Search et Highlighting

## Vue d'ensemble

Implémentation d'un système de recherche avancée qui améliore significativement l'expérience utilisateur en permettant une recherche tolérante aux fautes de frappe, avec highlighting des résultats et suggestions en temps réel. La recherche sera étendue à toutes les sections (textes, photos, musique, vidéos).

## État actuel

**Recherche existante** :
- Recherche basique avec `includes()` uniquement sur `/textes`
- Debounce de 300ms déjà implémenté avec `useDebounce`
- Filtrage par catégorie et tags fonctionnel
- Pas de recherche dans photos/musique/vidéos

**Limitations** :
- Recherche exacte uniquement (pas de tolérance aux fautes)
- Pas de highlighting des termes trouvés
- Pas de suggestions pendant la saisie
- Pas d'historique de recherche
- Pas de classement par pertinence

## Architecture de la solution

### 1. Module de recherche (`lib/search.ts`)

**Fonctions à créer** :
- `levenshteinDistance(str1: string, str2: string): number` - Calcul de la distance de Levenshtein
- `fuzzyMatch(query: string, text: string, threshold: number = 0.7): boolean` - Matching fuzzy avec seuil
- `highlightText(text: string, query: string): string` - Retourne HTML avec `<mark>` autour des correspondances
- `calculateRelevanceScore(item: any, query: string, fields: string[]): number` - Score de pertinence
- `searchInCollection<T>(collection: T[], query: string, searchFields: string[], options?: SearchOptions): T[]` - Recherche générique

**Structure** :
```typescript
interface SearchOptions {
  fuzzy?: boolean;
  threshold?: number;
  highlight?: boolean;
  sortByRelevance?: boolean;
  maxResults?: number;
}
```

### 2. Composant de suggestions (`components/texts/SearchSuggestions.tsx`)

**Fonctionnalités** :
- Dropdown avec résultats de recherche en temps réel
- Navigation clavier (↑↓ pour sélectionner, Enter pour valider, Escape pour fermer)
- Affichage du type de contenu avec icône
- Highlighting des termes recherchés dans les suggestions
- Limite de 5-8 suggestions visibles
- Indicateur visuel de l'élément sélectionné au clavier

**Props** :
```typescript
interface SearchSuggestionsProps {
  query: string;
  results: SearchResult[];
  onSelect: (result: SearchResult) => void;
  onClose: () => void;
  isLoading?: boolean;
}
```

### 3. Gestion de l'historique (`lib/searchHistory.ts`)

**Fonctions** :
- `saveSearchQuery(query: string): void` - Sauvegarde dans localStorage (max 5)
- `getSearchHistory(): string[]` - Récupère l'historique
- `clearSearchHistory(): void` - Efface l'historique
- `removeSearchQuery(query: string): void` - Supprime une requête spécifique

**Structure localStorage** :
```json
{
  "searchHistory": ["query1", "query2", "query3", "query4", "query5"]
}
```

### 4. Intégration dans les pages

**Modifications nécessaires** :
- `app/textes/page.tsx` : Remplacer recherche `includes()` par `fuzzySearch()`, ajouter composant `SearchSuggestions`
- `app/photos/page.tsx` : Ajouter input de recherche avec fuzzy search
- `app/musique/page.tsx` : Ajouter input de recherche avec fuzzy search
- `app/videos/page.tsx` : Ajouter input de recherche avec fuzzy search
- `components/texts/TextCard.tsx` : Ajouter prop `highlightQuery` pour afficher le highlighting

## Implémentation détaillée

### Étape 1 : Créer le module de recherche (`lib/search.ts`)

**Fonctionnalités** :
1. Implémenter `levenshteinDistance()` avec algorithme dynamique
2. Créer `fuzzyMatch()` avec normalisation (lowercase, accents)
3. Implémenter `highlightText()` avec escape HTML pour sécurité
4. Créer `calculateRelevanceScore()` avec pondération (titre: 3, excerpt: 2, contenu: 1)
5. Créer fonction générique `searchInCollection()` pour tous types de contenu

**Détails techniques** :
- Distance de Levenshtein optimisée (O(n*m) avec memoization si nécessaire)
- Seuil de matching configurable (défaut: 0.7 = 70% de similarité)
- Normalisation Unicode pour gérer accents et caractères spéciaux
- Support de recherche multi-mots (AND logique)

### Étape 2 : Créer le composant SearchSuggestions

**Composant** :
- Input avec debounce intégré (300ms)
- Dropdown positionné sous l'input
- Liste de suggestions avec highlighting
- Gestion du focus et navigation clavier
- Fermeture au clic extérieur (useClickOutside)
- Animation d'apparition/disparition

**Accessibilité** :
- `role="combobox"` et `aria-expanded`
- `aria-activedescendant` pour l'élément sélectionné
- Support lecteur d'écran
- Focus trap dans le dropdown

### Étape 3 : Créer le module d'historique (`lib/searchHistory.ts`)

**Fonctionnalités** :
- Sauvegarde automatique après recherche validée
- Limite de 5 recherches récentes
- Affichage dans dropdown avec icône horloge
- Clic sur historique remplit l'input et lance la recherche
- Bouton pour effacer l'historique

**Intégration** :
- Utilisé dans `SearchSuggestions` pour afficher l'historique
- Bouton de suppression dans page paramètres

### Étape 4 : Intégrer dans page textes

**Modifications** :
- Remplacer logique de filtrage actuelle par `searchInCollection()`
- Ajouter composant `SearchSuggestions` au-dessus de la liste
- Passer `highlightQuery` à `TextCard` pour afficher le highlighting
- Conserver debounce existant avec `useDebounce`
- Ajouter badge avec nombre de résultats

**Code existant à modifier** :
```typescript
// Remplacer cette partie dans applyFilters useMemo
if (debouncedSearchQuery.trim()) {
  const query = debouncedSearchQuery.toLowerCase();
  result = result.filter(
    (text) =>
      text.title.toLowerCase().includes(query) ||
      text.subtitle?.toLowerCase().includes(query) ||
      text.excerpt?.toLowerCase().includes(query) ||
      text.content.toLowerCase().includes(query)
  );
}
```

### Étape 5 : Ajouter recherche dans photos

**Modifications** :
- Ajouter input de recherche dans `app/photos/page.tsx`
- Créer `applySearch` avec `searchInCollection()` sur champs `title`, `description`
- Intégrer `SearchSuggestions` pour photos
- Ajouter highlighting dans `PhotoCard` (optionnel, dans titre/description)

### Étape 6 : Ajouter recherche dans musique

**Modifications** :
- Ajouter input de recherche dans `app/musique/page.tsx`
- Recherche sur champs `title`, `artist`, `album`
- Intégrer `SearchSuggestions` pour musique
- Classement par pertinence (titre > artist > album)

### Étape 7 : Ajouter recherche dans vidéos

**Modifications** :
- Ajouter input de recherche dans `app/videos/page.tsx`
- Recherche sur champs `title`, `description`
- Intégrer `SearchSuggestions` pour vidéos
- Même logique que pour photos

### Étape 8 : Améliorer TextCard avec highlighting

**Modifications** :
- Ajouter prop optionnelle `highlightQuery?: string`
- Utiliser `highlightText()` pour surligner dans titre, excerpt
- Style `<mark>` avec couleur accent du thème
- Fallback gracieux si pas de query

### Étape 9 : Ajouter gestion historique dans paramètres

**Modifications** :
- Ajouter section "Historique de recherche" dans `app/parametres/page.tsx`
- Afficher liste des recherches récentes
- Bouton "Effacer l'historique" avec confirmation
- Indication du nombre de recherches sauvegardées

## Fichiers à créer/modifier

### Nouveaux fichiers
- `lib/search.ts` - Module de recherche fuzzy et highlighting
- `lib/searchHistory.ts` - Gestion de l'historique
- `components/texts/SearchSuggestions.tsx` - Composant de suggestions

### Fichiers à modifier
- `app/textes/page.tsx` - Intégration recherche avancée
- `app/photos/page.tsx` - Ajout recherche
- `app/musique/page.tsx` - Ajout recherche
- `app/videos/page.tsx` - Ajout recherche
- `components/texts/TextCard.tsx` - Ajout highlighting
- `components/photos/PhotoCard.tsx` - Ajout highlighting optionnel
- `app/parametres/page.tsx` - Gestion historique

## Tests à effectuer

1. Recherche exacte fonctionne comme avant
2. Recherche fuzzy trouve résultats avec fautes de frappe (ex: "photografe" trouve "photographie")
3. Highlighting affiche correctement les termes surlignés
4. Suggestions apparaissent après 300ms de saisie
5. Navigation clavier fonctionne dans suggestions
6. Historique sauvegarde et restaure correctement
7. Recherche fonctionne dans toutes les sections
8. Performance acceptable avec grandes collections (>1000 items)

## Notes techniques

- Algorithme de Levenshtein : implémentation simple O(n*m), optimisable si nécessaire
- Highlighting : utiliser `dangerouslySetInnerHTML` avec contenu sanitizé ou composant React avec parsing
- Debounce : déjà implémenté avec `useDebounce`, réutiliser
- Performance : pour collections >500 items, considérer Web Worker pour recherche fuzzy
- Accessibilité : re