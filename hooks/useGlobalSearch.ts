'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { serviceLogger } from '@/lib/logger';

const logger = serviceLogger.child('use-global-search');

export interface GlobalSearchResult {
  id: string;
  title: string;
  type: 'text' | 'photo' | 'video' | 'music' | 'application';
  description?: string;
  url: string;
}

interface UseGlobalSearchReturn {
  isOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
}

/**
 * Hook pour gérer l'état de la recherche globale (Command Palette)
 * 
 * Fonctionnalités :
 * - Gestion de l'état ouvert/fermé
 * - Raccourci clavier ⌘K / Ctrl+K
 * - Navigation automatique vers les résultats
 */
export function useGlobalSearch(): UseGlobalSearchReturn {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const openSearch = useCallback(() => {
    logger.debug('Opening global search');
    setIsOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    logger.debug('Closing global search');
    setIsOpen(false);
  }, []);

  const toggleSearch = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleSearch();
        logger.info('Global search toggled via keyboard shortcut');
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleSearch]);

  return {
    isOpen,
    openSearch,
    closeSearch,
    toggleSearch,
  };
}
