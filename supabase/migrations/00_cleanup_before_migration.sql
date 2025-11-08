-- ============================================================================
-- SCRIPT DE NETTOYAGE - À EXÉCUTER AVANT LA MIGRATION
-- ============================================================================
-- Ce script supprime proprement toutes les tables et fonctions liées au système de textes
-- Utilisez-le si vous avez déjà des tables existantes ou des erreurs de contraintes

-- ATTENTION : Ce script supprimera TOUTES les données existantes dans ces tables !
-- Assurez-vous d'avoir une sauvegarde si nécessaire

-- Supprimer les vues
DROP VIEW IF EXISTS texts_with_metadata CASCADE;

-- Supprimer les tables (CASCADE supprime aussi les contraintes foreign key)
DROP TABLE IF EXISTS text_tags CASCADE;
DROP TABLE IF EXISTS texts CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS generate_slug(TEXT) CASCADE;
DROP FUNCTION IF EXISTS auto_generate_category_slug() CASCADE;
DROP FUNCTION IF EXISTS auto_generate_tag_slug() CASCADE;

-- Vérification : ces requêtes devraient retourner 0 lignes
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('categories', 'tags', 'texts', 'text_tags');

SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('update_updated_at_column', 'generate_slug', 'auto_generate_category_slug', 'auto_generate_tag_slug');

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Nettoyage terminé ! Vous pouvez maintenant exécuter la migration principale.';
END $$;
