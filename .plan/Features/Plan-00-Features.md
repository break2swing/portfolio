# Plan d'Améliorations Fonctionnelles Utilisateur

## Vue d'ensemble

Ce plan enrichit l'expérience utilisateur du portfolio avec de nouvelles fonctionnalités modernes pour améliorer la découvrabilité du contenu, l'interaction et la navigation. Les améliorations se concentrent sur la recherche, les favoris, le partage social, et les options de tri/filtrage avancées.

## État actuel

**Fonctionnalités existantes** :

- Recherche basique avec `includes()` sur les textes
- Filtres par catégories et tags (logique AND)
- Partage basique via Web Share API dans PhotoViewerModal
- Navigation clavier dans PhotoViewerModal
- Affichage des photos, textes, musique et vidéos

**Limitations identifiées** :

- Recherche non fuzzy, pas de highlighting, pas de suggestions
- Pas de système de favoris/bookmarks
- Partage limité à Web Share API (pas de boutons sociaux)
- Pas de tri avancé (date, popularité, alphabétique)
- Pas de pagination pour grandes listes
- Pas de vue détaillée améliorée avec métadonnées
- Pas de recherche dans les photos/musique/vidéos

## Améliorations à implémenter

### 1. Recherche avancée avec fuzzy search et highlighting

**Objectif** : Améliorer la recherche avec fuzzy matching, highlighting des résultats et suggestions en temps réel.

**Fichiers concernés** :

- `lib/search.ts` (nouveau) - Fonctions de recherche fuzzy et highlighting
- `components/texts/SearchSuggestions.tsx` (nouveau) - Composant de suggestions
- `app/textes/page.tsx` - Intégration recherche avancée
- `app/photos/page.tsx` - Ajout recherche dans photos
- `app/musique/page.tsx` - Ajout recherche dans musique
- `app/videos/page.tsx` - Ajout recherche dans vidéos
- `components/texts/TextCard.tsx` - Highlighting des résultats

**Implémentation** :

- Créer fonction `fuzzySearch()` utilisant distance de Levenshtein pour matching approximatif
- Implémenter `highlightText()` pour surligner les termes recherchés avec `<mark>`
- Créer composant `SearchSuggestions` avec navigation clavier (↑↓, Enter, Escape)
- Ajouter debounce de 300ms sur l'input de recherche (déjà fait pour textes)
- Classer les résultats par pertinence (titre > excerpt > contenu)
- Sauvegarder historique de recherche dans localStorage (5 dernières recherches)
- Ajouter bouton pour effacer l'historique dans les paramètres

**Bénéfices** :

- Recherche plus tolérante aux fautes de frappe
- Meilleure découvrabilité du contenu
- Expérience utilisateur moderne avec suggestions
- Navigation clavier fluide

### 2. Système de favoris/bookmarks

**Objectif** : Permettre aux utilisateurs de sauvegarder leurs contenus favoris pour y accéder rapidement.

**Fichiers concernés** :

- `lib/favorites.ts` (nouveau) - Gestion des favoris avec localStorage
- `components/FavoriteButton.tsx` (nouveau) - Bouton favoris réutilisable
- `app/favoris/page.tsx` (nouveau) - Page de favoris
- `components/photos/PhotoCard.tsx` - Ajout bouton favoris
- `components/texts/TextCard.tsx` - Ajout bouton favoris
- `components/music/TrackCard.tsx` (nouveau ou existant) - Ajout bouton favoris
- `components/videos/VideoCard.tsx` (nouveau ou existant) - Ajout bouton favoris
- `components/Sidebar.tsx` - Ajout lien vers favoris

**Implémentation** :

- Créer système de favoris avec localStorage (structure : `{ photos: [], texts: [], music: [], videos: [] }`)
- Fonctions `addFavorite()`, `removeFavorite()`, `isFavorite()`, `getAllFavorites()`
- Bouton favoris avec icône cœur (rempli/vide) et animation
- Page `/favoris` affichant tous les favoris par catégorie avec onglets
- Synchronisation avec sessionStorage pour persistance entre sessions
- Badge avec nombre de favoris dans la sidebar
- Export/import des favoris en JSON (optionnel)

**Bénéfices** :

- Engagement utilisateur accru
- Accès rapide au contenu apprécié
- Personnalisation de l'expérience
- Augmentation du temps passé sur le site

### 3. Partage social amélioré

**Objectif** : Étendre le partage avec boutons sociaux (Twitter, Facebook, LinkedIn) et copie de lien améliorée.

**Fichiers concernés** :

- `components/ShareButton.tsx` (nouveau) - Composant de partage réutilisable
- `components/photos/PhotoViewerModal.tsx` - Amélioration partage
- `components/texts/TextDetailModal.tsx` - Ajout partage
- `components/music/AudioPlayer.tsx` - Ajout partage
- `lib/shareUtils.ts` (nouveau) - Utilitaires de partage

**Implémentation** :

- Créer composant `ShareButton` avec menu déroulant (Web Share API + boutons sociaux)
- Boutons sociaux : Twitter, Facebook, LinkedIn, Email
- Génération d'URLs de partage avec paramètres UTM pour analytics
- Copie de lien avec toast de confirmation
- Partage d'image avec Open Graph meta tags (pour réseaux sociaux)
- Support du partage de texte avec extrait formaté
- Fallback gracieux si Web Share API non disponible

**Bénéfices** :

- Meilleure visibilité sur les réseaux sociaux
- Partage simplifié pour les utilisateurs
- Tracking des partages via analytics
- Support multi-plateformes

### 4. Tri et filtres avancés

**Objectif** : Ajouter des options de tri (date, alphabétique, popularité) et améliorer les filtres combinés.

**Fichiers concernés** :

- `components/SortSelector.tsx` (nouveau) - Sélecteur de tri réutilisable
- `app/textes/page.tsx` - Ajout tri et filtres améliorés
- `app/photos/page.tsx` - Ajout tri et filtres améliorés
- `app/musique/page.tsx` - Ajout tri et filtres améliorés
- `app/videos/page.tsx` - Ajout tri et filtres améliorés
- `lib/sortUtils.ts` (nouveau) - Fonctions de tri

**Implémentation** :

- Créer composant `SortSelector` avec options : Date (récent/ancien), Alphabétique (A-Z/Z-A), Popularité (si métrique disponible)
- Fonctions de tri réutilisables dans `sortUtils.ts`
- Sauvegarder préférence de tri dans localStorage
- Améliorer filtres combinés avec logique OR pour tags (optionnel)
- Ajouter filtre par date (dernière semaine, mois, année)
- Badge avec nombre de résultats filtrés
- Bouton "Réinitialiser les filtres" visible quand filtres actifs

**Bénéfices** :

- Contrôle utilisateur sur l'affichage
- Découvrabilité améliorée du contenu
- Expérience personnalisable
- Navigation plus efficace

### 5. Pagination et chargement progressif

**Objectif** : Implémenter la pagination pour améliorer les performances sur grandes listes.

**Fichiers concernés** :

- `components/Pagination.tsx` (nouveau) - Composant de pagination
- `app/textes/page.tsx` - Intégration pagination
- `app/photos/page.tsx` - Intégration pagination
- `app/musique/page.tsx` - Intégration pagination
- `app/videos/page.tsx` - Intégration pagination

**Implémentation** :

- Créer composant `Pagination` avec navigation première/dernière/précédente/suivante
- Pagination de 20 items par page (configurable)
- URL query params pour la page courante (`?page=2`)
- Synchronisation avec virtualisation existante (afficher pagination si <100 items, virtualisation si >100)
- Indicateur de page courante et nombre total de pages
- Navigation clavier (flèches gauche/droite pour changer de page)

**Bénéfices** :

- Meilleures performances sur grandes listes
- Navigation plus claire
- Réduction de la consommation mémoire
- Expérience utilisateur améliorée

### 6. Vue détaillée améliorée avec métadonnées

**Objectif** : Enrichir les vues détaillées avec métadonnées, navigation améliorée et actions supplémentaires.

**Fichiers concernés** :

- `components/texts/TextDetailModal.tsx` - Amélioration vue détaillée
- `components/photos/PhotoViewerModal.tsx` - Ajout métadonnées
- `components/music/AudioPlayer.tsx` - Amélioration affichage
- `components/videos/VideoPlayer.tsx` (nouveau ou existant) - Vue détaillée vidéo

**Implémentation** :

- Ajouter section métadonnées dans TextDetailModal (date de publication, auteur, catégorie, tags, nombre de vues)
- Ajouter navigation précédent/suivant dans PhotoViewerModal (déjà partiellement fait)
- Afficher informations EXIF dans PhotoViewerModal (si disponibles)
- Ajouter bouton "Voir dans la galerie" pour revenir à la liste
- Breadcrumbs pour navigation hiérarchique
- Temps de lecture estimé pour les textes
- Miniatures des items précédent/suivant en bas de la modale

**Bénéfices** :

- Contexte enrichi pour chaque contenu
- Navigation améliorée entre items
- Informations utiles pour les utilisateurs
- Expérience plus immersive

### 7. Recherche globale avec résultats unifiés

**Objectif** : Créer une barre de recherche globale qui recherche dans tous les types de contenu.

**Fichiers concernés** :

- `components/GlobalSearch.tsx` (nouveau) - Barre de recherche globale
- `app/search/page.tsx` (nouveau) - Page de résultats de recherche
- `components/Sidebar.tsx` - Intégration barre de recherche
- `components/Topbar.tsx` - Option barre de recherche dans header
- `lib/search.ts` - Fonctions de recherche unifiées

**Implémentation** :

- Créer composant `GlobalSearch` avec input et résultats en dropdown
- Recherche unifiée dans photos, textes, musique, vidéos
- Résultats groupés par type avec icônes
- Navigation clavier complète (↑↓, Enter, Escape, Tab)
- Lien "Voir tous les résultats" vers `/search?q=query`
- Page de résultats avec onglets par type de contenu
- Historique de recherche global
- Raccourci clavier `/` pour ouvrir la recherche (comme GitHub)

**Bénéfices** :

- Accès rapide à tout le contenu
- Découvrabilité maximale
- Expérience utilisateur moderne
- Navigation efficace

### 8. Améliorations du lecteur audio

**Objectif** : Enrichir le lecteur audio avec playlist, mode aléatoire, répétition et visualisation.

**Fichiers concernés** :

- `components/music/AudioPlayer.tsx` - Amélioration lecteur
- `components/music/Playlist.tsx` (nouveau) - Composant playlist
- `app/musique/page.tsx` - Intégration playlist

**Implémentation** :

- Ajouter boutons mode aléatoire (shuffle) et répétition (repeat one/all)
- Créer composant `Playlist` affichant la liste des morceaux
- Navigation automatique vers morceau suivant
- Sauvegarder position de lecture dans localStorage
- Barre de progression améliorée avec preview au survol
- Contrôles clavier (Espace pour play/pause, ←→ pour navigation)
- Visualisation audio basique avec canvas (optionnel, avancé)

**Bénéfices** :

- Expérience d'écoute améliorée
- Navigation fluide entre morceaux
- Contrôles intuitifs
- Engagement utilisateur accru

## Ordre d'implémentation recommandé

1. **Recherche avancée** (impact immédiat sur UX, base pour autres fonctionnalités)
2. **Tri et filtres avancés** (complément naturel de la recherche)
3. **Système de favoris** (engagement utilisateur)
4. **Pagination** (performance sur grandes listes)
5. **Partage social amélioré** (visibilité)
6. **Vue détaillée améliorée** (contexte enrichi)
7. **Recherche globale** (découvrabilité maximale)
8. **Améliorations lecteur audio** (spécifique à la musique)

## Métriques de succès

- **Recherche** : Temps moyen de recherche réduit de 50%
- **Favoris** : 30% des utilisateurs utilisent les favoris
- **Partage** : Augmentation de 20% des partages sociaux
- **Navigation** : Réduction de 40% du temps pour trouver du contenu
- **Engagement** : Augmentation de 25% du temps passé sur le site

## Notes techniques

- Toutes les fonctionnalités utilisent localStorage pour la persistance côté client
- Compatible avec l'export statique Next.js
- Les favoris peuvent être synchronisés avec Supabase si authentification disponible
- La recherche fuzzy utilise l'algorithme de Levenshtein (implémentation légère)
- Le partage social génère des URLs avec paramètres UTM pour tracking
- La pagination peut coexister avec la virtualisation (choix selon nombre d'items)