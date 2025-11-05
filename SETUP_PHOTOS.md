# Configuration de la Galerie Photos

Ce document explique comment configurer le système de gestion de photos pour votre portfolio.

## 📋 Prérequis

- Un compte Supabase actif
- Les variables d'environnement Supabase configurées dans `.env`
- Un utilisateur admin créé dans Supabase Auth

## 🗄️ Configuration de la Base de Données

La table `photos` a été créée automatiquement via la migration. Elle contient :

- `id` : Identifiant unique (UUID)
- `title` : Titre de la photo (requis)
- `description` : Description (optionnel)
- `image_url` : URL publique de l'image
- `display_order` : Ordre d'affichage personnalisé
- `created_at` : Date de création

Les politiques RLS sont configurées pour :
- ✅ Lecture publique (tout le monde peut voir les photos)
- 🔒 Insertion, modification et suppression réservées aux utilisateurs authentifiés

## 📦 Configuration du Bucket de Stockage

### Étape 1 : Créer le Bucket

1. Connectez-vous à votre [Dashboard Supabase](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans **Storage** dans le menu latéral
4. Cliquez sur **New bucket**
5. Remplissez les informations :
   - **Name** : `photo-files`
   - **Public bucket** : ✅ Activé (cochez la case)
6. Cliquez sur **Create bucket**

### Étape 2 : Configurer les Politiques de Stockage

Le bucket doit avoir les politiques suivantes :

#### Politique de Lecture (SELECT)
- **Nom** : Public read access
- **Opération** : SELECT
- **Cible** : public
- **Condition** : `true`

#### Politique d'Insertion (INSERT)
- **Nom** : Authenticated users can upload
- **Opération** : INSERT
- **Cible** : authenticated
- **Condition** : `auth.role() = 'authenticated'`

#### Politique de Suppression (DELETE)
- **Nom** : Authenticated users can delete
- **Opération** : DELETE
- **Cible** : authenticated
- **Condition** : `auth.role() = 'authenticated'`

### Vérification

Pour vérifier que le bucket est correctement configuré :
1. Le bucket `photo-files` apparaît dans la liste
2. L'icône 🌐 (publique) est visible à côté du nom
3. Les politiques sont actives

## 👤 Création de l'Utilisateur Admin

### Méthode 1 : Via le Dashboard Supabase

1. Allez dans **Authentication** > **Users**
2. Cliquez sur **Add user** > **Create new user**
3. Remplissez :
   - **Email** : votre email admin
   - **Password** : un mot de passe sécurisé
   - **Auto Confirm User** : ✅ Activé
4. Cliquez sur **Create user**

### Méthode 2 : Via SQL

Exécutez cette requête dans l'éditeur SQL :

\`\`\`sql
-- Remplacez les valeurs par vos informations
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  role
)
VALUES (
  gen_random_uuid(),
  'admin@monsite.com',
  crypt('MonMotDePasseSecurise123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{}',
  'authenticated'
);
\`\`\`

## 🚀 Utilisation

### Accès Public

La galerie est accessible publiquement à l'adresse :
\`\`\`
https://votre-site.com/photos
\`\`\`

### Accès Administration

1. Connectez-vous via :
   \`\`\`
   https://votre-site.com/login
   \`\`\`

2. Utilisez les identifiants de l'utilisateur admin créé

3. Accédez à l'administration :
   \`\`\`
   https://votre-site.com/admin/photos
   \`\`\`

### Fonctionnalités

#### Page Publique (`/photos`)
- Galerie responsive (2-4 colonnes selon l'écran)
- Clic sur une photo pour ouvrir la lightbox
- Navigation avec flèches ou clavier
- Zoom sur les images
- Téléchargement des photos
- Partage via lien ou API native

#### Page Admin (`/admin/photos`)
- Upload de photos par drag-and-drop ou sélection
- Formulaire avec titre (requis) et description (optionnel)
- Liste des photos avec possibilité de suppression
- Réorganisation par glisser-déposer
- Statistiques de la galerie

## 📝 Formats et Limites

- **Formats acceptés** : JPEG, PNG, WebP, GIF
- **Taille maximale** : 5 MB par fichier
- **Résolution recommandée** : 1920x1080 ou supérieure pour une qualité optimale

## 🎨 Lightbox - Raccourcis Clavier

| Touche | Action |
|--------|--------|
| `←` | Photo précédente |
| `→` | Photo suivante |
| `Esc` | Fermer la lightbox |
| `+` | Zoom avant |
| `-` | Zoom arrière |

## 🔧 Dépannage

### Les photos ne s'affichent pas
- Vérifiez que le bucket `photo-files` est configuré en **Public**
- Vérifiez les politiques RLS de la table `photos`
- Vérifiez les politiques du bucket de stockage

### Impossible d'uploader des photos
- Vérifiez que vous êtes bien connecté
- Vérifiez que les politiques du bucket autorisent l'insertion pour les utilisateurs authentifiés
- Vérifiez la taille du fichier (max 5MB)
- Vérifiez le format du fichier (JPEG, PNG, WebP, GIF uniquement)

### Erreur lors de la connexion
- Vérifiez que l'utilisateur admin existe dans Supabase Auth
- Vérifiez que l'email est confirmé (`email_confirmed_at` non null)
- Vérifiez les variables d'environnement Supabase dans `.env`

## 📚 Structure des Fichiers

\`\`\`
project/
├── app/
│   ├── photos/page.tsx           # Page publique de la galerie
│   ├── admin/photos/page.tsx     # Page d'administration
│   └── login/page.tsx             # Page de connexion
├── components/
│   ├── photos/
│   │   ├── PhotoCard.tsx          # Carte individuelle de photo
│   │   ├── PhotoGrid.tsx          # Grille de photos
│   │   ├── PhotoViewerModal.tsx   # Lightbox avancée
│   │   ├── PhotoUploadForm.tsx    # Formulaire d'upload
│   │   └── PhotoList.tsx          # Liste admin avec gestion
│   └── ProtectedRoute.tsx         # HOC de protection des routes
├── contexts/
│   └── AuthContext.tsx            # Contexte d'authentification
├── lib/
│   └── supabase.ts                # Client Supabase
└── database/
    └── schema.sql                 # Schéma de la base de données
\`\`\`

## 🆘 Support

Pour toute question ou problème, consultez :
- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Next.js](https://nextjs.org/docs)
