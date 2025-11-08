# Portfolio

Portfolio personnel construit avec Next.js 13, présentant créations artistiques et professionnelles avec un système de double thème (clair/sombre + couleurs personnalisables).

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+
- npm ou yarn
- Un projet Supabase (gratuit)

### Installation

1. **Cloner le dépôt** (si applicable)
   ```bash
   git clone <url-du-repo>
   cd portfolio
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer Supabase**
   ```bash
   # Copier le fichier d'exemple
   cp .env.example .env.local
   ```

   Puis éditez `.env.local` avec vos clés Supabase :
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon
   ```

   📖 Voir **[SETUP_SUPABASE.md](./SETUP_SUPABASE.md)** pour les instructions détaillées

4. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```

   Ouvrez [http://localhost:3000](http://localhost:3000)

## 📁 Structure du projet

```
portfolio/
├── app/                    # Pages Next.js (App Router)
│   ├── layout.tsx         # Layout racine avec providers
│   ├── page.tsx           # Page d'accueil
│   ├── photos/            # Galerie photos
│   ├── musique/           # Créations musicales
│   ├── videos/            # Galerie vidéos
│   ├── textes/            # Créations textuelles
│   ├── applications/      # Portfolio d'applications
│   ├── a-propos/          # Page à propos
│   ├── contact/           # Page de contact
│   └── parametres/        # Paramètres d'apparence
├── components/            # Composants React
│   ├── ui/               # Composants shadcn/ui
│   ├── AppLayout.tsx     # Layout principal
│   ├── Sidebar.tsx       # Barre latérale
│   └── Topbar.tsx        # Barre supérieure
├── contexts/             # Contextes React
│   ├── ThemeContext.tsx      # Thème clair/sombre
│   ├── ColorThemeContext.tsx # Thème de couleur
│   └── AuthContext.tsx       # Authentification
├── services/             # Services (logique métier)
│   ├── authService.ts
│   ├── photoService.ts
│   └── storageService.ts
├── lib/                  # Utilitaires
│   ├── supabaseClient.ts # Client Supabase
│   └── utils.ts          # Fonctions utilitaires
└── public/               # Fichiers statiques
```

## 🛠️ Commandes disponibles

```bash
npm run dev        # Serveur de développement (port 3000)
npm run build      # Build de production (export statique)
npm start          # Serveur de production
npm run lint       # Vérifier le code (ESLint)
npm run typecheck  # Vérifier les types TypeScript
```

## 🎨 Technologies utilisées

- **Framework** : [Next.js 13](https://nextjs.org/) (App Router, Export Statique)
- **UI** : [React 18](https://react.dev/) + [Tailwind CSS](https://tailwindcss.com/)
- **Composants** : [shadcn/ui](https://ui.shadcn.com/) (Radix UI + Tailwind)
- **Backend** : [Supabase](https://supabase.com/) (Auth, Database, Storage)
- **Styling** : Tailwind CSS + CSS Variables pour thèmes
- **TypeScript** : Configuration stricte
- **Icônes** : [Lucide React](https://lucide.dev/)
- **Notifications** : [Sonner](https://sonner.emilkowal.ski/)

## ✨ Fonctionnalités

- ✅ Export statique Next.js (déployable partout)
- 🎨 Double système de thèmes :
  - Mode clair/sombre/système
  - 4 thèmes de couleurs prédéfinis + custom
- 📱 Design responsive
- 🔐 Authentification via Supabase
- 📸 Galerie photos
- 🎵 Lecteur de musique
- 🎬 Galerie vidéos
- ✍️ Créations textuelles
- 💼 Portfolio d'applications
- 🔄 Synchronisation en temps réel (Supabase)

## 📖 Documentation

### Pour les développeurs
- **[README.md](./README.md)** - Ce fichier (guide de démarrage)
- **[SETUP_SUPABASE.md](./SETUP_SUPABASE.md)** - Configuration Supabase détaillée

### Pour les agents IA
- **[AI_TOOLS.md](./AI_TOOLS.md)** - Guide des outils IA (Claude, Gemini, Codex)
- **[CLAUDE.md](./CLAUDE.md)** - Architecture et patterns du projet
- **[AGENTS.md](./AGENTS.md)** - Conventions de code pour agents IA

## 🚢 Déploiement

Le projet est configuré en **export statique** et peut être déployé sur :

- **Vercel** (recommandé pour Next.js)
- **Netlify**
- **GitHub Pages**
- **Tout hébergeur statique**

### Build pour production

```bash
npm run build
```

Les fichiers statiques seront générés dans le dossier `out/`.

### Variables d'environnement en production

Configurez les variables Supabase sur votre plateforme de déploiement :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🤝 Contribution

Si vous travaillez en équipe sur ce projet :

1. Lisez [CLAUDE.md](./CLAUDE.md) et [AGENTS.md](./AGENTS.md)
2. Suivez les conventions de code établies
3. Testez avec `npm run typecheck` et `npm run lint`
4. Vérifiez le responsive et les deux thèmes

## 📝 License

Ce projet est privé.

## 🆘 Support

En cas de problème :

1. Vérifiez que `.env.local` est correctement configuré
2. Consultez [SETUP_SUPABASE.md](./SETUP_SUPABASE.md)
3. Vérifiez les logs de la console navigateur
4. Assurez-vous que votre projet Supabase est actif
