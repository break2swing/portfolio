-- Migration complète pour le système de textes avec catégories et tags
-- Date: 2025-01-07 (Version 2 - corrigée)
-- Description: Création des tables texts, categories, tags et leurs relations

-- ============================================================================
-- 0. NETTOYAGE (si nécessaire)
-- ============================================================================
-- Décommentez les lignes suivantes si vous avez besoin de nettoyer les tables existantes
-- DROP TABLE IF EXISTS text_tags CASCADE;
-- DROP TABLE IF EXISTS texts CASCADE;
-- DROP TABLE IF EXISTS tags CASCADE;
-- DROP TABLE IF EXISTS categories CASCADE;
-- DROP VIEW IF EXISTS texts_with_metadata CASCADE;
-- DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
-- DROP FUNCTION IF EXISTS generate_slug(TEXT) CASCADE;
-- DROP FUNCTION IF EXISTS auto_generate_category_slug() CASCADE;
-- DROP FUNCTION IF EXISTS auto_generate_tag_slug() CASCADE;

-- ============================================================================
-- 1. FONCTION: generate_slug (VERSION AMÉLIORÉE)
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_slug(input_name TEXT)
RETURNS TEXT AS $$
DECLARE
  slug TEXT;
BEGIN
  -- Vérifier que le nom n'est pas vide
  IF input_name IS NULL OR trim(input_name) = '' THEN
    RETURN 'item-' || substr(md5(random()::text), 1, 8);
  END IF;

  -- Convertir en minuscules et remplacer les caractères accentués
  slug := lower(input_name);

  -- Remplacer les caractères accentués courants
  slug := translate(slug,
    'àâäéèêëïîôùûüÿçñ',
    'aaaeeeeiioouuyc n'
  );

  -- Remplacer tout ce qui n'est pas alphanumérique par un tiret
  slug := regexp_replace(slug, '[^a-z0-9]+', '-', 'g');

  -- Supprimer les tirets en début et fin
  slug := trim(both '-' from slug);

  -- Si le slug est vide après tout ça, générer un slug aléatoire
  IF slug = '' OR slug IS NULL THEN
    slug := 'item-' || substr(md5(random()::text), 1, 8);
  END IF;

  RETURN slug;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 2. FONCTION: update_updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. TABLE: categories
-- ============================================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- Trigger pour updated_at
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour auto-générer le slug
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

-- ============================================================================
-- 4. TABLE: tags
-- ============================================================================
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- Trigger pour updated_at
CREATE TRIGGER update_tags_updated_at
  BEFORE UPDATE ON tags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour auto-générer le slug
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
-- 5. TABLE: texts
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

-- Index
CREATE INDEX IF NOT EXISTS idx_texts_category_id ON texts(category_id);
CREATE INDEX IF NOT EXISTS idx_texts_user_id ON texts(user_id);
CREATE INDEX IF NOT EXISTS idx_texts_display_order ON texts(display_order);
CREATE INDEX IF NOT EXISTS idx_texts_published_date ON texts(published_date);
CREATE INDEX IF NOT EXISTS idx_texts_is_published ON texts(is_published);
CREATE INDEX IF NOT EXISTS idx_texts_created_at ON texts(created_at DESC);

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_texts_search ON texts USING gin(
  to_tsvector('french', coalesce(title, '') || ' ' || coalesce(content, ''))
);

-- Trigger pour updated_at
CREATE TRIGGER update_texts_updated_at
  BEFORE UPDATE ON texts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. TABLE: text_tags (relation many-to-many)
-- ============================================================================
CREATE TABLE IF NOT EXISTS text_tags (
  text_id UUID NOT NULL REFERENCES texts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (text_id, tag_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_text_tags_text_id ON text_tags(text_id);
CREATE INDEX IF NOT EXISTS idx_text_tags_tag_id ON text_tags(tag_id);

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE text_tags ENABLE ROW LEVEL SECURITY;

-- Policies: categories
CREATE POLICY "Lecture publique des catégories" ON categories FOR SELECT USING (true);
CREATE POLICY "Création catégories par utilisateurs authentifiés" ON categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Modification catégories par utilisateurs authentifiés" ON categories FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Suppression catégories par utilisateurs authentifiés" ON categories FOR DELETE USING (auth.role() = 'authenticated');

-- Policies: tags
CREATE POLICY "Lecture publique des tags" ON tags FOR SELECT USING (true);
CREATE POLICY "Création tags par utilisateurs authentifiés" ON tags FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Modification tags par utilisateurs authentifiés" ON tags FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Suppression tags par utilisateurs authentifiés" ON tags FOR DELETE USING (auth.role() = 'authenticated');

-- Policies: texts
CREATE POLICY "Lecture publique des textes publiés" ON texts FOR SELECT USING (is_published = true);
CREATE POLICY "Lecture de ses propres textes" ON texts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Création de textes par utilisateurs authentifiés" ON texts FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);
CREATE POLICY "Modification de ses propres textes" ON texts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Suppression de ses propres textes" ON texts FOR DELETE USING (auth.uid() = user_id);

-- Policies: text_tags
CREATE POLICY "Lecture publique des relations text_tags" ON text_tags FOR SELECT USING (true);
CREATE POLICY "Ajout de tags à ses propres textes" ON text_tags FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  EXISTS (SELECT 1 FROM texts WHERE texts.id = text_tags.text_id AND texts.user_id = auth.uid())
);
CREATE POLICY "Suppression de tags de ses propres textes" ON text_tags FOR DELETE USING (
  EXISTS (SELECT 1 FROM texts WHERE texts.id = text_tags.text_id AND texts.user_id = auth.uid())
);

-- ============================================================================
-- 8. VUE: texts_with_metadata
-- ============================================================================
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
-- 9. DONNÉES DE DÉMONSTRATION
-- ============================================================================

-- Catégories (avec gestion des conflits)
INSERT INTO categories (name, slug, description, color, display_order) VALUES
  ('Développement', 'developpement', 'Articles sur le développement web et logiciel', '#3b82f6', 0),
  ('Design', 'design', 'Articles sur le design UI/UX', '#8b5cf6', 1),
  ('Technologie', 'technologie', 'Articles sur les nouvelles technologies', '#10b981', 2),
  ('Tutoriels', 'tutoriels', 'Guides et tutoriels pratiques', '#f59e0b', 3),
  ('Opinion', 'opinion', 'Réflexions et points de vue personnels', '#ef4444', 4)
ON CONFLICT (slug) DO NOTHING;

-- Tags (avec gestion des conflits)
INSERT INTO tags (name, slug, color) VALUES
  ('JavaScript', 'javascript', '#f7df1e'),
  ('TypeScript', 'typescript', '#3178c6'),
  ('React', 'react', '#61dafb'),
  ('Next.js', 'nextjs', '#000000'),
  ('CSS', 'css', '#1572b6'),
  ('HTML', 'html', '#e34f26'),
  ('Node.js', 'nodejs', '#339933'),
  ('Python', 'python', '#3776ab'),
  ('Git', 'git', '#f05032'),
  ('DevOps', 'devops', '#0db7ed')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 10. CONFIRMATION
-- ============================================================================
DO $$
DECLARE
  cat_count INTEGER;
  tag_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO cat_count FROM categories;
  SELECT COUNT(*) INTO tag_count FROM tags;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration terminée avec succès !';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables créées : categories, tags, texts, text_tags';
  RAISE NOTICE 'Vue créée : texts_with_metadata';
  RAISE NOTICE 'RLS activé sur toutes les tables';
  RAISE NOTICE 'Catégories insérées : %', cat_count;
  RAISE NOTICE 'Tags insérés : %', tag_count;
  RAISE NOTICE '========================================';
END $$;
