/*
  # Schéma de la galerie de photos

  1. Nouvelle table
    - `photos`
      - `id` (uuid, clé primaire, auto-généré)
      - `title` (text, requis) - Titre de la photo
      - `description` (text, optionnel) - Description de la photo
      - `image_url` (text, requis) - URL publique de l'image dans le bucket Supabase
      - `display_order` (integer, requis) - Ordre d'affichage personnalisé
      - `created_at` (timestamp, auto-généré) - Date de création

  2. Sécurité
    - Active RLS sur la table `photos`
    - Politique SELECT : lecture publique pour tous
    - Politique INSERT : réservée aux utilisateurs authentifiés
    - Politique UPDATE : réservée aux utilisateurs authentifiés
    - Politique DELETE : réservée aux utilisateurs authentifiés

  3. Notes
    - L'ordre d'affichage est géré via le champ display_order
    - Les index sont créés pour optimiser les requêtes
*/

CREATE TABLE IF NOT EXISTS photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture publique des photos"
  ON photos
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Insertion réservée aux authentifiés"
  ON photos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Mise à jour réservée aux authentifiés"
  ON photos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Suppression réservée aux authentifiés"
  ON photos
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS photos_display_order_idx ON photos(display_order);
CREATE INDEX IF NOT EXISTS photos_created_at_idx ON photos(created_at DESC);
