/*
  # Création du bucket de stockage audio et politiques RLS

  1. Nouveau Bucket
    - `audio-files` - Bucket pour stocker les fichiers audio
      - Public: true (fichiers accessibles publiquement)
      - File size limit: 10MB
      - Allowed MIME types: audio/mpeg, audio/mp3, audio/wav, audio/ogg

  2. Politiques de Sécurité Storage
    - SELECT (download) : Tous peuvent télécharger/lire les fichiers audio
    - INSERT (upload) : Seuls les utilisateurs authentifiés peuvent uploader
    - UPDATE : Seuls les utilisateurs authentifiés peuvent mettre à jour
    - DELETE : Seuls les utilisateurs authentifiés peuvent supprimer

  3. Notes importantes
    - Les fichiers audio seront publiquement accessibles en lecture
    - Seuls les utilisateurs connectés peuvent gérer les fichiers (upload/update/delete)
    - Limite de taille: 10MB par fichier
*/

-- Créer le bucket audio-files s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-files',
  'audio-files',
  true,
  10485760,
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/x-m4a', 'audio/mp4']
)
ON CONFLICT (id) DO NOTHING;

-- Politique SELECT : Tous peuvent télécharger les fichiers audio
CREATE POLICY "Tous peuvent télécharger les fichiers audio"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'audio-files');

-- Politique INSERT : Seuls les utilisateurs authentifiés peuvent uploader
CREATE POLICY "Utilisateurs authentifiés peuvent uploader des fichiers audio"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'audio-files');

-- Politique UPDATE : Seuls les utilisateurs authentifiés peuvent mettre à jour
CREATE POLICY "Utilisateurs authentifiés peuvent mettre à jour les fichiers audio"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'audio-files')
  WITH CHECK (bucket_id = 'audio-files');

-- Politique DELETE : Seuls les utilisateurs authentifiés peuvent supprimer
CREATE POLICY "Utilisateurs authentifiés peuvent supprimer les fichiers audio"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'audio-files');
