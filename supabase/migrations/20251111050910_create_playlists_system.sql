/*
  # Création du système de playlists personnalisées

  1. Nouvelles Tables
    - `playlists`
      - `id` (uuid, clé primaire) - Identifiant unique de la playlist
      - `name` (text, requis) - Nom de la playlist
      - `description` (text, optionnel) - Description de la playlist
      - `user_id` (uuid, requis) - ID de l'utilisateur propriétaire
      - `is_public` (boolean, défaut: false) - Visibilité publique de la playlist
      - `display_order` (integer, défaut: 0) - Ordre d'affichage
      - `created_at` (timestamptz, défaut: now()) - Date de création
      - `updated_at` (timestamptz, défaut: now()) - Date de mise à jour

    - `playlist_tracks`
      - `id` (uuid, clé primaire) - Identifiant unique de la relation
      - `playlist_id` (uuid, requis) - ID de la playlist
      - `track_id` (uuid, requis) - ID du morceau
      - `display_order` (integer, défaut: 0) - Ordre d'affichage dans la playlist
      - `added_at` (timestamptz, défaut: now()) - Date d'ajout
      - UNIQUE(playlist_id, track_id) - Un morceau ne peut être ajouté qu'une fois par playlist

  2. Index
    - Index sur `playlist_tracks.playlist_id` pour optimiser les requêtes de récupération
    - Index sur `playlist_tracks.track_id` pour optimiser les requêtes de recherche
    - Index sur `playlist_tracks.display_order` pour optimiser le tri

  3. Sécurité (RLS)
    - Activer RLS sur les deux tables
    - Politiques SELECT : Tous peuvent voir les playlists publiques + leurs propres playlists
    - Politiques INSERT/UPDATE/DELETE : Seuls les propriétaires peuvent modifier leurs playlists
    - Politiques pour playlist_tracks : Vérification via EXISTS sur la table playlists

  4. Notes importantes
    - Les playlists sont liées aux utilisateurs via auth.users
    - CASCADE DELETE : Supprimer une playlist supprime automatiquement ses tracks associés
    - Les playlists publiques peuvent être partagées via URL
*/

-- Créer la table playlists
CREATE TABLE IF NOT EXISTS playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_public boolean DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Créer la table playlist_tracks
CREATE TABLE IF NOT EXISTS playlist_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid REFERENCES playlists(id) ON DELETE CASCADE NOT NULL,
  track_id uuid REFERENCES music_tracks(id) ON DELETE CASCADE NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  added_at timestamptz DEFAULT now(),
  UNIQUE(playlist_id, track_id)
);

-- Créer les index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist_id ON playlist_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_track_id ON playlist_tracks(track_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_display_order ON playlist_tracks(playlist_id, display_order);

-- Activer Row Level Security
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;

-- Politiques pour playlists

-- SELECT : Tous peuvent voir les playlists publiques + leurs propres playlists
CREATE POLICY "Tous peuvent voir les playlists publiques"
  ON playlists FOR SELECT
  USING (is_public = true OR user_id = auth.uid());

-- INSERT : Seuls les utilisateurs authentifiés peuvent créer des playlists
CREATE POLICY "Utilisateurs authentifiés peuvent créer des playlists"
  ON playlists FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE : Seuls les propriétaires peuvent modifier leurs playlists
CREATE POLICY "Propriétaires peuvent modifier leurs playlists"
  ON playlists FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE : Seuls les propriétaires peuvent supprimer leurs playlists
CREATE POLICY "Propriétaires peuvent supprimer leurs playlists"
  ON playlists FOR DELETE
  USING (user_id = auth.uid());

-- Politiques pour playlist_tracks

-- SELECT : Tous peuvent voir les tracks des playlists publiques + leurs propres playlists
CREATE POLICY "Tous peuvent voir les tracks des playlists publiques"
  ON playlist_tracks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE playlists.id = playlist_tracks.playlist_id 
      AND (playlists.is_public = true OR playlists.user_id = auth.uid())
    )
  );

-- INSERT : Seuls les propriétaires peuvent ajouter des tracks à leurs playlists
CREATE POLICY "Propriétaires peuvent ajouter des tracks à leurs playlists"
  ON playlist_tracks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE playlists.id = playlist_tracks.playlist_id 
      AND playlists.user_id = auth.uid()
    )
  );

-- UPDATE : Seuls les propriétaires peuvent modifier l'ordre des tracks
CREATE POLICY "Propriétaires peuvent modifier l'ordre des tracks"
  ON playlist_tracks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE playlists.id = playlist_tracks.playlist_id 
      AND playlists.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE playlists.id = playlist_tracks.playlist_id 
      AND playlists.user_id = auth.uid()
    )
  );

-- DELETE : Seuls les propriétaires peuvent retirer des tracks de leurs playlists
CREATE POLICY "Propriétaires peuvent retirer des tracks de leurs playlists"
  ON playlist_tracks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE playlists.id = playlist_tracks.playlist_id 
      AND playlists.user_id = auth.uid()
    )
  );

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_playlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_playlists_updated_at
  BEFORE UPDATE ON playlists
  FOR EACH ROW
  EXECUTE FUNCTION update_playlist_updated_at();

