# Prompt pour Bolt : Exécuter la migration Supabase pour les playlists

## Contexte
Le projet utilise Supabase comme backend. Une migration SQL a été créée pour ajouter le système de playlists personnalisées, mais elle n'a pas pu être exécutée automatiquement via `supabase db push` à cause d'une erreur dans une migration précédente.

## Objectif
Exécuter la migration SQL `20251111050910_create_playlists_system.sql` directement dans la base de données Supabase distante.

## Fichier de migration
Le fichier se trouve à : `supabase/migrations/20251111050910_create_playlists_system.sql`

## Méthodes possibles

### Méthode 1 : Via Supabase Dashboard (Recommandée)
1. Aller sur https://app.supabase.com
2. Sélectionner le projet "portfolio" (project-ref: rdfrjkcdhnfmryygezph)
3. Aller dans **SQL Editor**
4. Cliquer sur **New Query**
5. Copier-coller le contenu complet du fichier `supabase/migrations/20251111050910_create_playlists_system.sql`
6. Cliquer sur **Run** (ou Ctrl+Enter)
7. Vérifier qu'il n'y a pas d'erreurs dans les résultats

### Méthode 2 : Via Supabase CLI avec psql
1. Récupérer la connection string depuis Supabase Dashboard :
   - Settings > Database > Connection string
   - Utiliser le format "Direct connection" (pas le pooler)
   - Format : `postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`
2. Exécuter :
```bash
psql "postgresql://postgres:[PASSWORD]@db.rdfrjkcdhnfmryygezph.supabase.co:5432/postgres" -f supabase/migrations/20251111050910_create_playlists_system.sql
```

### Méthode 3 : Via Supabase CLI (si les migrations précédentes sont corrigées)
1. Corriger l'erreur dans `20250107_create_texts_system.sql` (duplicate key sur tags_slug_key)
2. Réessayer : `supabase db push --yes`

## Vérification du succès
Après l'exécution, vérifier que les tables ont été créées :
```sql
-- Vérifier que les tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('playlists', 'playlist_tracks');

-- Vérifier les politiques RLS
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('playlists', 'playlist_tracks');
```

## Contenu de la migration
La migration crée :
- Table `playlists` avec les colonnes : id, name, description, user_id, is_public, display_order, created_at, updated_at
- Table `playlist_tracks` avec les colonnes : id, playlist_id, track_id, display_order, added_at
- Index pour optimiser les requêtes
- Politiques RLS (Row Level Security) pour la sécurité
- Trigger pour mettre à jour automatiquement `updated_at`

## Instructions pour Bolt
1. Lire le fichier `supabase/migrations/20251111050910_create_playlists_system.sql`
2. Utiliser la Méthode 1 (Supabase Dashboard) pour exécuter le SQL
3. Vérifier le succès avec les requêtes SQL de vérification
4. Confirmer que les tables `playlists` et `playlist_tracks` existent et ont les bonnes politiques RLS

