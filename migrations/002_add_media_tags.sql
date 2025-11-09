-- Migration: Ajout des tables de relation pour tags sur les médias
-- Date: 2025-11-09
-- Description: Ajoute les tables de relation music_tags, video_tags, photo_tags
--              pour permettre le tagging des contenus audio, vidéo et photo

-- Table de relation pour les tags des morceaux de musique
CREATE TABLE IF NOT EXISTS music_tags (
  music_track_id UUID NOT NULL REFERENCES music_tracks(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (music_track_id, tag_id)
);

-- Index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_music_tags_music_track_id ON music_tags(music_track_id);
CREATE INDEX IF NOT EXISTS idx_music_tags_tag_id ON music_tags(tag_id);

-- Table de relation pour les tags des vidéos
CREATE TABLE IF NOT EXISTS video_tags (
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (video_id, tag_id)
);

-- Index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_video_tags_video_id ON video_tags(video_id);
CREATE INDEX IF NOT EXISTS idx_video_tags_tag_id ON video_tags(tag_id);

-- Table de relation pour les tags des photos
CREATE TABLE IF NOT EXISTS photo_tags (
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (photo_id, tag_id)
);

-- Index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_photo_tags_photo_id ON photo_tags(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_tags_tag_id ON photo_tags(tag_id);

-- Commentaires pour documentation
COMMENT ON TABLE music_tags IS 'Table de relation many-to-many entre music_tracks et tags';
COMMENT ON TABLE video_tags IS 'Table de relation many-to-many entre videos et tags';
COMMENT ON TABLE photo_tags IS 'Table de relation many-to-many entre photos et tags';
