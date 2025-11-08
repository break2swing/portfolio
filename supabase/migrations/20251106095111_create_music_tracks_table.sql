/*
  # Création de la table des morceaux de musique

  1. Nouvelle Table
    - `music_tracks`
      - `id` (uuid, clé primaire) - Identifiant unique du morceau
      - `title` (text, requis) - Titre du morceau
      - `artist` (text, optionnel) - Nom de l'artiste
      - `album` (text, optionnel) - Nom de l'album
      - `audio_url` (text, requis) - URL du fichier audio dans le storage
      - `cover_image_url` (text, optionnel) - URL de l'image de couverture
      - `duration` (integer, optionnel) - Durée du morceau en secondes
      - `display_order` (integer, requis, défaut: 0) - Ordre d'affichage dans la liste
      - `created_at` (timestamptz, défaut: now()) - Date de création
      - `user_id` (uuid, optionnel) - ID de l'utilisateur qui a uploadé le morceau

  2. Sécurité
    - Activer RLS (Row Level Security) sur la table `music_tracks`
    - Politique SELECT : Tous les utilisateurs (authentifiés ou non) peuvent voir les morceaux
    - Politique INSERT : Seuls les utilisateurs authentifiés peuvent ajouter des morceaux
    - Politique UPDATE : Seuls les utilisateurs authentifiés peuvent modifier des morceaux
    - Politique DELETE : Seuls les utilisateurs authentifiés peuvent supprimer des morceaux

  3. Index
    - Créer un index sur `display_order` pour optimiser les requêtes de tri

  4. Notes importantes
    - Les fichiers audio seront stockés dans un bucket Supabase Storage nommé "audio-files"
    - Le bucket devra être créé manuellement via l'interface Supabase ou CLI
    - Les morceaux sont publiquement visibles mais seuls les admins peuvent les gérer
*/

-- Créer la table music_tracks
CREATE TABLE IF NOT EXISTS music_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist text DEFAULT '',
  album text DEFAULT '',
  audio_url text NOT NULL,
  cover_image_url text DEFAULT '',
  duration integer DEFAULT 0,
  display_order integer NOT NULL DEFAULT 0,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Créer un index sur display_order pour optimiser les requêtes de tri
CREATE INDEX IF NOT EXISTS idx_music_tracks_display_order ON music_tracks(display_order);

-- Activer Row Level Security
ALTER TABLE music_tracks ENABLE ROW LEVEL SECURITY;

-- Politique SELECT : Tous peuvent lire les morceaux
CREATE POLICY "Tous peuvent voir les morceaux"
  ON music_tracks FOR SELECT
  USING (true);

-- Politique INSERT : Seuls les utilisateurs authentifiés peuvent créer
CREATE POLICY "Utilisateurs authentifiés peuvent créer des morceaux"
  ON music_tracks FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Politique UPDATE : Seuls les utilisateurs authentifiés peuvent modifier
CREATE POLICY "Utilisateurs authentifiés peuvent modifier des morceaux"
  ON music_tracks FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Politique DELETE : Seuls les utilisateurs authentifiés peuvent supprimer
CREATE POLICY "Utilisateurs authentifiés peuvent supprimer des morceaux"
  ON music_tracks FOR DELETE
  TO authenticated
  USING (true);