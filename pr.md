# Phase 2 — Intégration Bookmark + Filtres avancés

## Résumé
- Intégration du bouton Favoris sur photos, vidéos et audios
- Création d'un composant AdvancedFilters réutilisable
- Création d'un hook useFilters pour la logique de filtrage/tri
- Intégration des filtres avancés dans les pages Textes et Photos

## Changements principaux

### components/photos/PhotoCard.tsx
- Ajout de BookmarkButton dans l'overlay (coin supérieur droit) au survol

### components/videos/VideoCard.tsx
- Ajout de BookmarkButton dans l'overlay (coin supérieur droit) au survol

### components/music/TrackList.tsx
- Ajout de BookmarkButton à côté de la durée de piste

### components/AdvancedFilters.tsx
- Nouveau composant de filtres:
  - Recherche textuelle
  - Tags multi-sélection
  - Plage de dates (optionnel)
  - Tri (date, titre)
  - Badge de compte de filtres actifs et compteur résultats

### hooks/useFilters.ts
- Nouveau hook de filtrage/tri:
  - Recherche multi-champs
  - Filtrage par tags et dates
  - Tri par date/titre
  - Extraction des tags disponibles

### app/textes/page.tsx
- Intégration AdvancedFilters + useFilters
- Conservation du filtre Catégorie (complémentaire au hook)
- Nettoyage des imports et logique redondante

### app/photos/page.tsx
- Intégration AdvancedFilters + useFilters
- Désactivation de la plage de dates (non pertinente)
- Nettoyage de l'ancien système de recherche/filtrage manuel

## Comportements attendus

### Favoris
- Le clic sur BookmarkButton ajoute/retire l'élément des favoris avec feedback visuel et toast
- Types pris en charge: photo, video, audio

### Filtres avancés
- Recherche instantanée sur les champs indiqués
- Sélection multi-tags (logique AND)
- Tri par date et/ou titre
- Indicateur du nombre de résultats et réinitialisation rapide

### Pages
- Textes: AdvancedFilters + filtre Catégorie (séparé), liste virtualisée si volumineuse
- Photos: AdvancedFilters (tags, recherche, tri), liste/virtualisée selon volume

## Tests et validation

### Photos
- Ouvrir /photos, tester la recherche par titre/description
- Sélectionner plusieurs tags et vérifier la logique AND
- Tester le tri (Plus récent/Plus ancien/Titre A-Z/Z-A)
- Vérifier Bookmark sur chaque vignette

### Vidéos
- Ouvrir /videos, vérifier l'affichage du bouton favoris au survol
- Tester le toggle favoris sur plusieurs vidéos

### Audio
- Ouvrir /musique, vérifier le bouton favoris sur chaque piste

### Textes
- Ouvrir /textes, tester la recherche, tri, tags et filtre Catégorie
- Vérifier la mise à jour du compteur résultats

### Accessibilité
- Vérifier labels ARIA sur boutons et inputs

### Compatibilité
- Vérifier que la page charge sans la table photo_tags (fallback prévu)

## Risques et impacts
- Nettoyage des anciens filtres dans /photos et /textes, s'assurer qu'aucune dépendance UI n'était requise ailleurs
- AdvancedFilters s'appuie sur date-fns (déjà présent) et composants UI existants

## Checklist
- [x] BookmarkButton intégré: Photo, Vidéo, Audio
- [x] AdvancedFilters créé
- [x] useFilters créé
- [x] Intégration filtres avancés: Textes
- [x] Intégration filtres avancés: Photos
- [x] Nettoyage des imports inutilisés
- [x] Conformité conventions AGENTS.md

## À noter
- Aucun changement de schéma Supabase
- Pas de rupture API côté services
- Composant AdvancedFilters est générique et réutilisable
