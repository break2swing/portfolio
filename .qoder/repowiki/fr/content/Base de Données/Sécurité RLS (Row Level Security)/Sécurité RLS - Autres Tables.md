# Sécurité RLS - Autres Tables

<cite>
**Fichiers référencés dans ce document**
- [20251105115814_create_photos_table.sql](file://supabase/migrations/20251105115814_create_photos_table.sql)
- [20251106095111_create_music_tracks_table.sql](file://supabase/migrations/20251106095111_create_music_tracks_table.sql)
- [20251108071024_create_videos_system.sql](file://supabase/migrations/20251108071024_create_videos_system.sql)
- [20250107_create_texts_system.sql](file://supabase/migrations/20250107_create_texts_system.sql)
- [20251111050910_create_playlists_system.sql](file://supabase/migrations/20251111050910_create_playlists_system.sql)
- [photoService.ts](file://services/photoService.ts)
- [musicService.ts](file://services/musicService.ts)
- [videoService.ts](file://services/videoService.ts)
- [textService.ts](file://services/textService.ts)
- [supabaseClient.ts](file://lib/supabaseClient.ts)
</cite>

## Table des matières
1. [Introduction](#introduction)
2. [Analyse des politiques RLS existantes](#analyse-des-politiques-rls-existantes)
3. [Politiques RLS standardisées proposées](#politiques-rls-standardisées-proposées)
4. [Implémentation pour la table 'videos'](#implémentation-pour-la-table-videos)
5. [Implémentation pour la table 'texts'](#implémentation-pour-la-table-texts)
6. [Implications pour les services backend](#implications-pour-les-services-backend)
7. [Conclusion](#conclusion)

## Introduction

Ce document présente une analyse des politiques de sécurité au niveau des lignes (RLS - Row Level Security) pour les différentes tables du système de médias. Bien que certaines tables aient déjà des politiques RLS définies, d'autres nécessitent une implémentation cohérente basée sur le pattern observé. L'objectif est de proposer une politique standard garantissant une sécurité cohérente à travers toutes les entités média, en s'appuyant sur l'analyse des tables existantes comme `photos` et `music_tracks`.

**Section sources**
- [20251105115814_create_photos_table.sql](file://supabase/migrations/20251105115814_create_photos_table.sql)
- [20251106095111_create_music_tracks_table.sql](file://supabase/migrations/20251106095111_create_music_tracks_table.sql)

## Analyse des politiques RLS existantes

L'analyse des migrations SQL et des services backend révèle un pattern cohérent dans l'implémentation des politiques RLS. Pour la table `photos`, les politiques sont définies pour permettre une lecture publique via `USING (true)` pour la politique SELECT, tandis que les opérations d'insertion, de mise à jour et de suppression sont réservées aux utilisateurs authentifiés. De même, pour la table `music_tracks`, la politique SELECT permet une lecture publique, mais les autres opérations nécessitent une authentification.

La table `videos` montre une évolution de ce pattern avec une politique plus restrictive : l'insertion, la mise à jour et la suppression nécessitent non seulement l'authentification mais aussi que l'utilisateur soit le propriétaire du contenu via `auth.uid() = user_id`. Cette approche renforce la sécurité en liant explicitement les actions au propriétaire du contenu. La table `texts` va encore plus loin avec une politique SELECT qui distingue entre les textes publiés (visibles par tous) et les textes non publiés (visibles uniquement par le propriétaire), démontrant une sophistication accrue dans la gestion des accès.

**Section sources**
- [20251105115814_create_photos_table.sql](file://supabase/migrations/20251105115814_create_photos_table.sql#L36-L59)
- [20251106095111_create_music_tracks_table.sql](file://supabase/migrations/20251106095111_create_music_tracks_table.sql#L53-L74)
- [20251108071024_create_videos_system.sql](file://supabase/migrations/20251108071024_create_videos_system.sql#L51-L74)
- [20250107_create_texts_system.sql](file://supabase/migrations/20250107_create_texts_system.sql#L169-L191)

## Politiques RLS standardisées proposées

Sur la base du pattern observé, une politique RLS standardisée est proposée pour toutes les tables média du système. Cette politique repose sur trois principes fondamentaux : lecture publique pour les contenus publiés, écriture réservée au propriétaire, et suppression restreinte au propriétaire. Pour les tables comme `videos` et `texts`, la distinction entre contenu publié et non publié est cruciale, permettant une visibilité publique tout en protégeant les brouillons.

La politique SELECT doit permettre à tous les utilisateurs (authentifiés ou non) de lire les contenus publiés, en utilisant `USING (is_published = true)` pour les tables qui ont un champ `is_published`. Pour les tables sans ce champ, comme `photos` et `music_tracks`, la politique SELECT peut rester ouverte avec `USING (true)`. Les politiques INSERT, UPDATE et DELETE doivent toutes vérifier que l'utilisateur est authentifié et que son `user_id` correspond à celui du propriétaire du contenu, assurant ainsi que seuls les propriétaires peuvent modifier ou supprimer leurs propres contenus.

**Section sources**
- [20251105115814_create_photos_table.sql](file://supabase/migrations/20251105115814_create_photos_table.sql#L36-L40)
- [20251108071024_create_videos_system.sql](file://supabase/migrations/20251108071024_create_videos_system.sql#L58-L74)
- [20250107_create_texts_system.sql](file://supabase/migrations/20250107_create_texts_system.sql#L169-L191)

## Implémentation pour la table 'videos'

Pour la table `videos`, les politiques RLS doivent être implémentées conformément au pattern standardisé. La politique SELECT permet une lecture publique de tous les contenus, tandis que les politiques INSERT, UPDATE et DELETE sont restreintes aux utilisateurs authentifiés et propriétaires du contenu. Voici un exemple de code SQL pour créer ces politiques :

```sql
-- Activer RLS sur la table videos
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Politique SELECT : lecture publique pour tous
CREATE POLICY "Lecture publique des vidéos"
  ON videos FOR SELECT
  TO anon, authenticated
  USING (true);

-- Politique INSERT : réservée aux utilisateurs authentifiés et propriétaires
CREATE POLICY "Insertion réservée aux propriétaires"
  ON videos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Politique UPDATE : réservée aux utilisateurs authentifiés et propriétaires
CREATE POLICY "Mise à jour réservée aux propriétaires"
  ON videos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique DELETE : réservée aux utilisateurs authentifiés et propriétaires
CREATE POLICY "Suppression réservée aux propriétaires"
  ON videos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

**Section sources**
- [20251108071024_create_videos_system.sql](file://supabase/migrations/20251108071024_create_videos_system.sql#L48-L74)

## Implémentation pour la table 'texts'

Pour la table `texts`, les politiques RLS doivent tenir compte du champ `is_published` pour différencier les contenus publiés des brouillons. La politique SELECT permet une lecture publique des textes publiés, tandis que les utilisateurs authentifiés peuvent également lire leurs propres textes non publiés. Les politiques INSERT, UPDATE et DELETE sont restreintes aux propriétaires. Voici un exemple de code SQL pour créer ces politiques :

```sql
-- Activer RLS sur la table texts
ALTER TABLE texts ENABLE ROW LEVEL SECURITY;

-- Politique SELECT : lecture publique des textes publiés
CREATE POLICY "Lecture publique des textes publiés"
  ON texts FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

-- Politique SELECT : lecture des textes propres par les utilisateurs authentifiés
CREATE POLICY "Lecture des textes propres"
  ON texts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Politique INSERT : réservée aux utilisateurs authentifiés et propriétaires
CREATE POLICY "Insertion réservée aux propriétaires"
  ON texts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Politique UPDATE : réservée aux utilisateurs authentifiés et propriétaires
CREATE POLICY "Mise à jour réservée aux propriétaires"
  ON texts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique DELETE : réservée aux utilisateurs authentifiés et propriétaires
CREATE POLICY "Suppression réservée aux propriétaires"
  ON texts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

**Section sources**
- [20250107_create_texts_system.sql](file://supabase/migrations/20250107_create_texts_system.sql#L168-L191)

## Implications pour les services backend

L'implémentation de politiques RLS strictes a des implications significatives pour les services backend. Chaque service, comme `photoService`, `musicService`, `videoService` et `textService`, doit inclure le `user_id` lors de la création d'un enregistrement. Cela est généralement réalisé en récupérant l'utilisateur actuel via `supabaseClient.auth.getUser()` et en l'ajoutant aux données d'insertion. Cette pratique garantit que chaque enregistrement est correctement associé à son propriétaire.

De plus, les services doivent gérer les erreurs RLS de manière appropriée, en fournissant des messages d'erreur clairs aux utilisateurs. Par exemple, si un utilisateur tente de modifier un contenu qu'il ne possède pas, le service doit intercepter l'erreur et afficher un message indiquant qu'il n'a pas les autorisations nécessaires. Cela améliore l'expérience utilisateur tout en maintenant la sécurité du système.

**Section sources**
- [photoService.ts](file://services/photoService.ts#L107-L114)
- [musicService.ts](file://services/musicService.ts#L99-L132)
- [videoService.ts](file://services/videoService.ts#L83-L114)
- [textService.ts](file://services/textService.ts#L54-L86)

## Conclusion

L'analyse des politiques RLS existantes révèle un pattern cohérent qui peut être standardisé pour toutes les tables média du système. En appliquant une politique de lecture publique pour les contenus publiés et de restriction stricte pour les opérations d'écriture et de suppression au propriétaire du contenu, on garantit une sécurité cohérente et robuste. L'implémentation de ces politiques pour les tables `videos` et `texts` doit suivre ce pattern, en tenant compte des spécificités de chaque table, comme le champ `is_published` pour les textes. Les services backend doivent être conçus pour inclure systématiquement le `user_id` lors de la création d'enregistrements, assurant ainsi l'intégrité des politiques RLS.

**Section sources**
- [20251105115814_create_photos_table.sql](file://supabase/migrations/20251105115814_create_photos_table.sql)
- [20251106095111_create_music_tracks_table.sql](file://supabase/migrations/20251106095111_create_music_tracks_table.sql)
- [20251108071024_create_videos_system.sql](file://supabase/migrations/20251108071024_create_videos_system.sql)
- [20250107_create_texts_system.sql](file://supabase/migrations/20250107_create_texts_system.sql)
- [photoService.ts](file://services/photoService.ts)
- [musicService.ts](file://services/musicService.ts)
- [videoService.ts](file://services/videoService.ts)
- [textService.ts](file://services/textService.ts)