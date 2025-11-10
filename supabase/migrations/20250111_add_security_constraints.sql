/*
  # Migration : Renforcement de la sécurité - Contraintes CHECK et amélioration RLS
  Date: 2025-01-11
  Description: Ajout de contraintes CHECK au niveau base de données et amélioration des policies RLS
*/

-- ============================================================================
-- 1. AJOUT DE user_id À LA TABLE photos (si absent)
-- ============================================================================

-- Vérifier si la colonne user_id existe, sinon l'ajouter
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'photos' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE photos ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id);
  END IF;
END $$;

-- ============================================================================
-- 2. CONTRAINTES CHECK POUR LA TABLE texts
-- ============================================================================

-- Contrainte pour la longueur du titre
ALTER TABLE texts DROP CONSTRAINT IF EXISTS texts_title_length_check;
ALTER TABLE texts ADD CONSTRAINT texts_title_length_check 
  CHECK (char_length(title) >= 1 AND char_length(title) <= 200);

-- Contrainte pour la longueur du contenu
ALTER TABLE texts DROP CONSTRAINT IF EXISTS texts_content_length_check;
ALTER TABLE texts ADD CONSTRAINT texts_content_length_check 
  CHECK (char_length(content) >= 1 AND char_length(content) <= 50000);

-- Contrainte pour la longueur du subtitle
ALTER TABLE texts DROP CONSTRAINT IF EXISTS texts_subtitle_length_check;
ALTER TABLE texts ADD CONSTRAINT texts_subtitle_length_check 
  CHECK (subtitle IS NULL OR (char_length(subtitle) >= 1 AND char_length(subtitle) <= 300));

-- Contrainte pour la longueur de l'excerpt
ALTER TABLE texts DROP CONSTRAINT IF EXISTS texts_excerpt_length_check;
ALTER TABLE texts ADD CONSTRAINT texts_excerpt_length_check 
  CHECK (excerpt IS NULL OR char_length(excerpt) <= 500);

-- Contrainte pour la longueur de l'author
ALTER TABLE texts DROP CONSTRAINT IF EXISTS texts_author_length_check;
ALTER TABLE texts ADD CONSTRAINT texts_author_length_check 
  CHECK (author IS NULL OR char_length(author) <= 100);

-- Contrainte pour le format du slug (si la colonne existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'texts' AND column_name = 'slug'
  ) THEN
    ALTER TABLE texts DROP CONSTRAINT IF EXISTS texts_slug_format_check;
    ALTER TABLE texts ADD CONSTRAINT texts_slug_format_check 
      CHECK (slug IS NULL OR slug ~ '^[a-z0-9-]+$');
  END IF;
END $$;

-- ============================================================================
-- 3. CONTRAINTES CHECK POUR LA TABLE categories
-- ============================================================================

-- Contrainte pour la longueur du nom
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_length_check;
ALTER TABLE categories ADD CONSTRAINT categories_name_length_check 
  CHECK (char_length(name) >= 1 AND char_length(name) <= 100);

-- Contrainte pour le format du slug
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_slug_format_check;
ALTER TABLE categories ADD CONSTRAINT categories_slug_format_check 
  CHECK (slug ~ '^[a-z0-9-]+$');

-- Contrainte pour le format de la couleur hex
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_color_format_check;
ALTER TABLE categories ADD CONSTRAINT categories_color_format_check 
  CHECK (color ~ '^#[0-9A-Fa-f]{6}$');

-- Contrainte pour la longueur de la description
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_description_length_check;
ALTER TABLE categories ADD CONSTRAINT categories_description_length_check 
  CHECK (description IS NULL OR char_length(description) <= 500);

-- ============================================================================
-- 4. CONTRAINTES CHECK POUR LA TABLE tags
-- ============================================================================

-- Contrainte pour la longueur du nom
ALTER TABLE tags DROP CONSTRAINT IF EXISTS tags_name_length_check;
ALTER TABLE tags ADD CONSTRAINT tags_name_length_check 
  CHECK (char_length(name) >= 1 AND char_length(name) <= 50);

-- Contrainte pour le format du slug
ALTER TABLE tags DROP CONSTRAINT IF EXISTS tags_slug_format_check;
ALTER TABLE tags ADD CONSTRAINT tags_slug_format_check 
  CHECK (slug ~ '^[a-z0-9-]+$');

-- Contrainte pour le format de la couleur hex
ALTER TABLE tags DROP CONSTRAINT IF EXISTS tags_color_format_check;
ALTER TABLE tags ADD CONSTRAINT tags_color_format_check 
  CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$');

-- ============================================================================
-- 5. CONTRAINTES CHECK POUR LA TABLE photos
-- ============================================================================

-- Contrainte pour la longueur du titre
ALTER TABLE photos DROP CONSTRAINT IF EXISTS photos_title_length_check;
ALTER TABLE photos ADD CONSTRAINT photos_title_length_check 
  CHECK (char_length(title) >= 1 AND char_length(title) <= 200);

-- Contrainte pour la longueur de la description
ALTER TABLE photos DROP CONSTRAINT IF EXISTS photos_description_length_check;
ALTER TABLE photos ADD CONSTRAINT photos_description_length_check 
  CHECK (description IS NULL OR char_length(description) <= 1000);

-- Contrainte pour le format de l'URL (doit commencer par http:// ou https://)
ALTER TABLE photos DROP CONSTRAINT IF EXISTS photos_image_url_format_check;
ALTER TABLE photos ADD CONSTRAINT photos_image_url_format_check 
  CHECK (image_url ~ '^https?://');

-- ============================================================================
-- 6. CONTRAINTES CHECK POUR LA TABLE music_tracks
-- ============================================================================

-- Contrainte pour la longueur du titre
ALTER TABLE music_tracks DROP CONSTRAINT IF EXISTS music_tracks_title_length_check;
ALTER TABLE music_tracks ADD CONSTRAINT music_tracks_title_length_check 
  CHECK (char_length(title) >= 1 AND char_length(title) <= 200);

-- Contrainte pour la longueur de l'artist
ALTER TABLE music_tracks DROP CONSTRAINT IF EXISTS music_tracks_artist_length_check;
ALTER TABLE music_tracks ADD CONSTRAINT music_tracks_artist_length_check 
  CHECK (artist IS NULL OR char_length(artist) <= 200);

-- Contrainte pour la longueur de l'album
ALTER TABLE music_tracks DROP CONSTRAINT IF EXISTS music_tracks_album_length_check;
ALTER TABLE music_tracks ADD CONSTRAINT music_tracks_album_length_check 
  CHECK (album IS NULL OR char_length(album) <= 200);

-- Contrainte pour le format de l'URL audio
ALTER TABLE music_tracks DROP CONSTRAINT IF EXISTS music_tracks_audio_url_format_check;
ALTER TABLE music_tracks ADD CONSTRAINT music_tracks_audio_url_format_check 
  CHECK (audio_url ~ '^https?://');

-- Contrainte pour le format de l'URL de couverture
ALTER TABLE music_tracks DROP CONSTRAINT IF EXISTS music_tracks_cover_url_format_check;
ALTER TABLE music_tracks ADD CONSTRAINT music_tracks_cover_url_format_check 
  CHECK (cover_image_url IS NULL OR cover_image_url ~ '^https?://');

-- Contrainte pour la durée (doit être positive si présente)
ALTER TABLE music_tracks DROP CONSTRAINT IF EXISTS music_tracks_duration_check;
ALTER TABLE music_tracks ADD CONSTRAINT music_tracks_duration_check 
  CHECK (duration IS NULL OR duration >= 0);

-- ============================================================================
-- 7. CONTRAINTES CHECK POUR LA TABLE videos
-- ============================================================================

-- Contrainte pour la longueur du titre
ALTER TABLE videos DROP CONSTRAINT IF EXISTS videos_title_length_check;
ALTER TABLE videos ADD CONSTRAINT videos_title_length_check 
  CHECK (char_length(title) >= 1 AND char_length(title) <= 200);

-- Contrainte pour la longueur de la description
ALTER TABLE videos DROP CONSTRAINT IF EXISTS videos_description_length_check;
ALTER TABLE videos ADD CONSTRAINT videos_description_length_check 
  CHECK (description IS NULL OR char_length(description) <= 1000);

-- Contrainte pour le format de l'URL vidéo
ALTER TABLE videos DROP CONSTRAINT IF EXISTS videos_video_url_format_check;
ALTER TABLE videos ADD CONSTRAINT videos_video_url_format_check 
  CHECK (video_url ~ '^https?://');

-- Contrainte pour le format de l'URL thumbnail
ALTER TABLE videos DROP CONSTRAINT IF EXISTS videos_thumbnail_url_format_check;
ALTER TABLE videos ADD CONSTRAINT videos_thumbnail_url_format_check 
  CHECK (thumbnail_url IS NULL OR thumbnail_url ~ '^https?://');

-- Contrainte pour la durée (doit être positive si présente)
ALTER TABLE videos DROP CONSTRAINT IF EXISTS videos_duration_check;
ALTER TABLE videos ADD CONSTRAINT videos_duration_check 
  CHECK (duration IS NULL OR duration >= 0);

-- ============================================================================
-- 8. AMÉLIORATION DES POLICIES RLS POUR photos
-- ============================================================================

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Insertion réservée aux authentifiés" ON photos;
DROP POLICY IF EXISTS "Mise à jour réservée aux authentifiés" ON photos;
DROP POLICY IF EXISTS "Suppression réservée aux authentifiés" ON photos;

-- Nouvelle policy INSERT : vérifier ownership
CREATE POLICY "Utilisateurs authentifiés peuvent créer leurs propres photos"
  ON photos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Nouvelle policy UPDATE : vérifier ownership
CREATE POLICY "Utilisateurs peuvent modifier leurs propres photos"
  ON photos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Nouvelle policy DELETE : vérifier ownership
CREATE POLICY "Utilisateurs peuvent supprimer leurs propres photos"
  ON photos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 9. AMÉLIORATION DES POLICIES RLS POUR music_tracks
-- ============================================================================

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Utilisateurs authentifiés peuvent créer des morceaux" ON music_tracks;
DROP POLICY IF EXISTS "Utilisateurs authentifiés peuvent modifier des morceaux" ON music_tracks;
DROP POLICY IF EXISTS "Utilisateurs authentifiés peuvent supprimer des morceaux" ON music_tracks;

-- Nouvelle policy INSERT : vérifier ownership
CREATE POLICY "Utilisateurs authentifiés peuvent créer leurs propres morceaux"
  ON music_tracks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Nouvelle policy UPDATE : vérifier ownership
CREATE POLICY "Utilisateurs peuvent modifier leurs propres morceaux"
  ON music_tracks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Nouvelle policy DELETE : vérifier ownership
CREATE POLICY "Utilisateurs peuvent supprimer leurs propres morceaux"
  ON music_tracks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 10. VÉRIFICATION ET NOTIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration de sécurité terminée :';
  RAISE NOTICE '- Contraintes CHECK ajoutées sur toutes les tables';
  RAISE NOTICE '- Colonne user_id ajoutée à photos si absente';
  RAISE NOTICE '- Policies RLS améliorées pour photos et music_tracks avec vérification ownership';
END $$;

