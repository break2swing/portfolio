'use client';

import { useEffect } from 'react';
import { categoryService } from '@/services/categoryService';
import { tagService } from '@/services/tagService';

/**
 * Composant pour précharger les données critiques au chargement initial
 * Améliore les performances en préchargeant les catégories et tags utilisés fréquemment
 */
export function PrefetchData() {
  useEffect(() => {
    // Précharger les catégories et tags au chargement initial
    // Ces données sont utilisées sur plusieurs pages et bénéficient d'un préchargement
    const prefetchData = async () => {
      try {
        // Précharger en parallèle pour optimiser les performances
        await Promise.all([
          categoryService.getAllCategories().catch(() => {
            // Ignorer les erreurs silencieusement - le prefetch est optionnel
          }),
          tagService.getAllTags().catch(() => {
            // Ignorer les erreurs silencieusement
          }),
        ]);
      } catch (error) {
        // Le prefetch est optionnel, on ignore les erreurs
        console.debug('[PrefetchData] Prefetch failed (non-critical):', error);
      }
    };

    // Utiliser requestIdleCallback pour ne pas bloquer le rendu initial
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      requestIdleCallback(prefetchData, { timeout: 2000 });
    } else {
      // Fallback pour les navigateurs qui ne supportent pas requestIdleCallback
      setTimeout(prefetchData, 1000);
    }
  }, []);

  return null;
}

