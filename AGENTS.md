# AGENTS.md

Ce fichier contient les conventions, patterns et workflows spécifiques pour les agents d'IA travaillant sur ce projet.

## Conventions de Code

### Naming Conventions

- **Composants React** : PascalCase (ex: `AppLayout`, `ThemeToggle`)
- **Hooks personnalisés** : camelCase avec préfixe `use` (ex: `useTheme`, `useAuth`)
- **Services** : camelCase avec suffixe `Service` (ex: `authService`, `photoService`)
- **Contextes** : PascalCase avec suffixe `Context` (ex: `ThemeContext`, `AuthContext`)
- **Fichiers** : Match le nom du composant/service principal

### Structure des Fichiers

#### Composants React
```tsx
'use client'; // Si nécessaire

import { ... } from '...';

interface ComponentProps {
  // Props typées
}

export function ComponentName({ props }: ComponentProps) {
  // Hooks en premier
  // États locaux
  // Effets
  // Handlers

  return (
    // JSX
  );
}
```

#### Services
```ts
import { supabaseClient } from '@/lib/supabaseClient';

export const serviceName = {
  async method() {
    // Logique
  },
};
```

#### Contextes
```tsx
'use client';

import { createContext, useContext, ... } from 'react';

interface ContextType {
  // Types
}

const Context = createContext<ContextType | undefined>(undefined);

export function ContextProvider({ children }: { children: React.ReactNode }) {
  // Logic
  return <Context.Provider value={...}>{children}</Context.Provider>;
}

export function useContextName() {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error('useContextName doit être utilisé à l\'intérieur d\'un ContextProvider');
  }
  return context;
}
```

### Imports

Ordre des imports :
1. Imports React
2. Imports Next.js
3. Imports de bibliothèques tierces
4. Imports locaux (`@/...`)
5. Imports de types

```tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@supabase/supabase-js';
```

## Patterns à Suivre

### Client vs Server Components

**Utiliser 'use client' pour** :
- Composants avec hooks (useState, useEffect, etc.)
- Composants avec event handlers
- Composants utilisant des contextes
- Composants avec animations/interactions

**Garder en Server Component** :
- Layouts avec metadata uniquement
- Composants purement statiques sans interactivité

### Gestion d'État

**localStorage** :
- Préférences UI (sidebar, thèmes)
- Toujours vérifier l'existence avant lecture
- Pattern : `localStorage.getItem('key') ?? defaultValue`

**Contexts** :
- État global partagé (auth, thèmes)
- Toujours fournir un hook custom (`useContextName`)
- Toujours vérifier que le contexte existe dans le hook

**State local** :
- État spécifique au composant
- Formulaires (ou utiliser React Hook Form pour complexité)

### Error Handling

```tsx
// Services - retourner { data, error }
async function serviceMethod() {
  try {
    const { data, error } = await supabaseCall();
    if (error) return { data: null, error };
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

// Composants - gérer avec toast
const handleAction = async () => {
  const { error } = await service.method();
  if (error) {
    toast.error('Message d\'erreur');
    return;
  }
  toast.success('Succès !');
};
```

### Styling

- **Toujours utiliser Tailwind CSS** pour le styling
- Utiliser les classes `cn()` de `lib/utils` pour les conditional classes
- Respecter le système de design de shadcn/ui
- Classes de couleur via variables CSS : `bg-primary`, `text-accent`, etc.

```tsx
import { cn } from '@/lib/utils';

<div className={cn(
  "base-classes",
  condition && "conditional-classes",
  className // Prop optionnelle
)} />
```

## Workflows Spécifiques

### Ajout d'un Nouveau Composant UI

1. Utiliser shadcn/ui CLI si disponible : `npx shadcx-ui@latest add [component]`
2. Sinon, créer dans `components/ui/` en suivant le pattern shadcn
3. Toujours exporter avec des noms explicites
4. Documenter les variants dans le composant

### Ajout d'une Nouvelle Page

1. Créer dossier dans `app/[route]/`
2. Créer `page.tsx` avec export default
3. Ajouter l'entrée dans la Sidebar si navigation nécessaire
4. Tester le responsive design
5. Vérifier le fonctionnement en mode clair/sombre

### Ajout d'un Service

1. Créer fichier dans `services/` avec suffix `Service.ts`
2. Export en tant qu'objet avec méthodes async
3. Pattern : toujours retourner `{ data, error }`
4. Importer le client Supabase si nécessaire
5. Créer le hook context si état global requis

### Modification des Thèmes

**Thème clair/sombre** :
- Modifier `contexts/ThemeContext.tsx`
- Utiliser les classes Tailwind `dark:` pour les styles conditionnels

**Couleurs** :
- Modifier `contexts/ColorThemeContext.tsx` pour les presets
- Variables CSS : `--theme-primary`, `--theme-secondary`, `--theme-accent`
- Format HSL : `"200 90% 50%"` (sans `hsl()`)

## Commandes Utiles pour les Agents

```bash
# Vérifier les types avant commit
npm run typecheck

# Vérifier le linting
npm run lint

# Build pour vérifier l'export statique
npm run build

# Développement
npm run dev
```

## Points d'Attention

### Export Statique

- Pas de `getServerSideProps` ou `getStaticProps` (App Router)
- Images doivent avoir `unoptimized: true`
- Pas d'API routes dans `app/api/` (ne fonctionnera pas)
- Variables d'environnement : Préfixer avec `NEXT_PUBLIC_` pour client-side

### Supabase

- Toujours utiliser les services, jamais appeler directement le client dans les composants
- Les appels Supabase sont async - gérer le loading state
- Vérifier les erreurs avec `if (error)` systématiquement

### Performance

- Éviter les re-renders inutiles avec `useMemo`, `useCallback`
- Lazy load les composants lourds si nécessaire
- Optimiser les images (format WebP recommandé)

### Accessibilité

- shadcn/ui gère l'accessibilité de base
- Toujours ajouter des labels aux inputs
- Tester la navigation au clavier
- Vérifier le contraste des couleurs personnalisées

## Languages

- **Interface** : Français
- **Code** : Anglais (noms de variables, fonctions, commentaires techniques)
- **Messages utilisateur** : Français
- **Documentation** : Français
