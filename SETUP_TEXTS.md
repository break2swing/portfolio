# Configuration du système de textes

Ce guide explique comment configurer et utiliser le système complet de textes avec catégories et tags.

## 📋 Table des matières

1. [Migration de la base de données](#migration-de-la-base-de-données)
2. [Fonctionnalités](#fonctionnalités)
3. [Structure des tables](#structure-des-tables)
4. [Utilisation](#utilisation)
5. [API des services](#api-des-services)

## 🗄️ Migration de la base de données

### Étape 1 : Exécuter la migration SQL

Connectez-vous à votre instance Supabase et exécutez le script de migration :

```bash
# Depuis le dashboard Supabase
# SQL Editor > New query > Collez le contenu du fichier :
supabase/migrations/20250107_create_texts_system.sql
```

Ou via la CLI Supabase :

```bash
supabase db push --file supabase/migrations/20250107_create_texts_system.sql
```

### Étape 2 : Vérifier la création des tables

Vérifiez que les tables suivantes ont été créées :

- ✅ `categories` - Catégories de textes
- ✅ `tags` - Tags pour classifier les textes
- ✅ `texts` - Textes/articles principaux
- ✅ `text_tags` - Relation many-to-many entre texts et tags

### Étape 3 : Vérifier les policies RLS

Toutes les tables ont Row Level Security (RLS) activé avec les policies suivantes :

**Lecture publique** :
- Tout le monde peut lire les catégories et tags
- Seuls les textes publiés (`is_published = true`) sont visibles publiquement
- Les utilisateurs authentifiés peuvent voir leurs propres textes non publiés

**Création/Modification** :
- Réservée aux utilisateurs authentifiés
- Les utilisateurs ne peuvent modifier/supprimer que leurs propres textes

## 🎯 Fonctionnalités

### Page publique `/textes`

- **Grid responsive** avec cartes de textes
- **Filtrage** par catégorie et tags
- **Recherche** full-text sur titre et contenu
- **Modal de lecture** avec rendu Markdown complet
- **Métadonnées** : auteur, date, catégorie, tags
- **Compteur de vues** automatique

### Page admin `/admin/texts`

- **Ajout de textes** avec éditeur Markdown + aperçu en temps réel
- **Édition de textes** existants
- **Gestion des catégories** : CRUD complet + drag & drop
- **Gestion des tags** : CRUD complet
- **Attribution** de catégorie et tags aux textes
- **Publication/Brouillon** : toggle `is_published`
- **Réorganisation** par drag & drop
- **Suppression** avec confirmation

## 📊 Structure des tables

### Table `texts`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Identifiant unique |
| `title` | TEXT | Titre du texte (requis) |
| `subtitle` | TEXT | Sous-titre (optionnel) |
| `content` | TEXT | Contenu Markdown (requis) |
| `excerpt` | TEXT | Résumé court (optionnel) |
| `author` | TEXT | Nom de l'auteur (optionnel) |
| `published_date` | DATE | Date de publication (optionnel) |
| `display_order` | INTEGER | Ordre d'affichage |
| `category_id` | UUID | Référence vers categories |
| `user_id` | UUID | Référence vers auth.users |
| `is_published` | BOOLEAN | Statut de publication |
| `view_count` | INTEGER | Nombre de vues |
| `created_at` | TIMESTAMPTZ | Date de création |
| `updated_at` | TIMESTAMPTZ | Date de mise à jour |

### Table `categories`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Identifiant unique |
| `name` | TEXT | Nom de la catégorie (unique) |
| `slug` | TEXT | Slug URL-friendly (unique, auto-généré) |
| `description` | TEXT | Description de la catégorie |
| `color` | TEXT | Couleur hex pour l'UI |
| `display_order` | INTEGER | Ordre d'affichage |

### Table `tags`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Identifiant unique |
| `name` | TEXT | Nom du tag (unique) |
| `slug` | TEXT | Slug URL-friendly (unique, auto-généré) |
| `color` | TEXT | Couleur hex pour l'UI |

### Table `text_tags`

| Colonne | Type | Description |
|---------|------|-------------|
| `text_id` | UUID | Référence vers texts |
| `tag_id` | UUID | Référence vers tags |

## 🚀 Utilisation

### 1. Créer des catégories

```typescript
import { categoryService } from '@/services/categoryService';

const { category, error } = await categoryService.createCategory({
  name: 'Développement',
  description: 'Articles sur le développement web',
  color: '#3b82f6',
  display_order: 0
});
```

### 2. Créer des tags

```typescript
import { tagService } from '@/services/tagService';

const { tag, error } = await tagService.createTag({
  name: 'React',
  color: '#61dafb'
});
```

### 3. Créer un texte

```typescript
import { textService } from '@/services/textService';

const { text, error } = await textService.createText({
  title: 'Introduction à Next.js',
  subtitle: 'Le framework React pour la production',
  content: '# Titre\n\nContenu en **Markdown**',
  excerpt: 'Découvrez Next.js...',
  author: 'John Doe',
  published_date: '2025-01-07',
  category_id: 'uuid-de-la-categorie',
  is_published: true,
  display_order: 0
});
```

### 4. Ajouter des tags à un texte

```typescript
import { tagService } from '@/services/tagService';

await tagService.setTagsForText(textId, [tagId1, tagId2, tagId3]);
```

### 5. Récupérer des textes avec métadonnées

```typescript
import { textService } from '@/services/textService';

const { texts, error } = await textService.getTextsWithMetadata();

// Retourne les textes avec category et tags inclus
console.log(texts[0].category); // { name: 'Développement', color: '#3b82f6', ... }
console.log(texts[0].tags); // [{ name: 'React', ... }, { name: 'Next.js', ... }]
```

## 📚 API des services

### categoryService

```typescript
// CRUD
getAllCategories() // Liste toutes les catégories
getCategoryById(id) // Récupère une catégorie par ID
getCategoryBySlug(slug) // Récupère une catégorie par slug
createCategory(data) // Crée une catégorie
updateCategory(id, updates) // Met à jour une catégorie
deleteCategory(id) // Supprime une catégorie
getMaxDisplayOrder() // Récupère l'ordre max
```

### tagService

```typescript
// CRUD
getAllTags() // Liste tous les tags
getTagById(id) // Récupère un tag par ID
getTagBySlug(slug) // Récupère un tag par slug
createTag(data) // Crée un tag
updateTag(id, updates) // Met à jour un tag
deleteTag(id) // Supprime un tag

// Relations
getTagsForText(textId) // Récupère les tags d'un texte
addTagToText(textId, tagId) // Ajoute un tag à un texte
removeTagFromText(textId, tagId) // Retire un tag d'un texte
setTagsForText(textId, tagIds) // Définit tous les tags d'un texte
```

### textService

```typescript
// CRUD
getAllTexts() // Liste tous les textes (publiés)
getTextById(id) // Récupère un texte par ID
createText(data) // Crée un texte
updateText(id, updates) // Met à jour un texte
deleteText(id) // Supprime un texte
getMaxDisplayOrder() // Récupère l'ordre max

// Avec métadonnées
getTextsWithMetadata() // Textes + category + tags
getPublishedTexts() // Seulement les textes publiés
getTextsByCategory(categoryId) // Textes d'une catégorie
getTextsByTag(tagId) // Textes d'un tag
searchTexts(query) // Recherche full-text
```

## 🎨 Personnalisation

### Couleurs des catégories et tags

Les couleurs sont stockées au format hex (ex: `#3b82f6`). Elles sont utilisées dans l'UI pour :
- Badges de catégories
- Chips de tags
- Filtres visuels

### Slug auto-généré

Les slugs sont générés automatiquement à partir du nom via un trigger SQL :
- Conversion en minuscules
- Remplacement des caractères accentués
- Remplacement des espaces par des tirets

Exemple : `"Développement Web"` → `"developpement-web"`

## 🔒 Sécurité

### RLS (Row Level Security)

Toutes les tables ont RLS activé. Les policies garantissent :

1. **Lecture publique** des données publiées
2. **Création** réservée aux utilisateurs authentifiés
3. **Modification/Suppression** réservées au propriétaire

### Validation côté client

- Titre requis (min 1 caractère)
- Contenu requis (min 1 caractère)
- Validation des couleurs hex
- Slugs uniques vérifiés

## 📝 Notes

- **Markdown** : Supporte GFM (GitHub Flavored Markdown)
- **Recherche** : Index full-text sur `title` et `content` (langue française)
- **Performance** : Index sur les colonnes fréquemment utilisées
- **Cascade** : La suppression d'une catégorie met `category_id` à NULL (pas de suppression en cascade)
- **Cascade** : La suppression d'un texte supprime ses relations avec les tags

## 🐛 Dépannage

### Les textes ne s'affichent pas

Vérifiez que :
1. ✅ La table `texts` existe
2. ✅ Les policies RLS sont activées
3. ✅ Les textes ont `is_published = true`
4. ✅ L'utilisateur est authentifié (si textes non publiés)

### Erreur de slug unique

Si vous obtenez une erreur de contrainte unique sur le slug :
- Changez le nom de la catégorie/tag
- Ou définissez manuellement un slug unique

### Erreur lors de l'ajout de tags

Vérifiez que :
1. ✅ L'utilisateur est propriétaire du texte
2. ✅ Les IDs des tags existent
3. ✅ La table `text_tags` existe

## 📦 Dépendances

```json
{
  "react-markdown": "^9.x",
  "remark-gfm": "^4.x",
  "date-fns": "^3.x",
  "sonner": "^1.x"
}
```

## 🔄 Migrations futures

Pour ajouter de nouvelles fonctionnalités :

1. Créez un nouveau fichier de migration dans `supabase/migrations/`
2. Nommez-le avec le format : `YYYYMMDD_description.sql`
3. Exécutez-le via Supabase CLI ou dashboard
4. Mettez à jour les types TypeScript dans `lib/supabaseClient.ts`
5. Mettez à jour les services correspondants
