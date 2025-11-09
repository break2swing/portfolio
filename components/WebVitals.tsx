'use client';

import { useEffect } from 'react';
import { reportWebVitals } from '@/lib/analytics';

/**
 * Composant pour collecter les Core Web Vitals
 * Doit être placé dans le layout racine pour capturer toutes les métriques
 */
export function WebVitals() {
  useEffect(() => {
    // Charger dynamiquement web-vitals pour réduire le bundle initial
    import('web-vitals').then(({ onCLS, onFCP, onINP, onLCP, onTTFB }) => {
      // Core Web Vitals
      onCLS(reportWebVitals);  // Cumulative Layout Shift
      onFCP(reportWebVitals);  // First Contentful Paint
      onINP(reportWebVitals);  // Interaction to Next Paint (remplace FID)
      onLCP(reportWebVitals);  // Largest Contentful Paint
      onTTFB(reportWebVitals); // Time to First Byte
    });
  }, []);

  // Ce composant ne rend rien
  return null;
}
