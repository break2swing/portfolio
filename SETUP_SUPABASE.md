# Configuration Supabase

Ce document explique comment configurer Supabase pour ce projet.

## 1. Créer un projet Supabase

1. Allez sur [https://app.supabase.com](https://app.supabase.com)
2. Créez un compte si vous n'en avez pas
3. Cliquez sur "New Project"
4. Remplissez les informations :
   - **Name** : portfolio (ou le nom de votre choix)
   - **Database Password** : Choisissez un mot de passe sécurisé
   - **Region** : Choisissez la région la plus proche
   - **Pricing Plan** : Free tier suffit pour commencer

## 2. Obtenir les clés API

1. Une fois le projet créé, allez dans **Settings** > **API**
2. Copiez les valeurs suivantes :
   - **Project URL** : `https://xxxxx.supabase.co`
   - **anon/public key** : Une longue chaîne commençant par `eyJ...`

## 3. Configurer les variables d'environnement

1. Ouvrez le fichier `.env.local` à la racine du projet
2. Remplacez les valeurs placeholder :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

3. **Important** : Redémarrez le serveur de développement après avoir modifié `.env.local`

```bash
# Arrêtez le serveur (Ctrl+C) puis relancez :
npm run dev
```

## 4. Créer les tables dans Supabase

Le projet utilise deux tables principales : `photos` et `music_tracks`.

### Table `photos`

```sql
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX photos_display_order_idx ON photos(display_order);

-- RLS (Row Level Security)
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Policy : Tout le monde peut lire
CREATE POLICY "Photos are viewable by everyone"
  ON photos FOR SELECT
  USING (true);

-- Policy : Seuls les utilisateurs authentifiés peuvent créer/modifier
CREATE POLICY "Authenticated users can insert photos"
  ON photos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update photos"
  ON photos FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete photos"
  ON photos FOR DELETE
  USING (auth.role() = 'authenticated');
```

### Table `music_tracks`

```sql
CREATE TABLE music_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  artist TEXT,
  album TEXT,
  audio_url TEXT NOT NULL,
  cover_image_url TEXT,
  duration INTEGER,
  display_order INTEGER NOT NULL DEFAULT 0,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX music_tracks_display_order_idx ON music_tracks(display_order);
CREATE INDEX music_tracks_user_id_idx ON music_tracks(user_id);

-- RLS (Row Level Security)
ALTER TABLE music_tracks ENABLE ROW LEVEL SECURITY;

-- Policy : Tout le monde peut lire
CREATE POLICY "Music tracks are viewable by everyone"
  ON music_tracks FOR SELECT
  USING (true);

-- Policy : Seuls les utilisateurs authentifiés peuvent créer/modifier
CREATE POLICY "Authenticated users can insert music tracks"
  ON music_tracks FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update their music tracks"
  ON music_tracks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their music tracks"
  ON music_tracks FOR DELETE
  USING (auth.uid() = user_id);
```

### Créer les tables via l'interface Supabase

1. Dans votre projet Supabase, allez dans **SQL Editor**
2. Cliquez sur **New Query**
3. Copiez-collez le SQL ci-dessus (d'abord `photos`, puis `music_tracks`)
4. Cliquez sur **Run** pour exécuter chaque requête

## 5. Configurer le Storage (optionnel)

Si vous souhaitez uploader des images/audio :

1. Allez dans **Storage** dans votre projet Supabase
2. Créez deux buckets :
   - `photos` (public)
   - `music` (public)

3. Configurez les policies pour permettre l'upload :

```sql
-- Policy pour le bucket photos
CREATE POLICY "Public Access to photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'photos');

CREATE POLICY "Authenticated users can upload photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'photos' AND auth.role() = 'authenticated');

-- Policy pour le bucket music
CREATE POLICY "Public Access to music"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'music');

CREATE POLICY "Authenticated users can upload music"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'music' AND auth.role() = 'authenticated');
```

## 6. Authentification

Le projet utilise l'authentification email/password par défaut de Supabase.

### Créer un utilisateur de test

1. Allez dans **Authentication** > **Users**
2. Cliquez sur **Add user** > **Create new user**
3. Entrez un email et mot de passe
4. L'utilisateur pourra se connecter via l'interface de votre application

## Vérification

Une fois tout configuré, votre application devrait démarrer sans erreur :

```bash
npm run dev
```

Vous devriez voir :
- ✓ Ready in X.Xs
- Pas d'erreur "Variables d'environnement Supabase manquantes"

## Dépannage

### Erreur "Variables d'environnement Supabase manquantes"

- Vérifiez que `.env.local` existe à la racine du projet
- Vérifiez que les variables commencent par `NEXT_PUBLIC_`
- Redémarrez le serveur de développement

### Erreur de connexion Supabase

- Vérifiez que l'URL et la clé sont correctes
- Vérifiez que votre projet Supabase est actif
- Vérifiez votre connexion internet

### Erreur 401 (Unauthorized)

- Vérifiez les policies RLS sur vos tables
- Assurez-vous que les policies permettent l'accès public en lecture

## Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [Supabase avec Next.js](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
