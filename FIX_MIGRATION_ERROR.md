# 🔧 Correction de l'erreur de migration

## ❌ Erreur rencontrée

```
ERROR: 23505: duplicate key value violates unique constraint "tags_slug_key"
DETAIL: Key (slug)=() already exists.
```

## 🎯 Cause du problème

Vous avez probablement déjà des données dans votre base Supabase avec des slugs vides ou en conflit. Cette erreur survient lors de la tentative d'insertion de données qui violent la contrainte d'unicité sur la colonne `slug` de la table `tags`.

## ✅ Solution (2 options)

### Option 1 : Nettoyage complet (RECOMMANDÉ)

**⚠️ ATTENTION : Cette option supprimera toutes les données existantes dans les tables `categories`, `tags`, `texts`, `text_tags`**

#### Étape 1 : Exécuter le script de nettoyage

1. Ouvrez le SQL Editor de Supabase
2. Copiez le contenu de `supabase/migrations/00_cleanup_before_migration.sql`
3. Collez-le et exécutez (RUN)

Vous devriez voir :
```
NOTICE: Nettoyage terminé ! Vous pouvez maintenant exécuter la migration principale.
```

#### Étape 2 : Exécuter la migration corrigée

1. Toujours dans le SQL Editor
2. Copiez le contenu de `supabase/migrations/20250107_create_texts_system_v2.sql`
3. Collez-le et exécutez (RUN)

Vous devriez voir :
```
NOTICE: ========================================
NOTICE: Migration terminée avec succès !
NOTICE: ========================================
NOTICE: Tables créées : categories, tags, texts, text_tags
NOTICE: Vue créée : texts_with_metadata
NOTICE: RLS activé sur toutes les tables
NOTICE: Catégories insérées : 5
NOTICE: Tags insérés : 10
NOTICE: ========================================
```

### Option 2 : Suppression manuelle des données en conflit

Si vous voulez conserver certaines données existantes :

#### Étape 1 : Identifier les slugs en conflit

```sql
-- Voir tous les slugs vides ou NULL dans tags
SELECT id, name, slug FROM tags WHERE slug = '' OR slug IS NULL;

-- Voir tous les slugs vides ou NULL dans categories
SELECT id, name, slug FROM categories WHERE slug = '' OR slug IS NULL;
```

#### Étape 2 : Supprimer ou corriger les entrées problématiques

```sql
-- Supprimer les tags avec slug vide
DELETE FROM tags WHERE slug = '' OR slug IS NULL;

-- Supprimer les catégories avec slug vide
DELETE FROM categories WHERE slug = '' OR slug IS NULL;

-- OU les corriger manuellement
UPDATE tags SET slug = 'tag-name-slug' WHERE id = 'UUID_DU_TAG_PROBLEMATIQUE';
UPDATE categories SET slug = 'category-slug' WHERE id = 'UUID_DE_LA_CATEGORIE';
```

#### Étape 3 : Exécuter la migration v2

Une fois les conflits résolus, exécutez `20250107_create_texts_system_v2.sql`

## 🆕 Améliorations de la v2

La nouvelle version de la migration inclut :

1. **Fonction `generate_slug` améliorée** :
   - Gère les noms vides ou NULL
   - Génère un slug aléatoire si le résultat est vide
   - Meilleure gestion des caractères accentués

2. **Clause `ON CONFLICT DO NOTHING`** :
   - Évite les erreurs si les données existent déjà
   - Permet de réexécuter la migration sans erreur

3. **Meilleure gestion des slugs** :
   - Les slugs ne peuvent jamais être vides
   - Validation automatique via triggers

## 🧪 Vérification post-migration

Une fois la migration réussie, vérifiez :

```sql
-- Compter les catégories
SELECT COUNT(*) FROM categories;
-- Résultat attendu : 5

-- Compter les tags
SELECT COUNT(*) FROM tags;
-- Résultat attendu : 10

-- Vérifier qu'il n'y a pas de slugs vides
SELECT COUNT(*) FROM categories WHERE slug = '' OR slug IS NULL;
SELECT COUNT(*) FROM tags WHERE slug = '' OR slug IS NULL;
-- Résultat attendu pour les deux : 0

-- Tester la vue
SELECT COUNT(*) FROM texts_with_metadata;
-- Résultat attendu : 0 (pas encore de textes)
```

## 📝 Commandes rapides

### Nettoyage complet en une commande

```sql
-- À copier/coller directement dans SQL Editor
DROP TABLE IF EXISTS text_tags CASCADE;
DROP TABLE IF EXISTS texts CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP VIEW IF EXISTS texts_with_metadata CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS generate_slug(TEXT) CASCADE;
DROP FUNCTION IF EXISTS auto_generate_category_slug() CASCADE;
DROP FUNCTION IF EXISTS auto_generate_tag_slug() CASCADE;
```

Puis exécutez `20250107_create_texts_system_v2.sql`

## 🚀 Après la migration réussie

Une fois que vous voyez le message de succès :

1. ✅ Fermez le SQL Editor
2. ✅ Redémarrez votre serveur Next.js (`npm run dev`)
3. ✅ Testez l'application à `/admin/texts`
4. ✅ Confirmez-moi que tout fonctionne : "Migration OK"

Et je créerai immédiatement tous les composants UI manquants ! 🎉

## 🆘 En cas de problème persistant

Si vous avez toujours des erreurs :

1. **Envoyez-moi l'erreur exacte** que vous voyez
2. **Partagez le résultat** de ces requêtes :
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name LIKE '%tag%' OR table_name LIKE '%categor%';

   SELECT * FROM tags LIMIT 5;
   SELECT * FROM categories LIMIT 5;
   ```

Je pourrai alors vous aider plus précisément !
