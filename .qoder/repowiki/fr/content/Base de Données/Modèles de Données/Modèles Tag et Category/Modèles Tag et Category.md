# Modèles Tag et Category

<cite>
**Fichiers Référencés dans ce Document**
- [services/tagService.ts](file://services/tagService.ts)
- [services/categoryService.ts](file://services/categoryService.ts)
- [lib/supabaseClient.ts](file://lib/supabaseClient.ts)
- [supabase/migrations/20250107_create_texts_system.sql](file://supabase/migrations/20250107_create_texts_system.sql)
- [supabase/migrations/002_add_media_tags.sql](file://supabase/migrations/002_add_media_tags.sql)
- [components/texts/TagManager.tsx](file://components/texts/TagManager.tsx)
- [components/texts/CategoryManager.tsx](file://components/texts/CategoryManager.tsx)
- [components/texts/TextUploadForm.tsx](file://components/texts/TextUploadForm.tsx)
</cite>

## Table des Matières
1. [Introduction](#introduction)
2. [Structure des Modèles](#structure-des-modèles)
3. [Architecture des Tables](#architecture-des-tables)
4. [Services et Contrôleurs](#services-et-contrôleurs)
5. [Relations Many-to-Many](#relations-many-to-many)
6. [Gestion des Slugs et Couleurs](#gestion-des-slugs-et-couleurs)
7. [Utilisation Pratique](#utilisation-pratique)
8. [Bonnes Pratiques](#bonnes-pratiques)
9. [Exemples de Requêtes](#exemples-de-requêtes)
10. [Conclusion](#conclusion)

## Introduction

Les modèles Tag et Category constituent le système central d'organisation et de classification du contenu dans cette application. Ces modèles permettent une structuration flexible du contenu textuel tout en offrant des fonctionnalités avancées de tagging polymorphique pour les médias (musique, vidéos, photos).

Le système implémente une architecture robuste basée sur PostgreSQL avec Supabase, incluant des triggers automatiques pour la génération de slugs, des politiques de sécurité au niveau des lignes (RLS), et des vues matérialisées pour optimiser les performances.

## Structure des Modèles

### Modèle Tag

Le modèle Tag représente les étiquettes utilisées pour classifier et organiser le contenu textuel. Il possède les propriétés suivantes :

```mermaid
classDiagram
class Tag {
+string id
+string name
+string slug
+string color
+string created_at
+string updated_at
+generateSlug(name) string
+autoGenerateSlug() void
}
class TextTag {
+string text_id
+string tag_id
+string created_at
}
class MusicTag {
+string music_track_id
+string tag_id
+string created_at
}
class VideoTag {
+string video_id
+string tag_id
+string created_at
}
class PhotoTag {
+string photo_id
+string tag_id
+string created_at
}
Tag --> TextTag : "many-to-many"
Tag --> MusicTag : "many-to-many"
Tag --> VideoTag : "many-to-many"
Tag --> PhotoTag : "many-to-many"
```

**Sources du Diagramme**
- [lib/supabaseClient.ts](file://lib/supabaseClient.ts#L53-L60)
- [supabase/migrations/20250107_create_texts_system.sql](file://supabase/migrations/20250107_create_texts_system.sql#L38-L56)

### Modèle Category

Le modèle Category représente les catégories hiérarchiques utilisées pour organiser les textes principalement. Ses propriétés incluent :

```mermaid
classDiagram
class Category {
+string id
+string name
+string slug
+string description
+string color
+number display_order
+string created_at
+string updated_at
+generateSlug(name) string
+autoGenerateSlug() void
}
class Text {
+string id
+string title
+string category_id
+boolean is_published
}
Category --> Text : "one-to-many"
```

**Sources du Diagramme**
- [lib/supabaseClient.ts](file://lib/supabaseClient.ts#L42-L51)
- [supabase/migrations/20250107_create_texts_system.sql](file://supabase/migrations/20250107_create_texts_system.sql#L8-L22)

**Sources de Section**
- [lib/supabaseClient.ts](file://lib/supabaseClient.ts#L42-L60)

## Architecture des Tables

### Structure des Tables PostgreSQL

Le schéma de base de données utilise une approche de normalisation avec des tables spécialisées pour chaque type de contenu :

```mermaid
erDiagram
TAGS {
uuid id PK
text name UK
text slug UK
text color
timestamptz created_at
timestamptz updated_at
}
CATEGORIES {
uuid id PK
text name UK
text slug UK
text description
text color
integer display_order
timestamptz created_at
timestamptz updated_at
}
TEXTS {
uuid id PK
text title
text subtitle
text content
text excerpt
text author
date published_date
integer display_order
uuid category_id FK
uuid user_id FK
boolean is_published
integer view_count
timestamptz created_at
timestamptz updated_at
}
TEXT_TAGS {
uuid text_id FK
uuid tag_id FK
timestamptz created_at
}
MUSIC_TRACKS {
uuid id PK
text title
text artist
text album
text audio_url
text cover_image_url
integer duration
integer display_order
uuid user_id FK
timestamptz created_at
}
MUSIC_TAGS {
uuid music_track_id FK
uuid tag_id FK
timestamptz created_at
}
VIDEOS {
uuid id PK
text title
text description
text video_url
text thumbnail_url
integer duration
integer display_order
uuid user_id FK
timestamptz created_at
}
VIDEO_TAGS {
uuid video_id FK
uuid tag_id FK
timestamptz created_at
}
PHOTOS {
uuid id PK
text title
text description
text image_url
integer display_order
timestamptz created_at
}
PHOTO_TAGS {
uuid photo_id FK
uuid tag_id FK
timestamptz created_at
}
CATEGORIES ||--o{ TEXTS : "has"
TAGS ||--o{ TEXT_TAGS : "tagged_in"
TEXTS ||--o{ TEXT_TAGS : "has"
TAGS ||--o{ MUSIC_TAGS : "tagged_in"
MUSIC_TRACKS ||--o{ MUSIC_TAGS : "has"
TAGS ||--o{ VIDEO_TAGS : "tagged_in"
VIDEOS ||--o{ VIDEO_TAGS : "has"
TAGS ||--o{ PHOTO_TAGS : "tagged_in"
PHOTOS ||--o{ PHOTO_TAGS : "has"
```

**Sources du Diagramme**
- [supabase/migrations/20250107_create_texts_system.sql](file://supabase/migrations/20250107_create_texts_system.sql#L8-L104)
- [supabase/migrations/002_add_media_tags.sql](file://supabase/migrations/002_add_media_tags.sql#L7-L46)

### Index et Performances

Le système utilise plusieurs index pour optimiser les performances :

| Table | Index | But |
|-------|-------|-----|
| tags | idx_tags_slug | Recherche rapide par slug |
| tags | idx_tags_name | Recherche par nom |
| categories | idx_categories_slug | Recherche par slug |
| categories | idx_categories_display_order | Tri par ordre d'affichage |
| text_tags | idx_text_tags_text_id | Jointure efficace |
| text_tags | idx_text_tags_tag_id | Recherche de tags |

**Sources de Section**
- [supabase/migrations/20250107_create_texts_system.sql](file://supabase/migrations/20250107_create_texts_system.sql#L19-L22)
- [supabase/migrations/002_add_media_tags.sql](file://supabase/migrations/002_add_media_tags.sql#L15-L40)

## Services et Contrôleurs

### Service Tag

Le service Tag fournit une API complète pour la gestion des tags avec gestion du cache et validation des données :

```mermaid
sequenceDiagram
participant Client as "Composant Frontend"
participant TagService as "tagService"
participant Cache as "Cache Layer"
participant Supabase as "Supabase Client"
participant DB as "Base de Données"
Client->>TagService : getAllTags()
TagService->>Cache : get('tags : all')
Cache-->>TagService : Cache Miss
TagService->>Supabase : from('tags').select('*')
Supabase->>DB : SELECT * FROM tags ORDER BY name
DB-->>Supabase : Tags Data
Supabase-->>TagService : Tags
TagService->>Cache : set('tags : all', tags, TTL)
TagService-->>Client : {tags, error}
Note over Client,DB : Opérations CRUD avec invalidation de cache
```

**Sources du Diagramme**
- [services/tagService.ts](file://services/tagService.ts#L5-L27)

### Service Category

Le service Category offre des fonctionnalités similaires pour la gestion des catégories :

```mermaid
sequenceDiagram
participant Client as "Composant Frontend"
participant CategoryService as "categoryService"
participant Cache as "Cache Layer"
participant Supabase as "Supabase Client"
participant DB as "Base de Données"
Client->>CategoryService : createCategory(data)
CategoryService->>Supabase : insert(category)
Supabase->>DB : INSERT INTO categories
DB-->>Supabase : New Category
Supabase-->>CategoryService : Category Data
CategoryService->>Cache : invalidatePattern('categories : ')
CategoryService->>Cache : invalidatePattern('texts : ')
CategoryService-->>Client : {category, error}
Note over Client,DB : Gestion des ordres d'affichage
```

**Sources du Diagramme**
- [services/categoryService.ts](file://services/categoryService.ts#L50-L69)

**Sources de Section**
- [services/tagService.ts](file://services/tagService.ts#L1-L197)
- [services/categoryService.ts](file://services/categoryService.ts#L1-L115)

## Relations Many-to-Many

### Pattern de Relation

Le système implémente un pattern de relation many-to-many polymorphique qui permet aux tags d'être associés à différents types de contenu :

```mermaid
flowchart TD
A["Table Principale<br/>(texts, music_tracks, videos, photos)"] --> B["Table de Relation<br/>(text_tags, music_tags, video_tags, photo_tags)"]
B --> C["Table des Tags<br/>(tags)"]
A --> D["Clé Étrangère<br/>text_id/music_track_id/video_id/photo_id"]
B --> E["Clés Composites<br/>(text_id, tag_id)<br/>(music_track_id, tag_id)<br/>(video_id, tag_id)<br/>(photo_id, tag_id)"]
C --> F["Clé Étrangère<br/>tag_id"]
G["Cascade Delete"] --> H["Supprime les Relations<br/>Automatiquement"]
I["Index Composite"] --> J["Optimise les Requêtes<br/>de Jointure"]
```

**Sources du Diagramme**
- [supabase/migrations/002_add_media_tags.sql](file://supabase/migrations/002_add_media_tags.sql#L7-L46)

### Implémentation des Tables de Jointure

Chaque type de contenu dispose de sa propre table de relation :

| Table de Jointure | Contenu Associé | Clés Primaires |
|-------------------|-----------------|----------------|
| text_tags | Textes | (text_id, tag_id) |
| music_tags | Musique | (music_track_id, tag_id) |
| video_tags | Vidéos | (video_id, tag_id) |
| photo_tags | Photos | (photo_id, tag_id) |

**Sources de Section**
- [supabase/migrations/002_add_media_tags.sql](file://supabase/migrations/002_add_media_tags.sql#L7-L46)

## Gestion des Slugs et Couleurs

### Génération Automatique de Slugs

Le système utilise des fonctions PostgreSQL pour générer automatiquement les slugs à partir des noms :

```mermaid
flowchart LR
A["Nom Original<br/>(ex: 'JavaScript')"] --> B["convertToLowerCase()<br/>javascript"]
B --> C["replaceSpecialChars()<br/>javascript"]
C --> D["removeLeadingTrailingDashes()<br/>javascript"]
D --> E["Slug Final<br/>(javascript)"]
F["Fonction PostgreSQL<br/>generate_slug()"] --> G["Appel Automatique<br/>via Trigger"]
G --> H["Avant INSERT/UPDATE"]
H --> I["Mise à Jour du Champ slug"]
```

**Sources du Diagramme**
- [supabase/migrations/20250107_create_texts_system.sql](file://supabase/migrations/20250107_create_texts_system.sql#L228-L246)

### Validation des Couleurs

Le système valide et normalise les codes couleur hexadécimaux :

| Format Accepté | Exemple | Validation |
|---------------|---------|------------|
| #RRGGBB | #3b82f6 | 6 caractères hex + # |
| #RGB | #38f | Étendu à #3388ff |
| Sans # | 3b82f6 | Préfixé automatiquement |

**Sources de Section**
- [supabase/migrations/20250107_create_texts_system.sql](file://supabase/migrations/20250107_create_texts_system.sql#L228-L278)

## Utilisation Pratique

### Gestion des Tags dans les Textes

Le composant TagManager fournit une interface utilisateur complète pour la gestion des tags :

```mermaid
stateDiagram-v2
[*] --> Chargement
Chargement --> AffichageTags : Tags Chargés
Chargement --> Erreur : Échec Chargement
AffichageTags --> CreationTag : Nouveau Tag
AffichageTags --> EditionTag : Modifier Tag
AffichageTags --> SuppressionTag : Supprimer Tag
CreationTag --> Sauvegarde : Valider Formulaire
EditionTag --> Sauvegarde : Valider Formulaire
SuppressionTag --> Confirmation : Demander Confirmation
Sauvegarde --> Succes : Succeed
Sauvegarde --> Erreur : Fail
Confirmation --> SuppressionTag : Confirmer
Confirmation --> AffichageTags : Annuler
Succes --> AffichageTags : Rafraîchir Liste
Erreur --> AffichageTags : Afficher Message
AffichageTags --> [*]
```

**Sources du Diagramme**
- [components/texts/TagManager.tsx](file://components/texts/TagManager.tsx#L42-L339)

### Association de Tags aux Textes

Le processus d'association de tags aux textes suit un workflow standard :

```mermaid
sequenceDiagram
participant User as "Utilisateur"
participant Form as "TextUploadForm"
participant TagService as "tagService"
participant TextService as "textService"
participant DB as "Base de Données"
User->>Form : Sélectionner Tags
Form->>Form : Stocker selectedTagIds[]
User->>Form : Soumettre Formulaire
Form->>TextService : createTextWithTags(textData, tagIds)
TextService->>DB : INSERT INTO texts
DB-->>TextService : New Text ID
TextService->>TagService : setTagsForText(textId, tagIds)
TagService->>DB : DELETE FROM text_tags WHERE text_id = ?
TagService->>DB : INSERT INTO text_tags (text_id, tag_id)
TagService-->>TextService : Success/Failure
TextService-->>Form : Complete
Form-->>User : Confirmation
```

**Sources du Diagramme**
- [components/texts/TextUploadForm.tsx](file://components/texts/TextUploadForm.tsx#L90-L136)

**Sources de Section**
- [components/texts/TagManager.tsx](file://components/texts/TagManager.tsx#L1-L339)
- [components/texts/TextUploadForm.tsx](file://components/texts/TextUploadForm.tsx#L1-L200)

## Bonnes Pratiques

### Gestion des Performances

1. **Cache Intelligent** : Utilisation de mécanismes de cache avec invalidation automatique
2. **Index Stratégiques** : Index sur les colonnes fréquemment utilisées pour les recherches
3. **Requêtes Optimisées** : Utilisation de jointures efficaces et de vues matérialisées

### Sécurité et Validation

1. **Row Level Security** : Politiques de sécurité au niveau des lignes
2. **Validation côté Client** : Validation Zod pour les formulaires React
3. **Contraintes d'Intégrité** : Clés étrangères et contraintes de unicité

### Gestion des Conflits

1. **Slug Unique** : Génération automatique avec résolution de conflits
2. **Cascade Delete** : Suppression automatique des relations lors de la suppression
3. **Transactions** : Opérations atomiques pour maintenir l'intégrité

## Exemples de Requêtes

### Récupération de Tags par Texte

```sql
-- Requête pour obtenir tous les tags d'un texte spécifique
SELECT 
    t.id as tag_id,
    t.name,
    t.slug,
    t.color
FROM 
    text_tags tt
JOIN 
    tags t ON tt.tag_id = t.id
WHERE 
    tt.text_id = 'specific-text-id'
ORDER BY 
    t.name ASC;
```

### Requête de Recherche Avancée

```sql
-- Recherche de textes par tags multiples avec pagination
SELECT 
    t.*,
    json_agg(tags.*) as associated_tags
FROM 
    texts t
JOIN 
    text_tags tt ON t.id = tt.text_id
JOIN 
    tags tg ON tt.tag_id = tg.id
WHERE 
    tg.id IN ('tag-id-1', 'tag-id-2', 'tag-id-3')
    AND t.is_published = true
GROUP BY 
    t.id
ORDER BY 
    t.created_at DESC
LIMIT 20 OFFSET 0;
```

### Statistiques de Tags

```sql
-- Nombre d'utilisation de chaque tag dans les textes publiés
SELECT 
    tg.id,
    tg.name,
    tg.slug,
    COUNT(tt.text_id) as usage_count
FROM 
    tags tg
LEFT JOIN 
    text_tags tt ON tg.id = tt.tag_id
LEFT JOIN 
    texts t ON tt.text_id = t.id
WHERE 
    t.is_published = true
GROUP BY 
    tg.id
ORDER BY 
    usage_count DESC;
```

## Conclusion

Les modèles Tag et Category constituent un système d'organisation sophistiqué et extensible qui permet une classification flexible du contenu. Leur conception polymorphe garantit la réutilisabilité tout en maintenant la performance et la sécurité.

Les points forts du système incluent :
- Architecture modulaire et extensible
- Gestion automatique des slugs et des couleurs
- Sécurité au niveau des lignes (RLS)
- Optimisations de performance avec cache et index
- Interface utilisateur intuitive pour la gestion

Ce système forme la base solide d'une application de contenu riche, capable de s'adapter aux besoins évolutifs tout en maintenant des performances optimales.