# Plan d'implémentation : Partage social amélioré

## Vue d'ensemble

Créer un système de partage social complet avec un composant `ShareButton` réutilisable qui offre :

- Menu déroulant avec Web Share API et boutons sociaux (Twitter, Facebook, LinkedIn, Email)
- Génération d'URLs avec paramètres UTM pour analytics
- Copie de lien améliorée avec toast de confirmation
- Support du partage d'images avec métadonnées Open Graph
- Fallback gracieux si Web Share API non disponible

## Fichiers à créer

### 1. `lib/shareUtils.ts` (nouveau)

Utilitaires pour générer les URLs de partage et gérer les différents réseaux sociaux.

**Fonctions à implémenter** :

- `generateShareUrl(url: string, type: 'photo' | 'text' | 'music' | 'video'): string` - Génère URL avec paramètres UTM
- `getTwitterShareUrl(url: string, text: string, title: string): string` - URL Twitter
- `getFacebookShareUrl(url: string): string` - URL Facebook
- `getLinkedInShareUrl(url: string, title: string, summary?: string): string` - URL LinkedIn
- `getEmailShareUrl(url: string, subject: string, body: string): string` - URL Email (mailto:)
- `copyToClipboard(text: string): Promise<boolean>` - Copie dans le presse-papiers avec gestion d'erreur
- `canUseWebShare(): boolean` - Vérifie si Web Share API est disponible

**Paramètres UTM** :

- `utm_source`: nom du réseau social (twitter, facebook, linkedin, email, copy)
- `utm_medium`: 'social' pour réseaux sociaux, 'copy' pour copie de lien
- `utm_campaign`: type de contenu (photo, text, music, video)

### 2. `components/ShareButton.tsx` (nouveau)

Composant réutilisable avec menu déroulant utilisant `DropdownMenu` de shadcn/ui.

**Props** :

```typescript
interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
  imageUrl?: string; // Pour Open Graph (photos)
  type: 'photo' | 'text' | 'music' | 'video';
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}
```

**Fonctionnalités** :

- Bouton déclencheur avec icône `Share2` de lucide-react
- Menu déroulant avec options :
  - "Partager via..." (Web Share API si disponible)
  - Séparateur
  - Twitter (icône + texte)
  - Facebook (icône + texte)
  - LinkedIn (icône + texte)
  - Email (icône + texte)
  - Séparateur
  - Copier le lien (icône + texte)
- Gestion des erreurs avec toast (`toast.error`)
- Toast de succès pour copie de lien (`toast.success`)
- Ouverture des réseaux sociaux dans nouvelle fenêtre (`window.open` avec `noopener,noreferrer`)

**Icônes** :

- Utiliser lucide-react : `Share2`, `Twitter`, `Facebook`, `Linkedin`, `Mail`, `Link`
- Si icônes spécifiques non disponibles, utiliser des SVG ou des icônes génériques

## Fichiers à modifier

### 3. `components/photos/PhotoViewerModal.tsx`

Remplacer le bouton de partage actuel (lignes 188-195) par le composant `ShareButton`.

**Modifications** :

- Importer `ShareButton` depuis `@/components/ShareButton`
- Remplacer le `Button` avec `onClick={handleShare}` par `<ShareButton>`
- Passer les props appropriées :
  - `url`: URL de la page photos avec hash pour identifier la photo (`${window.location.origin}/photos#photo-${currentPhoto.id}`)
  - `title`: `currentPhoto.title`
  - `description`: `currentPhoto.description || currentPhoto.title`
  - `imageUrl`: `currentPhoto.image_url` (pour Open Graph)
  - `type`: `'photo'`
- Supprimer la fonction `handleShare` (lignes 86-120) car gérée par `ShareButton`

### 4. `components/texts/TextDetailModal.tsx`

Ajouter le composant `ShareButton` dans le header de la modale.

**Modifications** :

- Importer `ShareButton` depuis `@/components/ShareButton`
- Ajouter le bouton dans `DialogHeader` après les métadonnées (date/auteur)
- Passer les props :
  - `url`: `${window.location.origin}/textes#text-${text.id}`
  - `title`: `text.title`
  - `description`: `text.excerpt || text.subtitle || text.title`
  - `type`: `'text'`
- Positionner le bouton de manière appropriée (ex: à droite du titre ou dans une barre d'actions)

### 5. `components/music/AudioPlayer.tsx`

Ajouter le composant `ShareButton` dans la section d'informations du morceau.

**Modifications** :

- Importer `ShareButton` depuis `@/components/ShareButton`
- Ajouter le bouton près du titre/artiste (ligne 233-245)
- Passer les props :
  - `url`: `${window.location.origin}/musique#track-${currentTrack.id}`
  - `title`: `${currentTrack.title} - ${currentTrack.artist || 'Artiste inconnu'}`
  - `description`: `currentTrack.album || undefined`
  - `imageUrl`: `currentTrack.cover_image_url || undefined`
  - `type`: `'music'`
- Utiliser `size="sm"` pour un bouton discret

## Détails d'implémentation

### Génération d'URLs avec UTM

Format : `{baseUrl}?utm_source={source}&utm_medium={medium}&utm_campaign={campaign}`

Exemples :

- Twitter : `/photos#photo-123?utm_source=twitter&utm_medium=social&utm_campaign=photo`
- Copie : `/photos#photo-123?utm_source=copy&utm_medium=copy&utm_campaign=photo`

### Web Share API

- Vérifier disponibilité avec `navigator.share && navigator.canShare`
- Si disponible, afficher "Partager via..." en premier dans le menu
- Si non disponible, masquer cette option
- Gérer les erreurs (AbortError pour annulation utilisateur)

### Partage d'images

- Pour les photos, inclure `imageUrl` dans les props pour Open Graph
- Les réseaux sociaux utiliseront cette image pour la prévisualisation
- Note : Les meta tags Open Graph doivent être configurés au niveau de `app/layout.tsx` ou via des composants dynamiques (hors scope de cette fonctionnalité)

### Format des URLs de partage

- **Twitter** : `https://twitter.com/intent/tweet?url={encodedUrl}&text={encodedText}`
- **Facebook** : `https://www.facebook.com/sharer/sharer.php?u={encodedUrl}`
- **LinkedIn** : `https://www.linkedin.com/sharing/share-offsite/?url={encodedUrl}`
- **Email** : `mailto:?subject={encodedSubject}&body={encodedBody}`

### Gestion des erreurs

- Toast d'erreur pour échec de copie : `toast.error('Erreur', { description: 'Impossible de copier le lien' })`
- Toast de succès pour copie : `toast.success('Lien copié', { description: 'Le lien a été copié dans le presse-papiers' })`
- Gestion silencieuse des erreurs Web Share API (AbortError)

## Tests à effectuer

1. Tester le partage depuis PhotoViewerModal avec tous les réseaux sociaux
2. Tester le partage depuis TextDetailModal
3. Tester le partage depuis AudioPlayer
4. Vérifier que les URLs contiennent les paramètres UTM corrects
5. Tester la copie de lien avec toast de confirmation
6. Tester le fallback si Web Share API non disponible
7. Vérifier l'ouverture des réseaux sociaux dans nouvelle fenêtre
8. Tester sur mobile (Web Share API)

## Notes techniques

- Utiliser `encodeURIComponent` pour encoder les URLs et textes
- Les URLs avec hash (`#photo-123`) permettent d'identifier le contenu même si pas de page dédiée
- Les paramètres UTM permettent le tracking analytics (à configurer dans Google Analytics ou autre)
- Le composant doit être accessible (ARIA labels, navigation clavier)
- Compatible avec l'export statique Next.js (pas de SSR requis)