---
description: Met à jour CLAUDE.md et AGENTS.md après analyse du projet
tags: [project, documentation]
---

# Mise à jour de la documentation du projet

Tu dois analyser le projet et mettre à jour les fichiers CLAUDE.md et AGENTS.md pour refléter l'état actuel du codebase.

## Étapes à suivre

### 1. Lecture des fichiers existants

Lis d'abord les fichiers actuels :
- `@CLAUDE.md`
- `@AGENTS.md`

### 2. Analyse du projet

Analyse les éléments suivants du projet :

**Architecture et configuration** :
- `package.json` - Dépendances et scripts
- `tsconfig.json` - Configuration TypeScript
- `next.config.js` - Configuration Next.js
- `tailwind.config.ts` - Configuration Tailwind

**Structure de l'application** :
- `app/layout.tsx` - Layout principal
- `app/*/page.tsx` - Toutes les pages
- `components/AppLayout.tsx` - Layout client

**Contextes et état global** :
- `contexts/*.tsx` - Tous les contextes (Theme, ColorTheme, Auth, etc.)

**Services** :
- `services/*.ts` - Tous les services

**Composants principaux** :
- `components/Sidebar.tsx`
- `components/Topbar.tsx`
- Autres composants clés (pas ceux de `components/ui/`)

**Configuration de bibliothèques** :
- `lib/*.ts` - Utilitaires et clients (Supabase, etc.)

### 3. Identifier les changements

Compare l'état actuel du projet avec ce qui est documenté dans CLAUDE.md et AGENTS.md :

- Nouveaux contextes ou services ajoutés ?
- Nouvelles routes ou pages ?
- Nouvelles dépendances importantes ?
- Changements dans l'architecture ?
- Nouveaux patterns ou conventions ?
- Modifications dans la structure des providers ?

### 4. Mettre à jour CLAUDE.md

**CLAUDE.md** doit contenir :
- Vue d'ensemble du projet
- Commandes de développement
- Architecture high-level (nécessitant la lecture de plusieurs fichiers)
- Structure des routes
- Système de layouts
- Systèmes de thèmes et contextes
- Intégration backend (Supabase)
- Bibliothèque de composants
- Patterns de développement

**Ne PAS inclure** :
- Instructions évidentes
- Pratiques génériques de développement
- Informations qui peuvent être découvertes facilement

### 5. Mettre à jour AGENTS.md

**AGENTS.md** doit contenir :
- Conventions de nommage
- Structure des fichiers (templates)
- Ordre des imports
- Patterns à suivre (Client vs Server, gestion d'état, error handling)
- Workflows spécifiques (ajout de page, service, composant)
- Styling guidelines
- Points d'attention spécifiques au projet
- Conventions de langues

**Format des templates** :
- Toujours fournir des exemples de code concrets
- Montrer la structure attendue des fichiers

### 6. Validation

Vérifie que :
- Les deux fichiers sont cohérents entre eux
- Toutes les informations sont à jour
- Les exemples de code sont corrects
- Les chemins de fichiers sont exacts
- La hiérarchie des providers dans CLAUDE.md correspond au code actuel
- Les nouveaux services/contextes sont documentés

## Format de sortie

Après l'analyse, tu dois :

1. **Lister les changements identifiés** sous forme de bullet points
2. **Mettre à jour CLAUDE.md** avec les modifications nécessaires
3. **Mettre à jour AGENTS.md** avec les modifications nécessaires
4. **Résumer les modifications** effectuées dans chaque fichier

## Instructions importantes

- Sois exhaustif dans ton analyse
- Vérifie TOUS les contextes dans `contexts/`
- Vérifie TOUS les services dans `services/`
- Liste toutes les routes actuelles
- Vérifie la structure réelle des providers dans `app/layout.tsx`
- Maintiens le format et la structure existants des fichiers
- N'invente pas d'information - vérifie toujours le code source
