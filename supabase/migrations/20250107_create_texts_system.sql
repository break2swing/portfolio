-- Migration complète pour le système de textes avec catégories et tags
-- Date: 2025-01-07
-- Description: Création des tables texts, categories, tags et leurs relations

-- ============================================================================
-- 1. TABLE: categories
-- ============================================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3b82f6', -- Couleur hex pour l'UI
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. TABLE: tags
-- ============================================================================
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6366f1', -- Couleur hex pour l'UI
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

CREATE TRIGGER update_tags_updated_at
  BEFORE UPDATE ON tags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. TABLE: texts
-- ============================================================================
CREATE TABLE IF NOT EXISTS texts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  content TEXT NOT NULL,
  excerpt TEXT,
  author TEXT,
  published_date DATE,
  display_order INTEGER NOT NULL DEFAULT 0,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_published BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_texts_category_id ON texts(category_id);
CREATE INDEX IF NOT EXISTS idx_texts_user_id ON texts(user_id);
CREATE INDEX IF NOT EXISTS idx_texts_display_order ON texts(display_order);
CREATE INDEX IF NOT EXISTS idx_texts_published_date ON texts(published_date);
CREATE INDEX IF NOT EXISTS idx_texts_is_published ON texts(is_published);
CREATE INDEX IF NOT EXISTS idx_texts_created_at ON texts(created_at DESC);

-- Full-text search sur titre et contenu
CREATE INDEX IF NOT EXISTS idx_texts_search ON texts USING gin(
  to_tsvector('french', coalesce(title, '') || ' ' || coalesce(content, ''))
);

CREATE TRIGGER update_texts_updated_at
  BEFORE UPDATE ON texts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. TABLE: text_tags (relation many-to-many)
-- ============================================================================
CREATE TABLE IF NOT EXISTS text_tags (
  text_id UUID NOT NULL REFERENCES texts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (text_id, tag_id)
);

-- Index pour améliorer les performances des jointures
CREATE INDEX IF NOT EXISTS idx_text_tags_text_id ON text_tags(text_id);
CREATE INDEX IF NOT EXISTS idx_text_tags_tag_id ON text_tags(tag_id);

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS sur toutes les tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE text_tags ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICIES: categories
-- ============================================================================

-- Lecture publique
CREATE POLICY "Tout le monde peut lire les catégories"
  ON categories FOR SELECT
  USING (true);

-- Création/modification réservées aux utilisateurs authentifiés
CREATE POLICY "Utilisateurs authentifiés peuvent créer des catégories"
  ON categories FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Utilisateurs authentifiés peuvent modifier des catégories"
  ON categories FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Utilisateurs authentifiés peuvent supprimer des catégories"
  ON categories FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- POLICIES: tags
-- ============================================================================

-- Lecture publique
CREATE POLICY "Tout le monde peut lire les tags"
  ON tags FOR SELECT
  USING (true);

-- Création/modification réservées aux utilisateurs authentifiés
CREATE POLICY "Utilisateurs authentifiés peuvent créer des tags"
  ON tags FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Utilisateurs authentifiés peuvent modifier des tags"
  ON tags FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Utilisateurs authentifiés peuvent supprimer des tags"
  ON tags FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- POLICIES: texts
-- ============================================================================

-- Lecture publique des textes publiés uniquement
CREATE POLICY "Tout le monde peut lire les textes publiés"
  ON texts FOR SELECT
  USING (is_published = true);

-- Les utilisateurs authentifiés peuvent voir leurs propres textes (publiés ou non)
CREATE POLICY "Utilisateurs peuvent lire leurs propres textes"
  ON texts FOR SELECT
  USING (auth.uid() = user_id);

-- Création réservée aux utilisateurs authentifiés
CREATE POLICY "Utilisateurs authentifiés peuvent créer des textes"
  ON texts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- Modification réservée au propriétaire
CREATE POLICY "Utilisateurs peuvent modifier leurs propres textes"
  ON texts FOR UPDATE
  USING (auth.uid() = user_id);

-- Suppression réservée au propriétaire
CREATE POLICY "Utilisateurs peuvent supprimer leurs propres textes"
  ON texts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- POLICIES: text_tags
-- ============================================================================

-- Lecture publique
CREATE POLICY "Tout le monde peut lire les relations text_tags"
  ON text_tags FOR SELECT
  USING (true);

-- Les utilisateurs authentifiés peuvent gérer les tags de leurs textes
CREATE POLICY "Utilisateurs peuvent ajouter des tags à leurs textes"
  ON text_tags FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM texts
      WHERE texts.id = text_tags.text_id
      AND texts.user_id = auth.uid()
    )
  );

CREATE POLICY "Utilisateurs peuvent supprimer des tags de leurs textes"
  ON text_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM texts
      WHERE texts.id = text_tags.text_id
      AND texts.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 6. FONCTIONS UTILITAIRES
-- ============================================================================

-- Fonction pour générer un slug à partir d'un nom
CREATE OR REPLACE FUNCTION generate_slug(name TEXT)
RETURNS TEXT AS $$
DECLARE
  slug TEXT;
BEGIN
  -- Convertir en minuscules, remplacer espaces et caractères spéciaux
  slug := lower(regexp_replace(
    regexp_replace(
      regexp_replace(name, '[éèêë]', 'e', 'g'),
      '[àâä]', 'a', 'g'
    ),
    '[^a-z0-9]+', '-', 'g'
  ));
  -- Supprimer les tirets en début/fin
  slug := trim(both '-' from slug);
  RETURN slug;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction pour auto-générer le slug des catégories
CREATE OR REPLACE FUNCTION auto_generate_category_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_category_slug
  BEFORE INSERT OR UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_category_slug();

-- Fonction pour auto-générer le slug des tags
CREATE OR REPLACE FUNCTION auto_generate_tag_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_tag_slug
  BEFORE INSERT OR UPDATE ON tags
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_tag_slug();

-- ============================================================================
-- 7. VUES UTILES
-- ============================================================================

-- Vue pour les textes avec leurs catégories et tags
CREATE OR REPLACE VIEW texts_with_metadata AS
SELECT
  t.id,
  t.title,
  t.subtitle,
  t.content,
  t.excerpt,
  t.author,
  t.published_date,
  t.display_order,
  t.is_published,
  t.view_count,
  t.user_id,
  t.created_at,
  t.updated_at,
  c.id AS category_id,
  c.name AS category_name,
  c.slug AS category_slug,
  c.color AS category_color,
  COALESCE(
    json_agg(
      json_build_object(
        'id', tg.id,
        'name', tg.name,
        'slug', tg.slug,
        'color', tg.color
      )
    ) FILTER (WHERE tg.id IS NOT NULL),
    '[]'
  ) AS tags
FROM texts t
LEFT JOIN categories c ON t.category_id = c.id
LEFT JOIN text_tags tt ON t.id = tt.text_id
LEFT JOIN tags tg ON tt.tag_id = tg.id
GROUP BY t.id, c.id, c.name, c.slug, c.color;

-- ============================================================================
-- 8. DONNÉES DE DÉMONSTRATION (optionnel)
-- ============================================================================

-- Catégories par défaut
INSERT INTO categories (name, description, color, display_order) VALUES
  ('Développement', 'Articles sur le développement web et logiciel', '#3b82f6', 0),
  ('Design', 'Articles sur le design UI/UX', '#8b5cf6', 1),
  ('Technologie', 'Articles sur les nouvelles technologies', '#10b981', 2),
  ('Tutoriels', 'Guides et tutoriels pratiques', '#f59e0b', 3),
  ('Opinion', 'Réflexions et points de vue personnels', '#ef4444', 4)
ON CONFLICT (name) DO NOTHING;

-- Tags par défaut
INSERT INTO tags (name, color) VALUES
  ('JavaScript', '#f7df1e'),
  ('TypeScript', '#3178c6'),
  ('React', '#61dafb'),
  ('Next.js', '#000000'),
  ('CSS', '#1572b6'),
  ('HTML', '#e34f26'),
  ('Node.js', '#339933'),
  ('Python', '#3776ab'),
  ('Git', '#f05032'),
  ('DevOps', '#0db7ed')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================

-- Pour vérifier que tout s'est bien passé
DO $$
BEGIN
  RAISE NOTICE 'Migration terminée avec succès !';
  RAISE NOTICE 'Tables créées : categories, tags, texts, text_tags';
  RAISE NOTICE 'Vue créée : texts_with_metadata';
  RAISE NOTICE 'RLS activé sur toutes les tables';
END $$;
