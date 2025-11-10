# Analytics et Monitoring - Documentation RUM

Ce document décrit le système de monitoring des performances utilisateur (RUM - Real User Monitoring) implémenté dans le portfolio.

## Vue d'ensemble

Le système collecte et envoie les Core Web Vitals et autres métriques de performance pour mesurer l'expérience utilisateur réelle en production.

## Architecture

### Composants principaux

1. **`components/WebVitals.tsx`** - Composant client qui charge dynamiquement `web-vitals` et enregistre les callbacks
2. **`lib/analytics.ts`** - Module de gestion des métriques avec fonctions d'envoi vers différents endpoints
3. **`lib/logger.ts`** - Système de logging structuré pour corréler les métriques avec les logs

### Flux de données

```
WebVitals Component
    ↓
web-vitals library (onCLS, onLCP, onFCP, onINP, onTTFB)
    ↓
reportWebVitals() dans analytics.ts
    ↓
formatMetric() → AnalyticsEvent
    ↓
sendToAnalytics() → Endpoint configuré
```

## Configuration

### Variables d'environnement

Ajouter dans `.env.local` :

```env
# Activer/désactiver l'analytics
NEXT_PUBLIC_ANALYTICS_ENABLED=true

# Endpoint pour envoyer les métriques (optionnel)
NEXT_PUBLIC_ANALYTICS_ENDPOINT=https://your-analytics-endpoint.com/api/vitals

# Google Analytics ID (optionnel)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Activation

L'analytics est désactivé par défaut. Pour l'activer :

1. Définir `NEXT_PUBLIC_ANALYTICS_ENABLED=true` dans `.env.local`
2. (Optionnel) Configurer un endpoint analytics personnalisé
3. (Optionnel) Configurer Google Analytics ou Vercel Analytics

## Métriques collectées

### Core Web Vitals

#### LCP (Largest Contentful Paint)
- **Seuil "good"** : ≤ 2.5s
- **Seuil "needs-improvement"** : ≤ 4.0s
- **Seuil "poor"** : > 4.0s
- **Description** : Temps de chargement du plus grand élément de contenu

#### CLS (Cumulative Layout Shift)
- **Seuil "good"** : ≤ 0.1
- **Seuil "needs-improvement"** : ≤ 0.25
- **Seuil "poor"** : > 0.25
- **Description** : Stabilité visuelle de la page

#### INP (Interaction to Next Paint)
- **Seuil "good"** : ≤ 200ms
- **Seuil "needs-improvement"** : ≤ 500ms
- **Seuil "poor"** : > 500ms
- **Description** : Temps de réponse aux interactions utilisateur (remplace FID)

### Autres métriques

#### FCP (First Contentful Paint)
- **Seuil "good"** : ≤ 1.8s
- **Seuil "needs-improvement"** : ≤ 3.0s
- **Seuil "poor"** : > 3.0s
- **Description** : Temps jusqu'au premier rendu de contenu

#### TTFB (Time to First Byte)
- **Seuil "good"** : ≤ 800ms
- **Seuil "needs-improvement"** : ≤ 1.8s
- **Seuil "poor"** : > 1.8s
- **Description** : Temps jusqu'à la réception du premier octet

## Format des événements

Chaque métrique est formatée en `AnalyticsEvent` :

```typescript
{
  name: string;              // Nom de la métrique (LCP, CLS, etc.)
  value: number;             // Valeur de la métrique en millisecondes
  id: string;                // ID unique de la métrique
  navigationType?: string;   // Type de navigation (navigate, reload, etc.)
  rating?: 'good' | 'needs-improvement' | 'poor';
  delta?: number;            // Différence avec la valeur précédente
  timestamp: number;        // Timestamp Unix en millisecondes
  sessionId: string;         // ID de session unique
  url: string;               // URL de la page
  userAgent: string;         // User agent du navigateur
}
```

## Intégrations disponibles

### 1. Endpoint personnalisé

Si `NEXT_PUBLIC_ANALYTICS_ENDPOINT` est configuré, les métriques sont envoyées via :
- `navigator.sendBeacon()` (préféré, ne bloque pas la navigation)
- `fetch()` avec `keepalive: true` (fallback)

### 2. Google Analytics

Si `gtag` est disponible globalement, les métriques sont envoyées comme événements :

```javascript
gtag('event', 'LCP', {
  event_category: 'Web Vitals',
  value: Math.round(metric.value),
  event_label: metric.id,
  non_interaction: true,
});
```

### 3. Vercel Analytics

Si `va` (Vercel Analytics) est disponible, les métriques sont envoyées :

```javascript
va('event', 'LCP', {
  value: metric.value,
  rating: metric.rating,
});
```

## Session ID

Un ID de session unique est généré pour chaque visite et stocké dans `sessionStorage` :

- **Format** : `{timestamp}-{random}`
- **Persistance** : Session uniquement (effacé à la fermeture de l'onglet)
- **Usage** : Corréler les métriques avec les logs via `lib/logger.ts`

## Événements personnalisés

Vous pouvez envoyer des événements personnalisés :

```typescript
import { trackEvent } from '@/lib/analytics';

trackEvent('photo_uploaded', {
  photo_id: '123',
  file_size: 1024000,
});
```

## Page Views

Pour tracker les changements de page :

```typescript
import { trackPageView } from '@/lib/analytics';

trackPageView('/photos');
```

## Conformité RGPD

### Consentement utilisateur

Avant d'activer l'analytics, vous devez :

1. Obtenir le consentement explicite de l'utilisateur
2. Fournir une bannière de consentement conforme RGPD
3. Permettre à l'utilisateur de désactiver le tracking

### Implémentation recommandée

```typescript
// Exemple de gestion du consentement
const [analyticsConsent, setAnalyticsConsent] = useState(false);

useEffect(() => {
  if (analyticsConsent) {
    // Activer l'analytics seulement après consentement
    process.env.NEXT_PUBLIC_ANALYTICS_ENABLED = 'true';
  }
}, [analyticsConsent]);
```

## Tests

### Tester l'envoi des métriques

1. Activer l'analytics avec `NEXT_PUBLIC_ANALYTICS_ENABLED=true`
2. Ouvrir la console du navigateur
3. Naviguer sur le site
4. Vérifier les logs dans la console :
   - `[ANALYTICS] Web Vital: LCP` avec la valeur et le rating
   - `[ANALYTICS] Metric sent to analytics` si un endpoint est configuré

### Vérifier les métriques dans Google Analytics

1. Configurer `NEXT_PUBLIC_GA_ID`
2. Ouvrir Google Analytics → Événements
3. Rechercher les événements `LCP`, `CLS`, `INP`, etc.

## Dashboard admin (optionnel)

Pour visualiser les métriques collectées, vous pouvez créer une page `/admin/analytics` qui :

1. Récupère les métriques depuis votre endpoint analytics
2. Affiche des graphiques avec les Core Web Vitals
3. Montre les tendances de performance
4. Identifie les régressions

## Dépannage

### Les métriques ne sont pas envoyées

1. Vérifier que `NEXT_PUBLIC_ANALYTICS_ENABLED=true`
2. Vérifier la console pour les erreurs
3. Vérifier que `web-vitals` est bien chargé (dynamiquement)

### Les métriques ne s'affichent pas dans Google Analytics

1. Vérifier que `NEXT_PUBLIC_GA_ID` est correct
2. Vérifier que `gtag` est chargé avant le composant `WebVitals`
3. Utiliser Google Tag Assistant pour déboguer

### Performance impact

Le chargement de `web-vitals` est fait dynamiquement pour ne pas impacter le bundle initial. Le composant `WebVitals` ne rend rien et charge la bibliothèque de manière asynchrone.

## Ressources

- [Web Vitals Library](https://github.com/GoogleChrome/web-vitals)
- [Core Web Vitals - Google](https://web.dev/vitals/)
- [Vercel Analytics](https://vercel.com/docs/analytics)
- [Google Analytics](https://developers.google.com/analytics)

