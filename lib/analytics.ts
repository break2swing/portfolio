/**
 * Système de monitoring des performances utilisateur (RUM - Real User Monitoring)
 * Collecte et envoie les Core Web Vitals et autres métriques de performance
 */

import { Metric } from 'web-vitals';
import { createLogger } from './logger';

const logger = createLogger('analytics');

export type AnalyticsEvent = {
  name: string;
  value: number;
  id: string;
  navigationType?: string;
  rating?: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  timestamp: number;
  sessionId: string;
  url: string;
  userAgent: string;
};

// ID de session unique pour corréler les événements
let sessionId: string | null = null;

/**
 * Génère ou récupère l'ID de session
 */
function getSessionId(): string {
  if (sessionId) return sessionId;

  // Générer un ID de session unique
  sessionId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

  // Stocker dans sessionStorage pour persistance pendant la session
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('analytics-session-id', sessionId);
    } catch (error) {
      logger.warn('Failed to store session ID', { error });
    }
  }

  return sessionId;
}

/**
 * Récupère l'ID de session depuis sessionStorage ou en crée un nouveau
 */
function initSessionId(): void {
  if (typeof window === 'undefined') return;

  try {
    const stored = sessionStorage.getItem('analytics-session-id');
    if (stored) {
      sessionId = stored;
    } else {
      getSessionId();
    }
  } catch (error) {
    logger.warn('Failed to init session ID', { error });
    getSessionId();
  }
}

/**
 * Détermine le rating d'une métrique selon les seuils Google
 */
function getRating(metric: Metric): 'good' | 'needs-improvement' | 'poor' {
  const { name, value } = metric;

  // Seuils Google pour les Core Web Vitals
  const thresholds: Record<string, [number, number]> = {
    CLS: [0.1, 0.25],
    FCP: [1800, 3000],
    INP: [200, 500],
    LCP: [2500, 4000],
    TTFB: [800, 1800],
  };

  const [good, poor] = thresholds[name] || [0, Infinity];

  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Formate une métrique Web Vitals en événement analytics
 */
function formatMetric(metric: Metric): AnalyticsEvent {
  return {
    name: metric.name,
    value: metric.value,
    id: metric.id,
    navigationType: metric.navigationType,
    rating: getRating(metric),
    delta: metric.delta,
    timestamp: Date.now(),
    sessionId: getSessionId(),
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  };
}

/**
 * Envoie une métrique vers l'endpoint analytics
 */
async function sendToAnalytics(event: AnalyticsEvent): Promise<void> {
  // Vérifier si l'analytics est activé
  const isEnabled = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true';

  if (!isEnabled) {
    logger.debug('Analytics disabled, skipping', { metric: event.name });
    return;
  }

  // Logger la métrique
  logger.info(`Web Vital: ${event.name}`, {
    value: event.value,
    rating: event.rating,
    sessionId: event.sessionId,
  });

  // Envoyer vers un endpoint analytics (à configurer)
  const endpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;

  if (endpoint) {
    try {
      // Utiliser sendBeacon si disponible (ne bloque pas la navigation)
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(event)], {
          type: 'application/json',
        });
        navigator.sendBeacon(endpoint, blob);
      } else {
        // Fallback sur fetch
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
          keepalive: true,
        });
      }

      logger.debug('Metric sent to analytics', { name: event.name });
    } catch (error) {
      logger.error('Failed to send metric to analytics', error as Error, {
        metric: event.name,
      });
    }
  }

  // Intégration Vercel Analytics (si disponible)
  if (typeof window !== 'undefined' && (window as any).va) {
    try {
      (window as any).va('event', event.name, {
        value: event.value,
        rating: event.rating,
      });
    } catch (error) {
      logger.warn('Failed to send to Vercel Analytics', { error });
    }
  }

  // Intégration Google Analytics (si disponible)
  if (typeof window !== 'undefined' && (window as any).gtag) {
    try {
      (window as any).gtag('event', event.name, {
        event_category: 'Web Vitals',
        value: Math.round(event.value),
        event_label: event.id,
        non_interaction: true,
      });
    } catch (error) {
      logger.warn('Failed to send to Google Analytics', { error });
    }
  }
}

/**
 * Callback pour traiter les métriques Web Vitals
 */
export function reportWebVitals(metric: Metric): void {
  const event = formatMetric(metric);
  sendToAnalytics(event);
}

/**
 * Envoie un événement analytics personnalisé
 */
export function trackEvent(
  name: string,
  properties?: Record<string, any>
): void {
  const isEnabled = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true';

  if (!isEnabled) {
    logger.debug('Analytics disabled, skipping custom event', { name });
    return;
  }

  logger.info(`Custom event: ${name}`, properties);

  // Envoyer vers Google Analytics si disponible
  if (typeof window !== 'undefined' && (window as any).gtag) {
    try {
      (window as any).gtag('event', name, properties);
    } catch (error) {
      logger.warn('Failed to track custom event', { error, name });
    }
  }

  // Envoyer vers Vercel Analytics si disponible
  if (typeof window !== 'undefined' && (window as any).va) {
    try {
      (window as any).va('event', name, properties);
    } catch (error) {
      logger.warn('Failed to track custom event to Vercel', { error, name });
    }
  }
}

/**
 * Envoie une page view
 */
export function trackPageView(url?: string): void {
  const isEnabled = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true';

  if (!isEnabled) {
    logger.debug('Analytics disabled, skipping page view');
    return;
  }

  const pageUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  logger.debug('Page view', { url: pageUrl });

  // Google Analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    try {
      (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
        page_path: pageUrl,
      });
    } catch (error) {
      logger.warn('Failed to track page view', { error });
    }
  }
}

// Initialiser le session ID au chargement
if (typeof window !== 'undefined') {
  initSessionId();
}

// Exporter le sessionId pour corrélation avec le logger
export { getSessionId };
