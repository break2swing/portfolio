# Contraintes CHECK de Base de Données

<cite>
**Fichiers référencés dans ce document**  
- [20250111_add_security_constraints.sql](file://supabase/migrations/20250111_add_security_constraints.sql)
- [TextUploadForm.tsx](file://components/texts/TextUploadForm.tsx)
- [MusicUploadForm.tsx](file://components/music/MusicUploadForm.tsx)
- [PhotoUploadForm.tsx](file://components/photos/PhotoUploadForm.tsx)
- [validators.ts](file://lib/validators.ts)
- [textService.ts](file://services/textService.ts)
- [musicService.ts](file://services/musicService.ts)
- [photoService.ts](file://services/photoService.ts)
- [urlValidation.ts](file://lib/urlValidation.ts)
</cite>

## Table des matières
1. [Introduction](#introduction)
2. [Contraintes par Table](#contraintes-par-table)
   - [Table texts](#table-texts)
   - [Table categories](#table-categories)
   - [Table tags](#table-tags)
   - [Table photos](#table-photos)
   - [Table music_tracks](#table-music_tracks)
   - [Table videos](#table-videos)
3. [Interaction avec les Validations Côté Client](#interaction-avec-les-validations-côté-client)
4. [Gestion des Erreurs dans les Services](#gestion-des-erreurs-dans-les-services)
5. [Conclusion](#conclusion)

## Introduction
Ce document détaille les contraintes CHECK ajoutées dans la migration `20250111_add_security_constraints.sql` pour renforcer l'intégrité des données au niveau de la base de données. Ces contraintes visent à garantir que les données insérées ou mises à jour respectent des règles strictes de format, de longueur et de validité, empêchant ainsi l'introduction de données invalides ou malformées. Le document présente chaque contrainte par table, explique son rôle dans la prévention des données corrompues, décrit son interaction avec les validations côté client dans les composants frontend, et illustre la gestion des erreurs dans les services backend.

**Section sources**
- [20250111_add_security_constraints.sql](file://supabase/migrations/20250111_add_security_constraints.sql)

## Contraintes par Table

### Table texts
La table `texts` contient des contraintes strictes pour garantir la qualité des contenus textuels.

**Contraintes de longueur :**
- **Titre** : Doit avoir entre 1 et 200 caractères.
- **Contenu** : Doit avoir entre 1 et 50 000 caractères.
- **Sous-titre** : Optionnel, mais si présent, doit avoir entre 1 et 300 caractères.
- **Extrait** : Optionnel, mais ne peut pas dépasser 500 caractères.
- **Auteur** : Optionnel, mais ne peut pas dépasser 100 caractères.

**Contraintes de format :**
- **Slug** : Si la colonne existe, elle doit correspondre à l'expression régulière `^[a-z0-9-]+$`, garantissant un format URL-safe avec des caractères alphanumériques et des tirets uniquement.

Ces contraintes assurent que les textes publiés sont bien formés, avec des métadonnées concises et des contenus de longueur raisonnable, tout en permettant des slugs propres pour les URLs.

**Section sources**
- [20250111_add_security_constraints.sql](file://supabase/migrations/20250111_add_security_constraints.sql#L27-L63)

### Table categories
La table `categories` applique des contraintes pour maintenir la cohérence des catégories.

**Contraintes de longueur :**
- **Nom** : Doit avoir entre 1 et 100 caractères.
- **Description** : Optionnelle, mais ne peut pas dépasser 500 caractères.

**Contraintes de format :**
- **Slug** : Doit correspondre à l'expression régulière `^[a-z0-9-]+$`, assurant un format URL-safe.
- **Couleur** : Doit correspondre à l'expression régulière `^#[0-9A-Fa-f]{6}$`, garantissant un format de couleur hexadécimal valide (ex: `#3b82f6`).

Ces contraintes garantissent que les catégories ont des noms significatifs, des descriptions courtes, des slugs propres pour le routage, et des couleurs valides pour l'interface utilisateur.

**Section sources**
- [20250111_add_security_constraints.sql](file://supabase/migrations/20250111_add_security_constraints.sql#L66-L88)

### Table tags
La table `tags` impose des règles strictes pour les étiquettes.

**Contraintes de longueur :**
- **Nom** : Doit avoir entre 1 et 50 caractères.

**Contraintes de format :**
- **Slug** : Doit correspondre à l'expression régulière `^[a-z0-9-]+$`.
- **Couleur** : Optionnelle, mais si présente, doit être un format hexadécimal valide (`^#[0-9A-Fa-f]{6}$`).

Ces contraintes maintiennent des tags courts, avec des slugs propres et des couleurs valides, ce qui est essentiel pour une interface cohérente et une bonne expérience utilisateur.

**Section sources**
- [20250111_add_security_constraints.sql](file://supabase/migrations/20250111_add_security_constraints.sql#L89-L107)

### Table photos
La table `photos` contient des contraintes pour les métadonnées des images.

**Contraintes de longueur :**
- **Titre** : Doit avoir entre 1 et 200 caractères.
- **Description** : Optionnelle, mais ne peut pas dépasser 1000 caractères.

**Contraintes de format d'URL :**
- **image_url** : Doit commencer par `http://` ou `https://` (expression régulière `^https?://`). Cela garantit que l'URL est bien formée et sécurisée.

Ces contraintes assurent que les photos ont des titres et descriptions appropriés, et que les URLs pointent vers des ressources accessibles via HTTP(S).

**Section sources**
- [20250111_add_security_constraints.sql](file://supabase/migrations/20250111_add_security_constraints.sql#L109-L126)

### Table music_tracks
La table `music_tracks` applique des contraintes similaires pour les morceaux de musique.

**Contraintes de longueur :**
- **Titre** : Doit avoir entre 1 et 200 caractères.
- **Artiste** : Optionnel, mais ne peut pas dépasser 200 caractères.
- **Album** : Optionnel, mais ne peut pas dépasser 200 caractères.

**Contraintes de format d'URL :**
- **audio_url** : Doit commencer par `http://` ou `https://`.
- **cover_image_url** : Optionnelle, mais si présente, doit commencer par `http://` ou `https://`.

**Contraintes de valeur :**
- **Durée** : Si présente, doit être un nombre positif ou nul.

Ces contraintes garantissent que les métadonnées des morceaux sont valides, que les URLs des fichiers audio et des couvertures sont correctement formatées, et que la durée est logique.

**Section sources**
- [20250111_add_security_constraints.sql](file://supabase/migrations/20250111_add_security_constraints.sql#L128-L160)

### Table videos
La table `videos` suit un schéma similaire pour les vidéos.

**Contraintes de longueur :**
- **Titre** : Doit avoir entre 1 et 200 caractères.
- **Description** : Optionnelle, mais ne peut pas dépasser 1000 caractères.

**Contraintes de format d'URL :**
- **video_url** : Doit commencer par `http://` ou `https://`.
- **thumbnail_url** : Optionnelle, mais si présente, doit commencer par `http://` ou `https://`.

**Contraintes de valeur :**
- **Durée** : Si présente, doit être un nombre positif ou nul.

Ces contraintes assurent la validité des métadonnées vidéo et des URLs, garantissant que les ressources sont accessibles via des protocoles web standards.

**Section sources**
- [20250111_add_security_constraints.sql](file://supabase/migrations/20250111_add_security_constraints.sql#L162-L189)

## Interaction avec les Validations Côté Client
Les contraintes côté base de données sont complétées par des validations côté client dans les composants de formulaire pour offrir une expérience utilisateur fluide.

**TextUploadForm :**
- Utilise `zod` pour valider les données avant l'envoi.
- Le schéma `createTextSchema` valide les mêmes règles que les contraintes SQL (longueur du titre, contenu, etc.).
- Si la validation échoue, des messages d'erreur sont affichés immédiatement sans requête réseau.

**MusicUploadForm et PhotoUploadForm :**
- Valident les fichiers (type, taille) avant l'upload.
- Les champs de texte (titre, artiste, etc.) sont validés côté client.
- L'upload est bloqué si les validations échouent.

Cette double validation (client + serveur) permet :
1. Une rétroaction instantanée à l'utilisateur.
2. Une sécurité renforcée contre les tentatives de contournement.
3. Une expérience utilisateur optimale en évitant les erreurs de base de données inattendues.

**Section sources**
- [TextUploadForm.tsx](file://components/texts/TextUploadForm.tsx)
- [MusicUploadForm.tsx](file://components/music/MusicUploadForm.tsx)
- [PhotoUploadForm.tsx](file://components/photos/PhotoUploadForm.tsx)
- [validators.ts](file://lib/validators.ts)

## Gestion des Erreurs dans les Services
Les services backend gèrent les erreurs de contraintes avec des blocs `try/catch` pour offrir une expérience utilisateur fluide.

**Exemple d'erreur de base de données :**
Si un utilisateur tente d'insérer un titre de 201 caractères dans `texts`, la base de données renvoie une erreur comme :
```
error: new row for relation "texts" violates check constraint "texts_title_length_check"
```

**Gestion dans les services :**
- **textService.ts** : Capture l'erreur, la log, et la renvoie au frontend.
- **musicService.ts** et **photoService.ts** : Fait de même, avec une validation préalable des URLs via `validateMediaUrl`.
- Le frontend (dans `onSubmit`) affiche un toast avec un message d'erreur clair (ex: "Titre trop long").

**Stratégie de gestion :**
1. **Validation préalable** : Vérifier les URLs et les formats avant l'insertion.
2. **Capture d'erreur** : Utiliser `try/catch` pour intercepter les erreurs de base de données.
3. **Message utilisateur** : Transformer les erreurs techniques en messages compréhensibles.
4. **Nettoyage** : En cas d'échec, supprimer les fichiers uploadés (ex: audio, image) pour éviter les orphelins.

Cela garantit que même si une erreur de contrainte survient, l'utilisateur reçoit un feedback clair et le système reste dans un état cohérent.

**Section sources**
- [textService.ts](file://services/textService.ts)
- [musicService.ts](file://services/musicService.ts)
- [photoService.ts](file://services/photoService.ts)
- [urlValidation.ts](file://lib/urlValidation.ts)

## Conclusion
Les contraintes CHECK ajoutées dans la migration `20250111_add_security_constraints.sql` forment une couche essentielle de sécurité et d'intégrité des données. Elles garantissent que les données insérées respectent des règles strictes de format, de longueur et de validité. Combinées avec les validations côté client et une gestion robuste des erreurs dans les services, elles offrent une expérience utilisateur fluide tout en protégeant la base de données contre les données invalides. Cette approche en plusieurs couches (client, service, base de données) est cruciale pour la fiabilité et la sécurité de l'application.