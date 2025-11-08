/*
  # Création du bucket de stockage photos et politiques RLS

  1. Nouveau Bucket
    - `photo-files` - Bucket pour stocker les images/photos
      - Public: true (fichiers accessibles publiquement)
      - File size limit: 5MB
      - Allowed MIME types: image/jpeg, image/png, image/webp, image/gif

  2. Politiques de Sécurité Storage
    - SELECT (download) : Tous peuvent télécharger/lire les photos
    - INSERT (upload) : Seuls les utilisateurs authentifiés peuvent uploader
    - UPDATE : Seuls les utilisateurs authentifiés peuvent mettre à jour
    - DELETE : Seuls les utilisateurs authentifiés peuvent supprimer

  3. Notes importantes
    - Les photos seront publiquement accessibles en lecture
    - Seuls les utilisateurs connectés peuvent gérer les fichiers (upload/update/delete)
    - Limite de taille: 5MB par fichier
*/

-- Créer le bucket photo-files s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photo-files',
  'photo-files',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Politique SELECT : Tous peuvent télécharger les photos
CREATE POLICY "Tous peuvent télécharger les photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'photo-files');

-- Politique INSERT : Seuls les utilisateurs authentifiés peuvent uploader
CREATE POLICY "Utilisateurs authentifiés peuvent uploader des photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'photo-files');

-- Politique UPDATE : Seuls les utilisateurs authentifiés peuvent mettre à jour
CREATE POLICY "Utilisateurs authentifiés peuvent mettre à jour les photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'photo-files')
  WITH CHECK (bucket_id = 'photo-files');

-- Politique DELETE : Seuls les utilisateurs authentifiés peuvent supprimer
CREATE POLICY "Utilisateurs authentifiés peuvent supprimer les photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'photo-files');
