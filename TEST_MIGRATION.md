# 🧪 Test de la migration SQL - Système de textes

Ce guide vous permet de tester la migration SQL étape par étape avant de déployer le reste du système.

## 📋 Prérequis

- ✅ Compte Supabase actif
- ✅ Projet Supabase configuré (variables `.env.local`)
- ✅ Accès au SQL Editor de Supabase

## 🚀 Étape 1 : Ouvrir le SQL Editor

1. Connectez-vous à [https://supabase.com](https://supabase.com)
2. Sélectionnez votre projet
3. Dans le menu latéral, cliquez sur **SQL Editor**
4. Cliquez sur **New query**

## 📝 Étape 2 : Exécuter la migration

1. Ouvrez le fichier `supabase/migrations/20250107_create_texts_system.sql`
2. Copiez **tout le contenu** du fichier
3. Collez-le dans le SQL Editor de Supabase
4. Cliquez sur **RUN** (ou `Ctrl + Enter`)

### ✅ Résultat attendu

Vous devriez voir :

```
NOTICE:  Migration terminée avec succès !
NOTICE:  Tables créées : categories, tags, texts, text_tags
NOTICE:  Vue créée : texts_with_metadata
NOTICE:  RLS activé sur toutes les tables
```

Si vous voyez des erreurs, consultez la section [Dépannage](#-dépannage) ci-dessous.

## 🔍 Étape 3 : Vérifier les tables

### 3.1 Vérifier la création des tables

Dans le SQL Editor, exécutez :

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('categories', 'tags', 'texts', 'text_tags')
ORDER BY table_name;
```

**Résultat attendu** : 4 lignes
```
categories
tags
text_tags
texts
```

### 3.2 Vérifier les catégories par défaut

```sql
SELECT id, name, slug, color, display_order
FROM categories
ORDER BY display_order;
```

**Résultat attendu** : 5 catégories
```
Développement  | developpement  | #3b82f6 | 0
Design         | design         | #8b5cf6 | 1
Technologie    | technologie    | #10b981 | 2
Tutoriels      | tutoriels      | #f59e0b | 3
Opinion        | opinion        | #ef4444 | 4
```

### 3.3 Vérifier les tags par défaut

```sql
SELECT id, name, slug, color
FROM tags
ORDER BY name;
```

**Résultat attendu** : 10 tags
```
CSS         | css        | #1572b6
DevOps      | devops     | #0db7ed
Git         | git        | #f05032
HTML        | html       | #e34f26
JavaScript  | javascript | #f7df1e
Next.js     | nextjs     | #000000
Node.js     | nodejs     | #339933
Python      | python     | #3776ab
React       | react      | #61dafb
TypeScript  | typescript | #3178c6
```

## 🧪 Étape 4 : Tester les fonctionnalités

### 4.1 Tester la génération automatique de slug

Créez une catégorie sans spécifier de slug :

```sql
INSERT INTO categories (name, description, color, display_order)
VALUES ('Test Génération', 'Test du slug auto', '#ff0000', 10)
RETURNING id, name, slug;
```

**Résultat attendu** :
```
name: Test Génération
slug: test-generation
```

Le slug doit être généré automatiquement !

### 4.2 Tester la création d'un texte

**Important** : Remplacez `YOUR_USER_ID` par votre UUID utilisateur (trouvable dans Authentication > Users)

```sql
INSERT INTO texts (
  title,
  subtitle,
  content,
  excerpt,
  author,
  published_date,
  category_id,
  user_id,
  is_published,
  display_order
)
VALUES (
  'Premier article de test',
  'Un sous-titre accrocheur',
  '# Introduction\n\nCeci est un article de **test** en Markdown.\n\n## Section 1\n\nContenu...',
  'Ceci est un résumé court de l''article pour la page d''accueil',
  'John Doe',
  '2025-01-07',
  (SELECT id FROM categories WHERE slug = 'developpement'),
  'YOUR_USER_ID',
  true,
  0
)
RETURNING id, title, slug, is_published;
```

**Note** : Si vous n'avez pas d'utilisateur, l'insertion échouera à cause des policies RLS. Dans ce cas, créez d'abord un compte via la page `/login` de votre application.

### 4.3 Tester l'ajout de tags à un texte

```sql
-- Récupérer les IDs
SELECT id FROM texts WHERE title = 'Premier article de test'; -- Notez cet ID
SELECT id FROM tags WHERE name IN ('React', 'Next.js', 'TypeScript'); -- Notez ces IDs

-- Ajouter les relations (remplacez les UUIDs)
INSERT INTO text_tags (text_id, tag_id) VALUES
  ('UUID_DU_TEXTE', 'UUID_TAG_REACT'),
  ('UUID_DU_TEXTE', 'UUID_TAG_NEXTJS'),
  ('UUID_DU_TEXTE', 'UUID_TAG_TYPESCRIPT');
```

### 4.4 Tester la vue `texts_with_metadata`

```sql
SELECT
  title,
  category_name,
  category_color,
  tags
FROM texts_with_metadata
WHERE title = 'Premier article de test';
```

**Résultat attendu** :
```json
{
  "title": "Premier article de test",
  "category_name": "Développement",
  "category_color": "#3b82f6",
  "tags": [
    {"name": "React", "slug": "react", "color": "#61dafb"},
    {"name": "Next.js", "slug": "nextjs", "color": "#000000"},
    {"name": "TypeScript", "slug": "typescript", "color": "#3178c6"}
  ]
}
```

## 🔒 Étape 5 : Tester les RLS Policies

### 5.1 Vérifier que RLS est activé

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('categories', 'tags', 'texts', 'text_tags');
```

**Résultat attendu** : Toutes les tables doivent avoir `rowsecurity = true`

### 5.2 Tester la lecture publique

Déconnectez-vous de Supabase et testez l'accès public :

```sql
-- En tant que visiteur anonyme (via anon key)
SELECT id, title, is_published FROM texts WHERE is_published = true;
```

**Résultat attendu** : Seuls les textes avec `is_published = true` sont visibles

### 5.3 Tester la création sans authentification

```sql
-- Doit échouer
INSERT INTO texts (title, content, user_id, display_order)
VALUES ('Test sans auth', 'Contenu', NULL, 0);
```

**Résultat attendu** : `new row violates row-level security policy`

## 📊 Étape 6 : Vérifier les index

```sql
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('categories', 'tags', 'texts', 'text_tags')
ORDER BY tablename, indexname;
```

**Résultat attendu** : Plusieurs index créés pour optimiser les performances :
- `idx_categories_slug`
- `idx_categories_display_order`
- `idx_tags_slug`
- `idx_tags_name`
- `idx_texts_category_id`
- `idx_texts_display_order`
- `idx_texts_is_published`
- `idx_texts_search` (full-text)
- `idx_text_tags_text_id`
- `idx_text_tags_tag_id`

## ✅ Étape 7 : Test final avec l'application

1. **Redémarrez votre serveur de développement** :
   ```bash
   npm run dev
   ```

2. **Connectez-vous** via `/login`

3. **Accédez à** `/admin/texts`

4. **Essayez d'ajouter un texte** via le formulaire

5. **Vérifiez** que le texte apparaît sur `/textes`

### Comportement attendu

- ✅ La page charge sans erreur
- ✅ Le formulaire d'ajout fonctionne
- ✅ Le texte est sauvegardé en base
- ✅ Le texte apparaît dans la liste admin
- ✅ Le texte s'affiche sur la page publique (si `is_published = true`)

## 🐛 Dépannage

### Erreur : "relation already exists"

**Cause** : Les tables existent déjà

**Solution** : Supprimez les tables existantes avant de relancer la migration :

```sql
DROP TABLE IF EXISTS text_tags CASCADE;
DROP TABLE IF EXISTS texts CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP VIEW IF EXISTS texts_with_metadata;
DROP FUNCTION IF EXISTS generate_slug(TEXT);
DROP FUNCTION IF EXISTS auto_generate_category_slug();
DROP FUNCTION IF EXISTS auto_generate_tag_slug();
DROP FUNCTION IF EXISTS update_updated_at_column();
```

Puis relancez la migration complète.

### Erreur : "permission denied"

**Cause** : Problème de droits RLS

**Solution** : Vérifiez que vous êtes connecté comme propriétaire du projet Supabase dans le SQL Editor.

### Erreur : "invalid input syntax for type uuid"

**Cause** : UUID invalide dans les INSERT de test

**Solution** : Remplacez les UUIDs par des valeurs valides depuis votre base.

### Les textes ne s'affichent pas sur `/textes`

**Vérifications** :

1. Le texte existe en base :
   ```sql
   SELECT id, title, is_published FROM texts;
   ```

2. Le texte est publié :
   ```sql
   UPDATE texts SET is_published = true WHERE title = 'Votre titre';
   ```

3. Vous êtes connecté (si textes non publiés)

4. La policy RLS permet la lecture :
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'texts';
   ```

## 🎉 Succès !

Si tous les tests passent, votre migration est réussie ! Vous pouvez maintenant :

1. ✅ **Signaler à Claude** que la migration est OK
2. ✅ **Demander la suite** : implémentation des composants UI restants
3. ✅ **Commencer à utiliser** le système dès maintenant

## 📞 Support

Si vous rencontrez des problèmes non couverts ici :

1. Consultez `SETUP_TEXTS.md` pour plus de détails
2. Vérifiez les logs Supabase dans le dashboard
3. Testez les queries individuellement dans le SQL Editor

---

**Prêt pour la suite ?** Une fois la migration testée et validée, Claude pourra compléter le système avec tous les composants UI et fonctionnalités avancées !
