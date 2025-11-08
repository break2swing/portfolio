# agents-update — Codex (CLI)
> Fichier: `/prompts/codex.md` — Utilise ce prompt pour une **troisième passe** focalisée “qualité & cohérence” (imports, types, petits refactors).

## Cible & contraintes (identiques aux autres prompts)
- Next.js App Router en **export statique** (`output: 'export'`, `images.unoptimized = true`).
- **Tailwind + shadcn/ui**, **sonner** dans `layout.tsx`, **Supabase** client dans `lib/`.
- **Services** TypeScript retournant `{ data, error }`; **UI** gère les toasts.
- **Contexts** de thème/couleurs + persistance `localStorage`.
- **Sidebar** 256/64 px + `localStorage.sidebarExpanded` + events `storage`/`sidebar-toggle`.
- **Pages** cibles : `/`, `/a-propos`, `/applications`, `/musique`, `/photos`, `/videos`, `/textes`, `/contact`, `/login`, `/parametres`.

## Objectifs de cette passe
1) **Nettoyage imports** (ordre déterministe) & ajout des `"use client"` manquants.  
2) **Durcir les types** (pas de `any`; types dédiés pour les entités Musique/Photo/Texte).  
3) **Factoriser** les helpers communs (toasts, formateurs, utils Supabase).  
4) **Stabiliser** les services (retours `{ data, error }` uniformes, erreurs typées).  
5) **Micro‑refactors** UI (composants `Card`, `Button`, `Input` shadcn/ui).

## Sortie attendue
- Liste des **points de friction** (fichier:ligne → suggestion).  
- **Patches** compacts par fichier.  
- **Commit message** + **PR notes** (centrés “qualité” / “cohérence”).

## Modèle de commit
refactor(core): normalize imports, strict types, consistent service responses and toast handling
