# agents-update — Claude‑Code
> Fichier: `/prompts/claude.md` — Colle ce prompt dans Claude‑Code et lance la tâche “agents-update”.

## Objectif
Mettre à jour le portfolio **Next.js (App Router)** en “export statique” pour présenter musique, photos, vidéos, textes et apps, en respectant les conventions d’architecture et d’UI définies dans le repo (AGENTS.md, CLAUDE.md).

## Contexte attendu du repo
- **Next.js** (App Router) avec `next.config.js` → `output: 'export'` et `images.unoptimized = true`.
- **Tailwind CSS** + **shadcn/ui** (UI minimaliste).
- **Supabase** : `lib/supabaseClient.ts` pour **auth** + **storage**.
- **Toasts** via **sonner** monté dans `app/layout.tsx`.
- **Thèmes** via `ThemeContext` (clair/sombre) + `ColorThemeContext` (presets + custom).
- **Sidebar** 256/64 px, état persisté `localStorage.sidebarExpanded`, événements `storage` & `sidebar-toggle`.
- **Pages** cibles : `/`, `/a-propos`, `/applications`, `/musique`, `/photos`, `/videos`, `/textes`, `/contact`, `/login`, `/parametres`.

## Règles & conventions (à appliquer strictement)
- **Imports** ordonnés : React → Next → libs tierces → `@/...` → types.
- **Composants interactifs** : ajouter `"use client"` en tête.
- **Services** : pattern `{ data, error }` (pas d’exception levée) + **toasts** de succès/échec dans l’UI.
- **Types** : TypeScript strict, pas de `any` implicite.
- **Arbo** : `app/`, `components/`, `contexts/`, `services/`, `lib/supabaseClient.ts`.

## Tâches (priorisées)
1) **Export statique** : vérifier `next.config.js` (`output: 'export'`, `images.unoptimized = true`).  
2) **Layout & toasts** : s’assurer que `app/layout.tsx` contient le `<Toaster />` (sonner).  
3) **Contexts** : `ThemeContext` + `ColorThemeContext` (persistences en `localStorage`).  
4) **/musique** : page avec listing (tri par `displayOrder`) + player HTML5 minimal ; service `musicService` (CRUD stub si besoin).  
5) **/photos** : grid responsive + upload vers Supabase Storage ; `photoService` (`getAllPhotos`, `getById`, `create`, `update`, `delete`, `updateDisplayOrder`).  
6) **/textes** : rendu Markdown (ex: `react-markdown`) + aperçu.  
7) **/parametres** : bascule clair/sombre + presets couleurs (lecture/écriture `localStorage`).  
8) **Services & erreurs** : tous les services retournent `{ data, error }`; l’UI affiche les toasts correspondants.  
9) **Qualité** : corriger linting & types ; maintenir les imports triés.

## Format de sortie attendu (Claude)
1. **Plan** très bref (puces).  
2. **Liste des fichiers** à créer/modifier.  
3. **Patches** sous forme de blocs par fichier (ou `*** Begin Patch`/`*** End Patch`).  
4. **Message de commit** concis + **description de PR** (checklist).

## Tests d’acceptation (doivent passer localement)
- `npm run typecheck` ✅  
- `npm run lint` ✅  
- `npm run build` (export statique) ✅  
- Toggle sidebar : état reflété par `localStorage.sidebarExpanded`.  
- Toasts visibles sur succès/erreur de création/suppression photo.

## Garde‑fous
- Ne pas créer d’API routes serveur (export statique).  
- Ne pas introduire de dépendances lourdes inutiles.  
- Respecter la separation `services/` vs UI.  
- Ne pas stocker de secrets dans le repo (utiliser `.env.local`).

## Modèle de message de commit
chore(app): scaffold musique/photos/textes, services supabase, toasts sonner, thèmes, export statique

## Modèle de description de PR
- [x] Export statique activé (images non optimisées)
- [x] Toaster sonner dans `layout.tsx`
- [x] Contexts thème & couleurs (persistés)
- [x] Pages: musique (player), photos (grid+upload), textes (markdown), paramètres
- [x] Services TS avec `{ data, error }`
- [x] Lint & typecheck passent
