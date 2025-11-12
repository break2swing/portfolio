# Fonctionnalités Principales

<cite>
**Fichiers référencés dans ce document**   
- [page.tsx](file://app/page.tsx)
- [musique/page.tsx](file://app/musique/page.tsx)
- [photos/page.tsx](file://app/photos/page.tsx)
- [videos/page.tsx](file://app/videos/page.tsx)
- [textes/page.tsx](file://app/textes/page.tsx)
- [favoris/page.tsx](file://app/favoris/page.tsx)
- [admin/migrate-lqip/page.tsx](file://app/admin/migrate-lqip/page.tsx)
- [components/music/AudioPlayer.tsx](file://components/music/AudioPlayer.tsx)
- [components/photos/PhotoViewerModal.tsx](file://components/photos/PhotoViewerModal.tsx)
- [components/texts/TextDetailModal.tsx](file://components/texts/TextDetailModal.tsx)
- [components/videos/VideoPlayerModal.tsx](file://components/videos/VideoPlayerModal.tsx)
- [components/AdvancedFilters.tsx](file://components/AdvancedFilters.tsx)
- [services/musicService.ts](file://services/musicService.ts)
- [services/photoService.ts](file://services/photoService.ts)
- [services/textService.ts](file://services/textService.ts)
- [services/videoService.ts](file://services/videoService.ts)
- [hooks/useBookmarks.ts](file://hooks/useBookmarks.ts)
- [lib/search.ts](file://lib/search.ts)
</cite>

## Table des matières
1. [Introduction](#introduction)
2. [Module Musique](#module-musique)
3. [Module Photos](#module-photos)
4. [Module Vidéos](#module-videos)
5. [Module Textes](#module-textes)
6. [Module Applications](#module-applications)
7. [Système d'Administration](#système-dadministration)
8. [Fonctionnalités Transversales](#fonctionnalités-transversales)
9. [Conclusion](#conclusion)

## Introduction
Le portfolio présente un ensemble de modules multimédias permettant de découvrir les créations artistiques et techniques de l'auteur. Chaque module (musique, photos, vidéos, textes, applications) dispose d'une interface utilisateur spécifique, de fonctionnalités avancées et d'une intégration avec Supabase pour le stockage et la gestion des données. Ce document décrit en détail les fonctionnalités principales de chaque module, les composants React impliqués, les services backend utilisés et les interactions avec Supabase.

**Section sources**
- [page.tsx](file://app/page.tsx#L1-L79)

## Module Musique
Le module musique permet de découvrir les compositions et morceaux de l'auteur, avec un lecteur audio intégré, des playlists personnalisées et une intégration avec SoundCloud.

### Interface Utilisateur
L'interface du module musique comprend un lecteur audio avec visualisation, une liste de lecture, des onglets pour le lecteur, les playlists et SoundCloud, ainsi que des filtres par tags et une barre de recherche. L'utilisateur peut naviguer entre les morceaux, contrôler la lecture (lecture, pause, volume, avance, retour), activer le mode aléatoire et la répétition.

### Fonctionnalités Spécifiques
Le lecteur audio permet de lire les morceaux stockés dans Supabase, avec plusieurs types de visualisation (barres, onde, cercle, points, ligne). Les playlists peuvent être créées, modifiées et réorganisées. La recherche permet de trouver des morceaux par titre, artiste ou album.

### Composants React
Les principaux composants React utilisés sont `AudioPlayer`, `TrackList`, `PlaylistManager`, `TagBadge` et `SearchSuggestions`. Le composant `AudioPlayer` gère la lecture audio et la visualisation, tandis que `TrackList` affiche la liste des morceaux disponibles.

### Services Backend
Le service `musicService` gère les opérations CRUD sur les morceaux de musique, y compris la création, la lecture, la mise à jour et la suppression. Le service `playlistService` gère les playlists, permettant de créer, modifier et supprimer des playlists, ainsi que d'ajouter ou supprimer des morceaux.

### Interactions avec Supabase
Les morceaux de musique sont stockés dans la table `music_tracks` de Supabase, avec des métadonnées comme le titre, l'artiste, l'album, l'URL du fichier audio et l'URL de l'image de couverture. Les tags sont gérés via la table `music_tags`, qui établit une relation many-to-many entre les morceaux et les tags.

### Exemple d'Utilisation
Lorsqu'un utilisateur sélectionne un morceau dans la liste de lecture, le lecteur audio se met à jour pour afficher les informations du morceau et commence la lecture. L'utilisateur peut alors contrôler la lecture, ajuster le volume, activer le mode aléatoire ou la répétition, et naviguer entre les morceaux.

**Section sources**
- [musique/page.tsx](file://app/musique/page.tsx#L1-L577)
- [components/music/AudioPlayer.tsx](file://components/music/AudioPlayer.tsx#L1-L849)
- [services/musicService.ts](file://services/musicService.ts#L1-L301)

## Module Photos
Le module photos présente une galerie de photographies et créations visuelles, avec une visualisation en plein écran, des filtres avancés et un système de gestion des tags.

### Interface Utilisateur
L'interface du module photos comprend une grille de photos, des filtres avancés par tags et date, une barre de recherche et un bouton de réinitialisation des filtres. L'utilisateur peut cliquer sur une photo pour l'ouvrir en plein écran, naviguer entre les photos, zoomer et télécharger la photo.

### Fonctionnalités Spécifiques
La galerie de photos permet de visualiser les photos en grille ou en liste, avec un système de pagination virtuelle pour les grandes collections. Les filtres avancés permettent de filtrer par tags et date de création. La visualisation en plein écran offre des fonctionnalités de navigation, de zoom et de téléchargement.

### Composants React
Les principaux composants React utilisés sont `PhotoGrid`, `PhotoViewerModal`, `AdvancedFilters` et `TagBadge`. Le composant `PhotoGrid` affiche les photos en grille, tandis que `PhotoViewerModal` permet de visualiser une photo en plein écran.

### Services Backend
Le service `photoService` gère les opérations CRUD sur les photos, y compris la création, la lecture, la mise à jour et la suppression. Le service `photoTagService` gère les tags associés aux photos.

### Interactions avec Supabase
Les photos sont stockées dans la table `photos` de Supabase, avec des métadonnées comme le titre, la description, l'URL de l'image et l'URL du placeholder flou (LQIP). Les tags sont gérés via la table `photo_tags`, qui établit une relation many-to-many entre les photos et les tags.

### Exemple d'Utilisation
Lorsqu'un utilisateur clique sur une photo dans la grille, la modal `PhotoViewerModal` s'ouvre en plein écran, affichant la photo avec des options de navigation, de zoom et de téléchargement. L'utilisateur peut naviguer entre les photos en utilisant les flèches gauche et droite, zoomer avec les boutons + et -, et télécharger la photo en cliquant sur l'icône de téléchargement.

**Section sources**
- [photos/page.tsx](file://app/photos/page.tsx#L1-L171)
- [components/photos/PhotoViewerModal.tsx](file://components/photos/PhotoViewerModal.tsx#L1-L235)
- [services/photoService.ts](file://services/photoService.ts#L1-L221)

## Module Vidéos
Le module vidéos permet de découvrir les projets vidéo et créations audiovisuelles, avec un lecteur vidéo intégré, des filtres par tags et une barre de recherche.

### Interface Utilisateur
L'interface du module vidéos comprend une grille de vidéos, des filtres par tags, une barre de recherche et un bouton de réinitialisation des filtres. L'utilisateur peut cliquer sur une vidéo pour l'ouvrir dans une modal avec le lecteur vidéo intégré.

### Fonctionnalités Spécifiques
La grille de vidéos affiche les vidéos avec leur titre, description et miniature. Le lecteur vidéo intégré permet de lire les vidéos stockées dans Supabase, avec les contrôles de lecture standard (lecture, pause, volume, avance, retour).

### Composants React
Les principaux composants React utilisés sont `VideoGrid`, `VideoPlayerModal` et `TagBadge`. Le composant `VideoGrid` affiche les vidéos en grille, tandis que `VideoPlayerModal` permet de lire une vidéo dans une modal.

### Services Backend
Le service `videoService` gère les opérations CRUD sur les vidéos, y compris la création, la lecture, la mise à jour et la suppression. Le service `videoTagService` gère les tags associés aux vidéos.

### Interactions avec Supabase
Les vidéos sont stockées dans la table `videos` de Supabase, avec des métadonnées comme le titre, la description, l'URL de la vidéo et l'URL de la miniature. Les tags sont gérés via la table `video_tags`, qui établit une relation many-to-many entre les vidéos et les tags.

### Exemple d'Utilisation
Lorsqu'un utilisateur clique sur une vidéo dans la grille, la modal `VideoPlayerModal` s'ouvre, affichant la vidéo avec le lecteur intégré. L'utilisateur peut alors contrôler la lecture, ajuster le volume et naviguer entre les vidéos.

**Section sources**
- [videos/page.tsx](file://app/videos/page.tsx#L1-L273)
- [components/videos/VideoPlayerModal.tsx](file://components/videos/VideoPlayerModal.tsx#L1-L44)
- [services/videoService.ts](file://services/videoService.ts#L1-L221)

## Module Textes
Le module textes présente les écrits, articles et créations littéraires de l'auteur, avec un éditeur Markdown, des filtres par catégories et tags, et une visualisation en modal.

### Interface Utilisateur
L'interface du module textes comprend une liste de textes, des filtres par catégories et tags, une barre de recherche et un bouton de réinitialisation des filtres. L'utilisateur peut cliquer sur un texte pour l'ouvrir dans une modal avec le contenu rendu en Markdown.

### Fonctionnalités Spécifiques
La liste de textes affiche les textes avec leur titre, sous-titre, extrait et date de publication. L'éditeur Markdown permet de rédiger des textes avec une syntaxe enrichie. Les filtres avancés permettent de filtrer par catégories, tags et date de publication.

### Composants React
Les principaux composants React utilisés sont `TextCard`, `TextDetailModal`, `MarkdownRenderer`, `AdvancedFilters`, `CategoryBadge` et `TagBadge`. Le composant `TextCard` affiche un aperçu d'un texte, tandis que `TextDetailModal` permet de visualiser le contenu complet du texte.

### Services Backend
Le service `textService` gère les opérations CRUD sur les textes, y compris la création, la lecture, la mise à jour et la suppression. Le service `categoryService` gère les catégories, et le service `tagService` gère les tags associés aux textes.

### Interactions avec Supabase
Les textes sont stockés dans la table `texts` de Supabase, avec des métadonnées comme le titre, le sous-titre, le contenu, l'extrait, l'auteur, la date de publication et l'ID de la catégorie. Les tags sont gérés via la table `text_tags`, qui établit une relation many-to-many entre les textes et les tags.

### Exemple d'Utilisation
Lorsqu'un utilisateur clique sur un texte dans la liste, la modal `TextDetailModal` s'ouvre, affichant le contenu du texte rendu en Markdown. L'utilisateur peut alors lire le texte, voir les métadonnées (auteur, date de publication) et partager le texte.

**Section sources**
- [textes/page.tsx](file://app/textes/page.tsx#L1-L231)
- [components/texts/TextDetailModal.tsx](file://components/texts/TextDetailModal.tsx#L1-L82)
- [services/textService.ts](file://services/textService.ts#L1-L385)

## Module Applications
Le module applications présente les projets de développement et applications web de l'auteur, avec une intégration GitHub pour afficher les dépôts et les gists.

### Interface Utilisateur
L'interface du module applications comprend une liste de dépôts GitHub, des gists, des filtres par tags et une barre de recherche. L'utilisateur peut cliquer sur un dépôt ou un gist pour voir plus de détails.

### Fonctionnalités Spécifiques
L'intégration GitHub permet d'afficher les dépôts publics de l'auteur, avec des informations comme le nom, la description, le nombre d'étoiles et de forks. Les gists permettent de partager des snippets de code. Les filtres avancés permettent de filtrer par tags.

### Composants React
Les principaux composants React utilisés sont `RepositoryCard`, `RepositoryDetail`, `GistCard`, `GistDetail` et `AdvancedFilters`. Le composant `RepositoryCard` affiche un aperçu d'un dépôt GitHub, tandis que `RepositoryDetail` permet de voir plus de détails.

### Services Backend
Le service `githubService` gère l'intégration avec l'API GitHub, permettant de récupérer les dépôts et les gists de l'auteur. Le service `repositoryService` gère les opérations CRUD sur les dépôts, et le service `gistService` gère les opérations CRUD sur les gists.

### Interactions avec Supabase
Les dépôts et gists sont stockés dans les tables `repositories` et `gists` de Supabase, avec des métadonnées comme le nom, la description, l'URL et les tags. Les tags sont gérés via les tables `repository_tags` et `gist_tags`, qui établissent des relations many-to-many entre les dépôts/gists et les tags.

### Exemple d'Utilisation
Lorsqu'un utilisateur clique sur un dépôt dans la liste, la page de détail du dépôt s'ouvre, affichant plus d'informations sur le projet, le code source et les contributions. L'utilisateur peut alors explorer le code, voir les issues et les pull requests.

**Section sources**
- [applications/page.tsx](file://app/applications/page.tsx#L1-L200)
- [components/repositories/RepositoryCard.tsx](file://components/repositories/RepositoryCard.tsx#L1-L100)
- [services/githubService.ts](file://services/githubService.ts#L1-L200)

## Système d'Administration
Le système d'administration, accessible via `/admin`, permet la gestion du contenu et des migrations LQIP pour les photos.

### Interface Utilisateur
L'interface d'administration comprend des pages pour gérer les contenus de chaque module (musique, photos, vidéos, textes, applications), avec des formulaires pour créer, modifier et supprimer des éléments. La page de migration LQIP permet d'exécuter la génération de placeholders flous pour les photos existantes.

### Fonctionnalités Spécifiques
Le système d'administration permet de gérer tous les contenus du portfolio, avec des formulaires de création et d'édition, des listes de gestion et des boutons de suppression. La migration LQIP permet de générer automatiquement des placeholders flous pour les photos qui n'en ont pas encore.

### Composants React
Les principaux composants React utilisés sont `TrackListAdmin`, `PhotoListAdmin`, `VideoListAdmin`, `TextListAdmin`, `RepositoryListAdmin`, `GistListAdmin` et `MigrateLQIPPage`. Ces composants affichent des listes de gestion avec des boutons d'édition et de suppression.

### Services Backend
Les services backend utilisés sont les mêmes que pour les modules publics, mais avec des permissions d'administration pour effectuer des opérations CRUD. Le service `photoService` est utilisé pour la migration LQIP, en générant des placeholders flous pour les photos existantes.

### Interactions avec Supabase
Le système d'administration interagit avec toutes les tables de Supabase pour gérer les contenus. Les permissions d'administration permettent de lire, créer, mettre à jour et supprimer des éléments dans toutes les tables.

### Exemple d'Utilisation
Lorsqu'un administrateur accède à la page `/admin/migrate-lqip`, il peut cliquer sur le bouton "Démarrer la migration" pour exécuter la génération de LQIP pour toutes les photos sans placeholder flou. Le système traite les photos par batch, génère le LQIP et met à jour la base de données.

**Section sources**
- [admin/migrate-lqip/page.tsx](file://app/admin/migrate-lqip/page.tsx#L1-L196)
- [components/music/TrackListAdmin.tsx](file://components/music/TrackListAdmin.tsx#L1-L100)
- [components/photos/PhotoListAdmin.tsx](file://components/photos/PhotoListAdmin.tsx#L1-L100)

## Fonctionnalités Transversales
Le portfolio inclut plusieurs fonctionnalités transversales qui améliorent l'expérience utilisateur, comme la recherche globale, les filtres avancés et la gestion des favoris.

### Recherche Globale
La recherche globale permet de trouver des contenus dans tous les modules (musique, photos, vidéos, textes, applications) à partir d'une barre de recherche unique. La recherche utilise un algorithme de recherche floue pour trouver des correspondances même avec des fautes de frappe.

### Filtres Avancés
Les filtres avancés permettent de filtrer les contenus par tags, date de création, catégorie et ordre de tri. Les filtres sont disponibles dans chaque module et peuvent être combinés pour affiner les résultats.

### Gestion des Favoris
La gestion des favoris permet aux utilisateurs d'ajouter des contenus à leurs favoris en cliquant sur une icône d'étoile. Les favoris sont stockés localement dans le navigateur et peuvent être consultés dans la page `/favoris`.

### Composants React
Les principaux composants React utilisés sont `GlobalSearch`, `AdvancedFilters`, `BookmarkButton` et `useBookmarks`. Le composant `GlobalSearch` affiche la barre de recherche globale, tandis que `AdvancedFilters` affiche les filtres avancés.

### Services Backend
Le service `searchService` gère la recherche globale, en interrogeant toutes les tables de Supabase pour trouver des correspondances. Le hook `useBookmarks` gère la gestion des favoris, en stockant les IDs des contenus favoris dans le localStorage.

### Interactions avec Supabase
La recherche globale interroge toutes les tables de Supabase pour trouver des correspondances dans les champs de recherche (titre, description, contenu, etc.). Les favoris sont stockés localement dans le navigateur, sans interaction avec Supabase.

### Exemple d'Utilisation
Lorsqu'un utilisateur effectue une recherche dans la barre de recherche globale, le système affiche des suggestions en temps réel basées sur les résultats de recherche. L'utilisateur peut cliquer sur une suggestion pour accéder directement au contenu correspondant. Les favoris permettent de sauvegarder des contenus préférés pour un accès rapide ultérieur.

**Section sources**
- [favoris/page.tsx](file://app/favoris/page.tsx#L1-L372)
- [components/GlobalSearch.tsx](file://components/GlobalSearch.tsx#L1-L100)
- [components/AdvancedFilters.tsx](file://components/AdvancedFilters.tsx#L1-L301)
- [hooks/useBookmarks.ts](file://hooks/useBookmarks.ts#L1-L100)
- [lib/search.ts](file://lib/search.ts#L1-L200)

## Conclusion
Le portfolio présente un ensemble complet de modules multimédias, chacun avec une interface utilisateur intuitive, des fonctionnalités avancées et une intégration robuste avec Supabase. Les fonctionnalités transversales comme la recherche globale, les filtres avancés et la gestion des favoris améliorent l'expérience utilisateur et permettent une navigation fluide entre les différents types de contenu. Le système d'administration offre des outils puissants pour gérer le contenu et effectuer des tâches de maintenance comme la migration LQIP.