# agents-update — Gemini‑CLI
> Fichier: `/prompts/gemini.md` — Utilise ce prompt avec Gemini‑CLI pour une **seconde passe de vérification** et de complétion.

## Rôle
Effectuer un **cross‑check** de l’implémentation proposée (ou existante) et **compléter** ce qui manque en respectant strictement les conventions et contraintes ci‑dessous.

## Contraintes (miroir Claude)
- Next.js (App Router), `output: 'export'`, `images.unoptimized = true`.
- Tailwind + shadcn/ui ; `app/layout.tsx` contient `<Toaster />` (sonner).
- Supabase via `lib/supabaseClient.ts` ; services en `{ data, error }` uniquement.
- Contexts thème/couleurs + persistance `localStorage`.
- Sidebar 256/64 px + `localStorage.sidebarExpanded` + events `storage`/`sidebar-toggle`.
- Pages: `/`, `/a-propos`, `/applications`, `/musique`, `/photos`, `/videos`, `/textes`, `/contact`, `/login`, `/parametres`.

## Actions attendues
1) **Analyser** l’état du repo et **signaler précisément** les écarts vs contraintes.  
2) **Proposer les corrections minimales** (diffs/patches file‑par‑file).  
3) **Compléter** les pages/services manquants (musique/photos/textes/parametres).  
4) **Normaliser** les imports / `"use client"` / typage strict.  
5) **Valider** les scripts `typecheck`, `lint`, `build` (export).

## Sortie attendue (Gemini)
- Tableau “Écarts → Correctifs” (fichier/ligne → action).  
- Patches complets, prêts à coller.  
- Message de commit + checklist de vérif.

## Checklist finale
- [ ] `next.config.js` ok (`export` + images unoptimized)  
- [ ] `app/layout.tsx` → `<Toaster />` présent  
- [ ] `ThemeContext` + `ColorThemeContext` actifs & persistés  
- [ ] `/musique` player & tri `displayOrder`  
- [ ] `/photos` grid + upload Supabase + toasts  
- [ ] `/textes` markdown OK  
- [ ] `/parametres` bascule thème + presets  
- [ ] Services `{ data, error }` + UI toasts  
- [ ] Lint, typecheck & build ✅
