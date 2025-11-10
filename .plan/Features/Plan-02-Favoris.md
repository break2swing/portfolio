# Plan d'Implémentation : Système de Favoris/Bookmarks

## Vue d'ensemble

Implémentation d'un système de favoris complet permettant aux utilisateurs de sauvegarder leurs contenus préférés dans toutes les sections du portfolio (photos, textes, musique, vidéos). Les favoris sont persistés dans localStorage et accessibles via une page dédiée avec navigation par onglets.

## État actuel

**Fonctionnalités existantes** :
- Affichage des contenus dans des cartes (PhotoCard, TextCard)
- Navigation entre sections fonctionnelle
- Système de tags et catégories pour organisation

**Limitations** :
- Pas de système de favoris
- Pas de moyen de sauvegarder des contenus pour consultation ultérieure
- Pas de page dédiée pour accéder aux favoris

## Architecture de la solution

### 1. Module de gestion des favoris (`lib/favorites.ts`)

**Structure de données** :
```typescript
interface FavoritesData {
  photos: string[];      // IDs des photos favorites
  texts: string[];       // IDs des textes favorites
  music: string[];       // IDs des morceaux favorites
  videos: string[];      // IDs des vidéos favorites
  updatedAt: string;    // Timestamp de dernière mise à jour
}
```

**Fonctions à créer** :
- `getAllFavorites(): FavoritesData` - Récupère tous les favoris
- `getFavoritesByType(type: ContentType): string[]` - Récupère favoris d'un type spécifique
- `isFavorite(type: ContentType, id: string): boolean` - Vérifie si un contenu est favori
- `addFavorite(type: ContentType, id: string): void` - Ajoute un favori
- `removeFavorite(type: ContentType, id: string): void` - Supprime un favori
- `toggleFavorite(type: ContentType, id: string): boolean` - Bascule l'état favori (retourne nouveau état)
- `clearFavorites(type?: ContentType): void` - Efface tous les favoris (ou d'un type)
- `getFavoritesCount(): number` - Retourne le nombre total de favoris
- `exportFavorites(): string` - Exporte les favoris en JSON
- `importFavorites(json: string): boolean` - Importe des favoris depuis JSON

**Type** :
```typescript
type ContentType = 'photos' | 'texts' | 'music' | 'videos';
```

**Structure localStorage** :
```json
{
  "favorites": {
    "photos": ["id1", "id2"],
    "texts": ["id3"],
    "music": ["id4", "id5"],
    "videos": [],
    "updatedAt": "2025-01-11T10:00:00Z"
  }
}
```

### 2. Composant FavoriteButton (`components/FavoriteButton.tsx`)

**Fonctionnalités** :
- Bouton avec icône cœur (rempli si favori, vide sinon)
- Animation au clic (scale + fill)
- Gestion de l'état local pour réactivité immédiate
- Toast de confirmation (ajout/suppression)
- Support clavier (Enter/Space pour toggle)
- Accessibilité (aria-label, aria-pressed)

**Props** :
```typescript
interface FavoriteButtonProps {
  type: ContentType;
  id: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'outline';
  showLabel?: boolean;
  className?: string;
}
```

**Comportement** :
- Clic sur le bouton toggle le favori
- Animation de remplissage/vidage du cœur
- Toast avec message "Ajouté aux favoris" / "Retiré des favoris"
- Mise à jour immédiate de l'icône
- Écoute des changements dans localStorage pour synchronisation entre composants

### 3. Page de favoris (`app/favoris/page.tsx`)

**Structure** :
- Header avec titre "Mes Favoris" et compteur total
- Onglets pour chaque type de contenu (Photos, Textes, Musique, Vidéos)
- Badge avec nombre de favoris par onglet
- Liste des favoris avec cartes correspondantes
- Message vide si aucun favori dans une catégorie
- Bouton "Effacer tous les favoris" dans les paramètres de la page
- Export/import des favoris (optionnel, dans menu)

**Fonctionnalités** :
- Chargement des données complètes des favoris depuis les services
- Affichage avec les mêmes composants que les pages principales (PhotoCard, TextCard, etc.)
- Navigation vers le contenu au clic
- Filtrage par type via onglets
- Gestion des erreurs si un favori n'existe plus (nettoyage automatique)

**Onglets** :
- Utiliser composant `Tabs` de shadcn/ui
- Badge avec nombre dans chaque onglet
- Onglet actif basé sur l'URL query param (`?type=photos`)

### 4. Composants de cartes à modifier/créer

**PhotoCard** (`components/photos/PhotoCard.tsx`) :
- Ajouter bouton favoris en overlay (coin supérieur droit)
- Position absolue pour ne pas interférer avec le contenu
- Visible au hover ou toujours visible selon préférence UX

**TextCard** (`components/texts/TextCard.tsx`) :
- Ajouter bouton favoris dans CardHeader (coin supérieur droit)
- Intégration discrète avec les autres éléments

**TrackCard** (`components/music/TrackCard.tsx`) :
- Créer composant si n'existe pas (actuellement TrackList affiche différemment)
- Ajouter bouton favoris
- Structure similaire à TextCard avec Card de shadcn/ui

**VideoCard** (`components/videos/VideoCard.tsx`) :
- Vérifier structure existante
- Ajouter bouton favoris en overlay ou dans header

### 5. Intégration dans Sidebar (`components/Sidebar.tsx`)

**Modifications** :
- Ajouter item de navigation "Favoris" avec icône Heart
- Badge avec nombre total de favoris à côté du label
- Position après "Accueil" ou avant "À propos"
- Mise à jour du badge en temps réel via événement localStorage

**Icône** :
- Utiliser `Heart` de lucide-react
- Badge avec `Badge` de shadcn/ui ou div personnalisée

### 6. Gestion dans page paramètres (`app/parametres/page.tsx`)

**Ajouts** :
- Section "Favoris" avec :
  - Nombre total de favoris
  - Bouton "Effacer tous les favoris" avec confirmation
  - Bouton "Exporter les favoris" (télécharge JSON)
  - Input "Importer les favoris" avec validation
  - Liste des favoris par type (optionnel, vue d'ensemble)

## Implémentation détaillée

### Étape 1 : Créer le module favorites.ts

**Fonctionnalités** :
1. Initialiser structure par défaut si localStorage vide
2. Implémenter toutes les fonctions CRUD
3. Gérer les événements `storage` pour synchronisation entre onglets
4. Validation des données lors de l'import
5. Gestion d'erreurs gracieuse (try/catch pour localStorage)

**Détails techniques** :
- Utiliser `localStorage` pour persistance
- Clé de stockage : `"portfolio_favorites"`
- Émettre événement `storage` personnalisé pour synchronisation
- Normaliser les IDs (string) pour éviter les doublons
- Timestamp ISO pour `updatedAt`

### Étape 2 : Créer le composant FavoriteButton

**Composant** :
- Utiliser `useState` pour état local (isFavorite)
- `useEffect` pour synchroniser avec localStorage
- Animation CSS avec `transition` et `transform`
- Icône `Heart` de lucide-react (filled/outline selon état)
- Toast avec `sonner` pour feedback utilisateur
- Gestion du clic avec `toggleFavorite()`

**Styles** :
- Position relative/absolute selon contexte parent
- Couleur accent du thème pour cœur rempli
- Animation scale au clic (0.9 → 1.0)
- Transition smooth pour fill

**Accessibilité** :
- `role="button"`
- `aria-label` dynamique ("Ajouter aux favoris" / "Retirer des favoris")
- `aria-pressed={isFavorite}`
- Support clavier (onKeyDown pour Enter/Space)

### Étape 3 : Créer la page favoris

**Structure de la page** :
- Layout similaire aux autres pages (header + contenu)
- Utiliser `Tabs` de shadcn/ui pour navigation
- Charger données complètes depuis services pour chaque type
- Gérer états de chargement et erreurs
- Message vide avec illustration si aucun favori

**Chargement des données** :
- Pour chaque type, récupérer les IDs favoris
- Charger les données complètes via services (getAllPhotos, getPublishedTexts, etc.)
- Filtrer pour ne garder que les favoris
- Gérer cas où un favori n'existe plus (nettoyer automatiquement)

**Composants réutilisés** :
- PhotoGrid / VirtualizedPhotoGrid pour photos
- TextCard grid pour textes
- TrackList pour musique
- VideoGrid pour vidéos

### Étape 4 : Intégrer FavoriteButton dans PhotoCard

**Modifications** :
- Ajouter bouton en position absolue (top-right)
- Z-index élevé pour être au-dessus de l'image
- Visible au hover du groupe ou toujours visible
- Gérer le clic pour éviter propagation vers onClick de la carte
- Style avec fond semi-transparent pour visibilité

**Code à ajouter** :
```typescript
<div className="absolute top-2 right-2 z-10">
  <FavoriteButton type="photos" id={photo.id} size="sm" variant="ghost" />
</div>
```

### Étape 5 : Intégrer FavoriteButton dans TextCard

**Modifications** :
- Ajouter dans CardHeader, aligné à droite
- Position relative dans le header
- Style discret pour ne pas surcharger
- Même gestion du clic que PhotoCard

### Étape 6 : Créer/Modifier TrackCard

**Si composant n'existe pas** :
- Créer `components/music/TrackCard.tsx`
- Structure similaire à TextCard
- Afficher titre, artiste, album, durée
- Bouton play intégré ou séparé
- FavoriteButton intégré

**Si TrackList existe déjà** :
- Modifier TrackList pour ajouter FavoriteButton sur chaque item
- Ou créer TrackCard et l'utiliser dans TrackList

### Étape 7 : Intégrer FavoriteButton dans VideoCard

**Modifications** :
- Vérifier structure actuelle de VideoCard
- Ajouter FavoriteButton en overlay (comme PhotoCard)
- Gérer visibilité au hover ou toujours visible

### Étape 8 : Ajouter lien dans Sidebar

**Modifications** :
- Ajouter item dans `mainNavItems` ou créer section séparée
- Utiliser `Heart` de lucide-react
- Badge avec nombre total de favoris
- Hook personnalisé `useFavoritesCount()` pour réactivité
- Écouter événements localStorage pour mise à jour

**Position** :
- Après "Accueil" pour visibilité
- Ou dans section séparée avant "À propos"

### Étape 9 : Ajouter gestion dans paramètres

**Modifications** :
- Ajouter section "Favoris" dans `app/parametres/page.tsx`
- Afficher statistiques (nombre par type)
- Bouton "Effacer tous les favoris" avec Dialog de confirmation
- Export : bouton qui télécharge JSON
- Import : input file + validation + import

**Validation import** :
- Vérifier structure JSON valide
- Valider les types et IDs
- Afficher aperçu avant import
- Confirmation avant remplacement

### Étape 10 : Hook personnalisé useFavorites (optionnel)

**Créer** `hooks/useFavorites.ts` :
- Hook React pour faciliter l'utilisation dans composants
- Retourne `{ favorites, isFavorite, toggleFavorite, addFavorite, removeFavorite }`
- Gère synchronisation avec localStorage
- Écoute événements storage

## Fichiers à créer/modifier

### Nouveaux fichiers
- `lib/favorites.ts` - Module de gestion des favoris
- `components/FavoriteButton.tsx` - Composant bouton favoris
- `app/favoris/page.tsx` - Page de favoris
- `hooks/useFavorites.ts` (optionnel) - Hook React pour favoris
- `components/music/TrackCard.tsx` (si n'existe pas) - Carte pour morceaux

### Fichiers à modifier
- `components/photos/PhotoCard.tsx` - Ajout FavoriteButton
- `components/texts/TextCard.tsx` - Ajout FavoriteButton
- `components/videos/VideoCard.tsx` - Ajout FavoriteButton
- `components/music/TrackList.tsx` ou `TrackCard.tsx` - Ajout FavoriteButton
- `components/Sidebar.tsx` - Ajout lien favoris avec badge
- `app/parametres/page.tsx` - Gestion favoris (export/import/effacement)

## Tests à effectuer

1. Ajout/suppression de favoris fonctionne pour tous les types
2. Favoris persistés après rechargement de page
3. Badge dans Sidebar se met à jour en temps réel
4. Page favoris affiche correctement tous les favoris par type
5. Onglets dans page favoris fonctionnent correctement
6. Export/import des favoris fonctionne
7. Nettoyage automatique des favoris inexistants
8. Synchronisation entre onglets du navigateur
9. Accessibilité (navigation clavier, lecteur d'écran)
10. Performance acceptable avec beaucoup de favoris (>100)

## Notes techniques

- **localStorage** : Limite de ~5-10MB, suffisant pour des milliers de favoris (IDs seulement)
- **Synchronisation** : Événement `storage` pour synchroniser entre onglets
- **Performance** : Charger seulement les favoris nécessaires, pas tous les contenus
- **Validation** : Valider structure JSON lors de l'import pour éviter corruption
- **Fallback** : Si localStorage indisponible, utiliser sessionStorage ou état mémoire
- **Migration future** : Structure permet migration vers Supabase si authentification ajoutée
- **Accessibilité** : Respecter WCAG 2.1 niveau AA pour boutons et navigation