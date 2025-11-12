# Services

<cite>
**Fichiers référencés dans ce document**   
- [services/authService.ts](file://services/authService.ts)
- [services/photoService.ts](file://services/photoService.ts)
- [services/musicService.ts](file://services/musicService.ts)
- [services/textService.ts](file://services/textService.ts)
- [services/videoService.ts](file://services/videoService.ts)
- [services/gistService.ts](file://services/gistService.ts)
- [services/repositoryService.ts](file://services/repositoryService.ts)
- [services/storageService.ts](file://services/storageService.ts)
- [lib/cache.ts](file://lib/cache.ts)
- [lib/supabaseClient.ts](file://lib/supabaseClient.ts)
- [app/admin/photos/page.tsx](file://app/admin/photos/page.tsx)
- [app/musique/page.tsx](file://app/musique/page.tsx)
</cite>

## Table des matières
1. [Introduction](#introduction)
2. [Architecture des Services](#architecture-des-services)
3. [Analyse des Fichiers de Service](#analyse-des-fichiers-de-service)
4. [Pattern de Conception Uniforme](#pattern-de-conception-uniforme)
5. [Exemples d'Utilisation dans les Composants React](#exemples-dutilisation-dans-les-composants-react)
6. [Gestion des Erreurs et Reconnexion](#gestion-des-erreurs-et-reconnexion)
7. [Conclusion](#conclusion)

## Introduction

La couche de service du projet Portfolio joue un rôle central dans l'abstraction de la complexité des appels API vers Supabase, en fournissant une interface propre et cohérente aux composants React. Chaque service correspond à une entité métier spécifique (photos, musique, textes, etc.) et suit un pattern de conception uniforme qui garantit la cohérence, la maintenabilité et la réutilisabilité du code. Ce document analyse en détail cette couche, en expliquant le rôle de chaque fichier, le pattern de conception utilisé, et comment les services interagissent avec les composants frontend.

## Architecture des Services

Les services sont organisés dans le répertoire `services/` et suivent une structure modulaire basée sur les entités du domaine. Chaque service expose un ensemble de méthodes asynchrones qui encapsulent les opérations CRUD (Create, Read, Update, Delete) sur les données correspondantes. Ces services dépendent de deux composants clés :
- `lib/supabaseClient.ts` : Fournit une instance configurée du client Supabase pour les appels API.
- `lib/cache.ts` : Implémente un système de cache côté client avec TTL (Time To Live) pour réduire les appels API redondants.

Cette architecture permet de découpler la logique métier de l'interface utilisateur, facilitant ainsi les tests, la maintenance et l'évolution du code.

**Sources des diagrammes**
- [services/authService.ts](file://services/authService.ts)
- [lib/supabaseClient.ts](file://lib/supabaseClient.ts)
- [lib/cache.ts](file://lib/cache.ts)

## Analyse des Fichiers de Service

### authService.ts

Le service `authService` gère l'authentification des utilisateurs via Supabase Auth. Il expose des méthodes pour :
- Obtenir la session active (`getSession`)
- Se connecter (`signIn`)
- Se déconnecter (`signOut`)
- Écouter les changements d'état d'authentification (`onAuthStateChange`)

Toutes les méthodes retournent un objet `{data, error}` ou `{session, error}`, permettant une gestion d'erreur cohérente.

**Sources des sections**
- [services/authService.ts](file://services/authService.ts#L1-L32)

### photoService.ts

Le service `photoService` gère les opérations liées aux photos. Il inclut des méthodes pour :
- Récupérer toutes les photos (`getAllPhotos`)
- Récupérer une photo par ID (`getPhotoById`)
- Créer, mettre à jour et supprimer des photos (`createPhoto`, `updatePhoto`, `deletePhoto`)
- Gérer l'ordre d'affichage (`updateDisplayOrder`)
- Créer une photo avec des tags associés (`createPhotoWithTags`)

Le service utilise le cache pour les appels fréquents comme `getAllPhotosWithTags`, avec une durée de vie de 5 minutes.

**Sources des sections**
- [services/photoService.ts](file://services/photoService.ts#L1-L221)

### musicService.ts

Le service `musicService` gère les morceaux de musique. Il offre des fonctionnalités similaires à `photoService`, avec des méthodes pour :
- Récupérer tous les morceaux (`getAllTracks`)
- Récupérer un morceau par ID (`getTrackById`)
- Créer, mettre à jour et supprimer des morceaux (`createTrack`, `updateTrack`, `deleteTrack`)
- Gérer l'ordre d'affichage (`updateDisplayOrder`)
- Créer un morceau avec des tags (`createTrackWithTags`)

Il inclut également une validation des URLs audio et de couverture via `validateMediaUrl`.

**Sources des sections**
- [services/musicService.ts](file://services/musicService.ts#L1-L301)

### textService.ts

Le service `textService` gère les textes publiés. En plus des opérations CRUD standard, il fournit des méthodes enrichies avec des métadonnées :
- `getTextsWithMetadata` : Récupère les textes avec leur catégorie et tags
- `getTextsByCategory` : Filtre par catégorie
- `getTextsByTag` : Filtre par tag
- `searchTexts` : Recherche plein texte avec configuration française

Le service utilise le cache pour les appels fréquents et invalide automatiquement le cache après toute modification.

**Sources des sections**
- [services/textService.ts](file://services/textService.ts#L1-L385)

### videoService.ts

Le service `videoService` gère les vidéos, avec des méthodes similaires aux autres services. Il inclut une validation des URLs vidéo et de miniature, et suit le même pattern de retour `{data, error}`.

**Sources des sections**
- [services/videoService.ts](file://services/videoService.ts#L1-L268)

### gistService.ts

Le service `gistService` gère les gists (extraits de code). Il inclut des fonctionnalités avancées comme :
- Récupération des gists avec leurs fichiers (`getGistById`)
- Création de gists avec plusieurs fichiers (`createGist`)
- Mise à jour des fichiers d'un gist (`updateGistFiles`)
- Gestion de l'ordre d'affichage (`updateGistOrder`)

Il utilise un système de logging via `createLogger` pour le débogage.

**Sources des sections**
- [services/gistService.ts](file://services/gistService.ts#L1-L376)

### repositoryService.ts

Le service `repositoryService` gère les dépôts de code, avec un support pour deux types de sources :
- Dépôts locaux (stockés dans Supabase Storage)
- Dépôts GitHub (via l'API GitHub)

Il délègue certaines opérations au `githubService` et au `storageService`, démontrant une bonne séparation des préoccupations.

**Sources des sections**
- [services/repositoryService.ts](file://services/repositoryService.ts#L1-L460)

### storageService.ts

Le service `storageService` gère les opérations de stockage dans Supabase Storage. Il inclut des fonctionnalités spécifiques :
- Compression d'images avant upload (`compressImage`)
- Génération de LQIP (Low-Quality Image Placeholder) pour les photos
- Upload et téléchargement de fichiers
- Gestion des URL publiques

Il est utilisé par d'autres services comme `photoService` pour les opérations de fichiers.

**Sources des sections**
- [services/storageService.ts](file://services/storageService.ts#L1-L310)

## Pattern de Conception Uniforme

Tous les services du projet suivent un pattern de conception uniforme qui garantit la cohérence et la prévisibilité du code. Ce pattern comprend plusieurs éléments clés :

### Retour Standardisé `{data, error}`

Toutes les méthodes asynchrones retournent un objet avec deux propriétés :
- `data` : Les données retournées (peut être `null` en cas d'erreur)
- `error` : Un objet d'erreur (peut être `null` en cas de succès)

Ce pattern simplifie la gestion d'erreur dans les composants React, car le code appelant peut toujours vérifier la présence d'une erreur avant d'utiliser les données.

### Gestion Intégrée du Cache

Les services utilisent le module `lib/cache.ts` pour mettre en cache les résultats des appels fréquents. Le cache est implémenté comme une classe `SimpleCache` avec :
- Stockage en mémoire et dans `sessionStorage`
- TTL (Time To Live) configurable
- Invalidation par clé ou par pattern

Les services invalident automatiquement le cache après toute modification (create, update, delete), garantissant ainsi la cohérence des données.

### Utilisation de supabaseClient.ts

Tous les services importent `supabaseClient` depuis `lib/supabaseClient.ts`, qui fournit une instance singleton du client Supabase. Cela évite la création multiple d'instances et centralise la configuration de l'authentification.

### Validation et Sécurité

Les services incluent des mécanismes de validation et de sécurité :
- Vérification de l'authentification (`getUser`)
- Validation des URLs (`validateMediaUrl`)
- Limitation de taux (`checkRateLimit`)
- Journalisation des opérations (`createLogger`)

Ces mécanismes sont intégrés directement dans les méthodes de service, ce qui les rend transparents pour les composants frontend.

**Sources des sections**
- [lib/cache.ts](file://lib/cache.ts#L1-L211)
- [lib/supabaseClient.ts](file://lib/supabaseClient.ts#L1-L344)

## Exemples d'Utilisation dans les Composants React

Les services sont utilisés directement dans les composants React, comme le montre l'exemple de la page d'administration des photos :

```tsx
const fetchPhotos = async () => {
  setLoading(true);
  try {
    const { photos: data, error } = await photoService.getAllPhotos();

    if (error) throw error;

    setPhotos(data || []);
  } catch (error) {
    console.error('Error fetching photos:', error);
  } finally {
    setLoading(false);
  }
};
```

Dans cet exemple :
1. Le composant appelle `photoService.getAllPhotos()`
2. Il reçoit un objet `{photos, error}`
3. Il vérifie `error` avant de mettre à jour l'état
4. Il gère les états de chargement via `setLoading`

Un autre exemple est la page de musique, qui appelle `musicService.getTracks()` pour afficher la liste des morceaux. Cette approche permet aux composants de se concentrer sur la présentation, tandis que les services gèrent la logique métier et les appels API.

**Sources des sections**
- [app/admin/photos/page.tsx](file://app/admin/photos/page.tsx#L47-L60)
- [app/musique/page.tsx](file://app/musique/page.tsx)

## Gestion des Erreurs et Reconnexion

La gestion des erreurs est intégrée dans chaque service, avec plusieurs niveaux de protection :
- Vérification de l'authentification avant toute opération
- Validation des entrées (URLs, données)
- Capture des erreurs Supabase
- Journalisation des erreurs

En cas d'erreur d'authentification, le service retourne un objet d'erreur avec un code `NOT_AUTHENTICATED`, ce qui permet au composant de rediriger l'utilisateur vers la page de login. Le système de cache gère également la reconnexion transparente, car il stocke les données dans `sessionStorage` et les restaure automatiquement après un rechargement de page.

**Sources des sections**
- [services/authService.ts](file://services/authService.ts)
- [services/photoService.ts](file://services/photoService.ts)
- [lib/cache.ts](file://lib/cache.ts)

## Conclusion

La couche de service du projet Portfolio est bien conçue, avec une architecture modulaire, un pattern de conception uniforme, et une bonne séparation des préoccupations. Les services abstraient efficacement la complexité des appels Supabase, fournissant une interface propre et cohérente aux composants React. L'utilisation du cache, la validation des données, et la gestion des erreurs sont intégrées de manière transparente, ce qui améliore la performance et la robustesse de l'application. Cette architecture facilite la maintenance et l'évolution du code, et peut servir de modèle pour d'autres projets similaires.