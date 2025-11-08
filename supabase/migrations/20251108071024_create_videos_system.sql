/*
  # Système de gestion des vidéos

  1. Nouvelle table
    - `videos`
      - `id` (uuid, primary key) - Identifiant unique de la vidéo
      - `title` (text, NOT NULL) - Titre de la vidéo
      - `description` (text, nullable) - Description de la vidéo
      - `video_url` (text, NOT NULL) - URL du fichier vidéo dans Supabase Storage
      - `thumbnail_url` (text, nullable) - URL de la miniature de la vidéo
      - `duration` (integer, nullable) - Durée de la vidéo en secondes
      - `display_order` (integer, NOT NULL, DEFAULT 0) - Ordre d'affichage des vidéos
      - `user_id` (uuid, nullable) - Référence à l'utilisateur qui a ajouté la vidéo
      - `created_at` (timestamptz, DEFAULT now()) - Date de création

  2. Sécurité
    - Enable RLS sur la table `videos`
    - Politique SELECT: accessible en lecture publique pour tous
    - Politique INSERT: réservée aux utilisateurs authentifiés
    - Politique UPDATE: réservée aux utilisateurs authentifiés
    - Politique DELETE: réservée aux utilisateurs authentifiés

  3. Bucket de stockage
    - Création du bucket `video-files` pour stocker les fichiers vidéo
    - Politique de lecture publique pour tous
    - Politique d'upload pour les utilisateurs authentifiés uniquement
    - Politique de suppression pour les utilisateurs authentifiés uniquement

  Notes importantes:
    - Les vidéos sont triées par `display_order` (ordre croissant)
    - Le `user_id` est nullable pour permettre la migration de données existantes
    - La durée est stockée en secondes pour faciliter l'affichage
*/

-- Créer la table videos
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  video_url text NOT NULL,
  thumbnail_url text,
  duration integer,
  display_order integer NOT NULL DEFAULT 0,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Activer RLS sur la table videos
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Politique SELECT: lecture publique pour tous
CREATE POLICY "Videos are viewable by everyone"
  ON videos FOR SELECT
  TO public
  USING (true);

-- Politique INSERT: insertion réservée aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can insert videos"
  ON videos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Politique UPDATE: mise à jour réservée aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can update videos"
  ON videos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique DELETE: suppression réservée aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can delete videos"
  ON videos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Créer un index sur display_order pour optimiser les requêtes de tri
CREATE INDEX IF NOT EXISTS idx_videos_display_order ON videos(display_order);

-- Créer un index sur user_id pour optimiser les requêtes par utilisateur
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);

-- Créer un index sur created_at pour optimiser les requêtes de tri par date
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);

-- Créer le bucket de stockage pour les vidéos (si pas déjà existant)
INSERT INTO storage.buckets (id, name, public)
VALUES ('video-files', 'video-files', true)
ON CONFLICT (id) DO NOTHING;

-- Politique de lecture publique pour le bucket video-files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public read access for video files'
  ) THEN
    CREATE POLICY "Public read access for video files"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'video-files');
  END IF;
END $$;

-- Politique d'upload pour les utilisateurs authentifiés
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload video files'
  ) THEN
    CREATE POLICY "Authenticated users can upload video files"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'video-files');
  END IF;
END $$;

-- Politique de mise à jour pour les utilisateurs authentifiés
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can update video files'
  ) THEN
    CREATE POLICY "Authenticated users can update video files"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = 'video-files')
      WITH CHECK (bucket_id = 'video-files');
  END IF;
END $$;

-- Politique de suppression pour les utilisateurs authentifiés
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can delete video files'
  ) THEN
    CREATE POLICY "Authenticated users can delete video files"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'video-files');
  END IF;
END $$;
