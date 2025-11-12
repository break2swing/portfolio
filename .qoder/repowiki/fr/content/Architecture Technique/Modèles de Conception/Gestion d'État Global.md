# Système de Gestion d'État Global basé sur React Context

<cite>
**Fichiers Référencés dans ce Document**
- [AuthContext.tsx](file://contexts/AuthContext.tsx)
- [ThemeContext.tsx](file://contexts/ThemeContext.tsx)
- [ColorThemeContext.tsx](file://contexts/ColorThemeContext.tsx)
- [useAuth.ts](file://hooks/useAuth.ts)
- [authService.ts](file://services/authService.ts)
- [layout.tsx](file://app/layout.tsx)
- [ThemeToggle.tsx](file://components/ThemeToggle.tsx)
- [LoginPage.tsx](file://app/login/page.tsx)
- [ProtectedRoute.tsx](file://components/ProtectedRoute.tsx)
</cite>

## Table des Matières
1. [Introduction](#introduction)
2. [Architecture du Système](#architecture-du-système)
3. [AuthContext : Gestion de l'Authentification](#authcontext-gestion-de-lauthentification)
4. [ThemeContext : Gestion du Mode Clair/Sombre](#themectexture-gestion-du-mode-clairsombre)
5. [ColorThemeContext : Gestion des Thèmes de Couleurs](#colorthemectexture-gestion-des-thèmes-de-couleurs)
6. [Pattern Provider/Consumer](#pattern-providerconsumer)
7. [Persistance dans localStorage](#persistance-dans-localstorage)
8. [Utilisation dans les Composants](#utilisation-dans-les-composants)
9. [Erreurs Courantes](#erreurs-courantes)
10. [Bonnes Pratiques](#bonnes-pratiques)
11. [Conclusion](#conclusion)

## Introduction

Le système de gestion d'état global de cette application Next.js utilise React Context pour maintenir et synchroniser l'état entre différents composants. Le projet implémente trois contextes principaux qui gèrent respectivement l'authentification utilisateur, le thème visuel (clair/sombre), et les thèmes de couleurs personnalisés. Chaque contexte suit un pattern bien défini avec persistance dans localStorage et gestion des effets de bord.

## Architecture du Système

Le système est organisé autour de trois contextes spécialisés qui fonctionnent indépendamment mais peuvent interagir :

```mermaid
graph TB
subgraph "Couche de Présentation"
UI[Composants UI]
Layout[AppLayout]
end
subgraph "Couche de Contexte"
AuthCtx[AuthContext]
ThemeCtx[ThemeContext]
ColorCtx[ColorThemeContext]
end
subgraph "Couche de Services"
AuthService[authService]
LocalStorage[localStorage]
end
subgraph "Couche de Données"
Supabase[Supabase]
end
UI --> AuthCtx
UI --> ThemeCtx
UI --> ColorCtx
Layout --> AuthCtx
Layout --> ThemeCtx
Layout --> ColorCtx
AuthCtx --> AuthService
AuthService --> Supabase
AuthCtx --> LocalStorage
ThemeCtx --> LocalStorage
ColorCtx --> LocalStorage
```

**Sources du Diagramme**
- [layout.tsx](file://app/layout.tsx#L30-L40)
- [AuthContext.tsx](file://contexts/AuthContext.tsx#L17-L61)
- [ThemeContext.tsx](file://contexts/ThemeContext.tsx#L16-L86)
- [ColorThemeContext.tsx](file://contexts/ColorThemeContext.tsx#L45-L109)

## AuthContext : Gestion de l'Authentification

### Rôle et Responsabilités

Le `AuthContext` gère l'état d'authentification de l'utilisateur avec les propriétés suivantes :
- **user** : Objet utilisateur ou null
- **session** : Session active ou null
- **loading** : Indicateur de chargement initial
- **signIn** : Fonction d'authentification
- **signOut** : Fonction de déconnexion

### Structure du Contexte

```mermaid
classDiagram
class AuthContextType {
+User user
+Session session
+boolean loading
+signIn(email, password) Promise~AuthResult~
+signOut() Promise~void~
}
class AuthProvider {
-useState~User~ user
-useState~Session~ session
-useState~boolean~ loading
+useEffect() void
+signIn(email, password) Promise~AuthResult~
+signOut() Promise~void~
}
class AuthService {
+getSession() Promise~SessionData~
+signIn(email, password) Promise~AuthResult~
+signOut() Promise~void~
+onAuthStateChange(callback) Subscription
}
AuthProvider --> AuthContextType : "fournit"
AuthProvider --> AuthService : "utilise"
AuthContextType --> AuthService : "dépend de"
```

**Sources du Diagramme**
- [AuthContext.tsx](file://contexts/AuthContext.tsx#L7-L13)
- [AuthService.ts](file://services/authService.ts#L4-L31)

### Initialisation Asynchrone

Le contexte initialise l'état de manière asynchrone lors du montage :

```mermaid
sequenceDiagram
participant Component as "Composant"
participant AuthProvider as "AuthProvider"
participant AuthService as "authService"
participant Supabase as "Supabase"
Component->>AuthProvider : Montage
AuthProvider->>AuthService : getSession()
AuthService->>Supabase : auth.getSession()
Supabase-->>AuthService : Session data
AuthService-->>AuthProvider : {session}
AuthProvider->>AuthProvider : setSession(session)
AuthProvider->>AuthProvider : setUser(session?.user ?? null)
AuthProvider->>AuthProvider : setLoading(false)
AuthProvider->>AuthService : onAuthStateChange()
AuthService-->>AuthProvider : Subscription
Note over AuthProvider : Écoute les changements d'état
```

**Sources du Diagramme**
- [AuthContext.tsx](file://contexts/AuthContext.tsx#L22-L37)
- [authService.ts](file://services/authService.ts#L5-L31)

### Gestion des Effets de Bord

Le contexte gère plusieurs effets de bord critiques :

1. **Récupération initiale de la session** : Chargement de l'état depuis Supabase
2. **Écoute des changements d'état** : Synchronisation en temps réel
3. **Nettoyage des abonnements** : Évite les fuites mémoire

**Sources de la Section**
- [AuthContext.tsx](file://contexts/AuthContext.tsx#L22-L37)

## ThemeContext : Gestion du Mode Clair/Sombre

### Fonctionnalités Avancées

Le `ThemeContext` offre un système de thématisation sophistiqué avec trois modes :
- **light** : Thème clair
- **dark** : Thème sombre
- **system** : Suivi des préférences système

### Architecture du Système de Thème

```mermaid
flowchart TD
Start([Initialisation]) --> LoadStored["Charger depuis localStorage"]
LoadStored --> SetState["setState(theme)"]
SetState --> Mount["Montage useEffect"]
Mount --> WatchSystem{"Mode 'system'?"}
WatchSystem --> |Oui| ListenMedia["Écouter mediaQuery"]
WatchSystem --> |Non| ApplyTheme["Appliquer thème"]
ListenMedia --> MediaChange{"Changement média?"}
MediaChange --> |Oui| UpdateTheme["Mettre à jour thème"]
MediaChange --> |Non| ApplyTheme
UpdateTheme --> ApplyTheme
ApplyTheme --> AddClass["Ajouter classe 'dark'"]
AddClass --> End([Fin])
ApplyTheme --> RemoveClass["Retirer classe 'dark'"]
RemoveClass --> End
```

**Sources du Diagramme**
- [ThemeContext.tsx](file://contexts/ThemeContext.tsx#L21-L63)

### Cycle de Vie des Thèmes

Le système gère automatiquement la synchronisation entre le thème sélectionné et les préférences système :

```mermaid
stateDiagram-v2
[*] --> System : Mode 'system'
[*] --> Light : Mode 'light'
[*] --> Dark : Mode 'dark'
System --> Light : Préférences système = clair
System --> Dark : Préférences système = sombre
Light --> System : Changement mode
Light --> Dark : Cycle de thème
Dark --> System : Changement mode
Dark --> Light : Cycle de thème
Light --> Dark : Cycle de thème
Dark --> Light : Cycle de thème
```

**Sources du Diagramme**
- [ThemeContext.tsx](file://contexts/ThemeContext.tsx#L35-L58)

**Sources de la Section**
- [ThemeContext.tsx](file://contexts/ThemeContext.tsx#L1-L96)
- [ThemeToggle.tsx](file://components/ThemeToggle.tsx#L1-L27)

## ColorThemeContext : Gestion des Thèmes de Couleurs

### Système de Couleurs Personnalisées

Le `ColorThemeContext` permet une personnalisation avancée des couleurs avec support des thèmes prédéfinis et personnalisés :

#### Thèmes Prédéfinis
- **ocean** : Bleu océan
- **forest** : Vert forêt
- **sun** : Jaune soleil  
- **rose** : Rose pâle

#### Couleurs CSS Variables
Le système utilise des variables CSS pour appliquer les couleurs :
- `--theme-primary` : Couleur principale
- `--theme-secondary` : Couleur secondaire
- `--theme-accent` : Couleur d'accentuation

### Architecture des Thèmes de Couleurs

```mermaid
classDiagram
class ColorThemeContextType {
+ColorThemeName colorTheme
+setColorTheme(theme) void
+ColorTheme customColors
+setCustomColors(colors) void
}
class ColorTheme {
+string primary
+string secondary
+string accent
}
class PresetThemes {
+Record~ColorThemeName, ColorTheme~ ocean
+Record~ColorThemeName, ColorTheme~ forest
+Record~ColorThemeName, ColorTheme~ sun
+Record~ColorThemeName, ColorTheme~ rose
}
ColorThemeContextType --> ColorTheme : "contient"
PresetThemes --> ColorTheme : "fournit"
ColorThemeContextType --> PresetThemes : "utilise"
```

**Sources du Diagramme**
- [ColorThemeContext.tsx](file://contexts/ColorThemeContext.tsx#L5-L34)
- [ColorThemeContext.tsx](file://contexts/ColorThemeContext.tsx#L36-L42)

### Gestion des Couleurs Personnalisées

Le système permet aux utilisateurs de créer leurs propres thèmes de couleurs :

```mermaid
sequenceDiagram
participant User as "Utilisateur"
participant Component as "Composant"
participant ColorContext as "ColorThemeContext"
participant Storage as "localStorage"
participant DOM as "Document"
User->>Component : Sélectionner thème personnalisé
Component->>ColorContext : setColorTheme('custom')
ColorContext->>Storage : localStorage.setItem('colorTheme', 'custom')
ColorContext->>DOM : Appliquer couleurs personnalisées
User->>Component : Modifier couleurs
Component->>ColorContext : setCustomColors(newColors)
ColorContext->>Storage : localStorage.setItem('customColors', JSON.stringify)
ColorContext->>DOM : Mettre à jour variables CSS
```

**Sources du Diagramme**
- [ColorThemeContext.tsx](file://contexts/ColorThemeContext.tsx#L84-L98)

**Sources de la Section**
- [ColorThemeContext.tsx](file://contexts/ColorThemeContext.tsx#L1-L119)

## Pattern Provider/Consumer

### Hiérarchie des Providers

Le système utilise une hiérarchie de providers imbriqués pour organiser l'accès aux contextes :

```mermaid
graph TD
HTML[html] --> ThemeProvider[ThemeProvider]
ThemeProvider --> ColorThemeProvider[ColorThemeProvider]
ColorThemeProvider --> AuthProvider[AuthProvider]
AuthProvider --> AppLayout[AppLayout]
AppLayout --> Children[Composants enfants]
style HTML fill:#e1f5fe
style ThemeProvider fill:#f3e5f5
style ColorThemeProvider fill:#f3e5f5
style AuthProvider fill:#fff3e0
```

**Sources du Diagramme**
- [layout.tsx](file://app/layout.tsx#L30-L40)

### Implémentation du Pattern

Chaque contexte suit le même pattern structuré :

1. **Création du Contexte** : `createContext<ContextType>()`
2. **Provider personnalisé** : `function ContextProvider()`
3. **Hook d'accès** : `function useContextHook()`
4. **Gestion d'erreur** : Vérification de l'environnement

**Sources de la Section**
- [layout.tsx](file://app/layout.tsx#L1-L45)

## Persistance dans localStorage

### Stratégies de Persistance

Chaque contexte implémente sa propre stratégie de persistance :

| Contexte | Clé localStorage | Type de données | Durée |
|----------|------------------|-----------------|-------|
| ThemeContext | `'theme'` | `'light' \| 'dark' \| 'system'` | Session |
| ColorThemeContext | `'colorTheme'` | `'ocean' \| 'forest' \| 'sun' \| 'rose' \| 'custom'` | Session |
| ColorThemeContext | `'customColors'` | `JSON.stringify(ColorTheme)` | Session |

### Mécanisme de Synchronisation

```mermaid
flowchart LR
subgraph "Modification État"
StateChange[Changement d'état]
StateChange --> UpdateState[Mise à jour useState]
UpdateState --> UpdateStorage[Mise à jour localStorage]
end
subgraph "Chargement Initial"
PageLoad[Chargement page]
PageLoad --> ReadStorage[Lecture localStorage]
ReadStorage --> SetInitialState[Définition état initial]
end
subgraph "Gestion Erreurs"
ParseError[Gestion erreurs JSON]
ParseError --> DefaultValues[Valeurs par défaut]
end
UpdateStorage --> ReadStorage
SetInitialState --> ParseError
```

**Sources du Diagramme**
- [ThemeContext.tsx](file://contexts/ThemeContext.tsx#L22-L26)
- [ColorThemeContext.tsx](file://contexts/ColorThemeContext.tsx#L54-L70)

**Sources de la Section**
- [ThemeContext.tsx](file://contexts/ThemeContext.tsx#L22-L26)
- [ColorThemeContext.tsx](file://contexts/ColorThemeContext.tsx#L54-L70)

## Utilisation dans les Composants

### Hook useAuth : Encapsulation de la Logique

Le hook `useAuth` fournit une interface simplifiée pour interagir avec l'authentification :

```mermaid
sequenceDiagram
participant Component as "Composant"
participant UseAuth as "useAuth"
participant AuthContext as "AuthContext"
participant AuthService as "authService"
Component->>UseAuth : useAuth()
UseAuth->>AuthContext : useContext(AuthContext)
AuthContext-->>UseAuth : Valeurs du contexte
UseAuth-->>Component : {user, session, loading, signIn, signOut}
Component->>UseAuth : signIn(email, password)
UseAuth->>AuthService : authService.signIn()
AuthService-->>UseAuth : {error}
UseAuth-->>Component : {error}
```

**Sources du Diagramme**
- [useAuth.ts](file://hooks/useAuth.ts#L1-L2)
- [AuthContext.tsx](file://contexts/AuthContext.tsx#L64-L70)

### Exemple d'Utilisation dans un Composant

Voici comment utiliser les contextes dans un composant typique :

```typescript
// Exemple d'utilisation dans un composant de profil
export function UserProfile() {
  const { user, loading, signIn, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { colorTheme, setColorTheme } = useColorTheme();
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div className="profile-container">
      {user ? (
        <div className="user-info">
          <h2>Bienvenue, {user.email}</h2>
          <button onClick={signOut}>Se déconnecter</button>
        </div>
      ) : (
        <div className="auth-options">
          <button onClick={() => signIn('email', 'password')}>
            Se connecter
          </button>
        </div>
      )}
      
      {/* Contrôles de thème */}
      <div className="theme-controls">
        <button onClick={() => setTheme('light')}>
          Thème clair
        </button>
        <button onClick={() => setColorTheme('ocean')}>
          Thème océan
        </button>
      </div>
    </div>
  );
}
```

### Composant de Protection d'Accès

Le `ProtectedRoute` illustre l'utilisation du contexte d'authentification pour protéger les routes :

```mermaid
flowchart TD
RouteAccess[Accès route protégée] --> CheckAuth["Vérifier authentification"]
CheckAuth --> Loading{"En cours de chargement?"}
Loading --> |Oui| ShowLoader["Afficher loader"]
Loading --> |Non| CheckUser{"Utilisateur connecté?"}
CheckUser --> |Non| Redirect["Redirection vers login"]
CheckUser --> |Oui| RenderChildren["Rendre contenu"]
ShowLoader --> CheckAuth
Redirect --> End([Fin])
RenderChildren --> End
```

**Sources du Diagramme**
- [ProtectedRoute.tsx](file://components/ProtectedRoute.tsx#L1-L34)

**Sources de la Section**
- [useAuth.ts](file://hooks/useAuth.ts#L1-L2)
- [LoginPage.tsx](file://app/login/page.tsx#L1-L97)
- [ProtectedRoute.tsx](file://components/ProtectedRoute.tsx#L1-L34)

## Erreurs Courantes

### 1. Oubli d'Envelopper avec le Provider

**Problème** : Utilisation de `useContext` sans le Provider correspondant

**Solution** : Toujours envelopper l'application avec les providers nécessaires

```typescript
// ❌ Incorrect
function App() {
  const { user } = useAuth(); // Erreur !
  return <div>{user?.email}</div>;
}

// ✅ Correct
function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ColorThemeProvider>
          <ProtectedRoute>
            <MainApp />
          </ProtectedRoute>
        </ColorThemeProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
```

### 2. Accès à un Contexte Non Initialisé

**Problème** : Tentative d'accès à un contexte avant son initialisation

**Solution** : Vérifier l'état de chargement approprié

```typescript
// ❌ Incorrect
function UserProfile() {
  const { user } = useAuth();
  return <div>{user.email}</div>; // user peut être null
}

// ✅ Correct
function UserProfile() {
  const { user, loading } = useAuth();
  
  if (loading) return <Loading />;
  if (!user) return <SignInPrompt />;
  
  return <div>{user.email}</div>;
}
```

### 3. Gestion Inadéquate des Erreurs

**Problème** : Ignorer les erreurs retournées par les fonctions de contexte

**Solution** : Traiter systématiquement les erreurs

```typescript
// ❌ Incorrect
const { signIn } = useAuth();
await signIn(email, password); // Erreur non gérée

// ✅ Correct
const { signIn } = useAuth();
const { error } = await signIn(email, password);
if (error) {
  console.error('Erreur de connexion:', error.message);
  // Afficher message à l'utilisateur
}
```

### 4. Fuites Mémoire

**Problème** : Ne pas nettoyer les abonnements aux événements

**Solution** : Retourner une fonction de nettoyage dans `useEffect`

```typescript
// ✅ Correct
useEffect(() => {
  const subscription = authService.onAuthStateChange(handleAuthChange);
  return () => subscription.unsubscribe(); // Nettoyage
}, []);
```

## Bonnes Pratiques

### 1. Organisation des Fichiers

- **Separation des responsabilités** : Chaque contexte dans son propre fichier
- **Export unifié** : Hooks dans des fichiers dédiés pour simplifier l'import
- **Types explicites** : Interfaces TypeScript bien définies

### 2. Gestion des Performances

- **Mémorisation** : Utilisation de `useMemo` et `useCallback` pour optimiser les re-rendus
- **Lazy loading** : Chargement différé des providers lorsque possible
- **Évitement des re-rendus inutiles** : Structuration appropriée des valeurs fournies

### 3. Accessibilité

- **Attributs ARIA** : Utilisation appropriée des attributs pour l'accessibilité
- **Focus management** : Gestion du focus lors des changements d'état
- **Feedback utilisateur** : Messages d'état et feedback visuel

### 4. Tests et Maintenance

- **Tests unitaires** : Tests des logiques de contexte
- **Documentation** : Commentaires explicites sur les responsabilités
- **Monitoring** : Surveillance des performances et erreurs

## Conclusion

Le système de gestion d'état global basé sur React Context proposé dans ce projet représente une approche robuste et scalable pour gérer l'état partagé dans une application Next.js. L'architecture modulaire avec trois contextes spécialisés permet une séparation claire des responsabilités tout en maintenant une cohérence globale.

Les points forts du système incluent :

- **Séparation des préoccupations** : Chaque contexte gère un domaine spécifique
- **Persistance intelligente** : Utilisation de localStorage pour la persistance
- **Gestion d'erreurs robuste** : Vérifications appropriées et gestion des cas d'erreur
- **Performance optimisée** : Mémorisation et optimisations React
- **Accessibilité** : Respect des bonnes pratiques d'accessibilité

Cette architecture constitue une base solide pour le développement d'applications React complexes tout en maintenant la lisibilité et la maintenabilité du code.