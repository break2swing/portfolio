'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  isBookmarked,
  toggleBookmark,
  getBookmarkedIds,
  getAllBookmarks,
  clearAllBookmarks,
  clearBookmarksByType,
  getBookmarkCounts,
  BookmarkType,
} from '@/lib/bookmarks';
import { serviceLogger } from '@/lib/logger';

const logger = serviceLogger.child('use-bookmarks');

interface UseBookmarksReturn {
  isBookmarked: (type: BookmarkType, itemId: string) => boolean;
  toggleBookmark: (type: BookmarkType, itemId: string) => boolean;
  getBookmarkedIds: (type: BookmarkType) => string[];
  counts: Record<BookmarkType, number>;
  clearAll: () => void;
  clearByType: (type: BookmarkType) => void;
  refreshCounts: () => void;
}

/**
 * Hook pour gérer les favoris/bookmarks
 * 
 * Fonctionnalités :
 * - Vérification si un item est en favoris
 * - Toggle favoris avec feedback optimiste
 * - Récupération des IDs bookmarkés par type
 * - Compteurs par type de contenu
 * - Nettoyage des favoris
 */
export function useBookmarks(): UseBookmarksReturn {
  const [counts, setCounts] = useState<Record<BookmarkType, number>>({
    text: 0,
    photo: 0,
    video: 0,
    music: 0,
  });

  const refreshCounts = useCallback(() => {
    const newCounts = getBookmarkCounts();
    setCounts(newCounts);
    logger.debug('Bookmark counts refreshed', newCounts);
  }, []);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  const handleToggle = useCallback((type: BookmarkType, itemId: string): boolean => {
    try {
      const newState = toggleBookmark(type, itemId);
      refreshCounts();
      logger.info('Bookmark toggled', { type, itemId, bookmarked: newState });
      return newState;
    } catch (error) {
      logger.error('Failed to toggle bookmark', error as Error, { type, itemId });
      return isBookmarked(type, itemId);
    }
  }, [refreshCounts]);

  const handleClearAll = useCallback(() => {
    try {
      clearAllBookmarks();
      refreshCounts();
      logger.info('All bookmarks cleared');
    } catch (error) {
      logger.error('Failed to clear all bookmarks', error as Error);
    }
  }, [refreshCounts]);

  const handleClearByType = useCallback((type: BookmarkType) => {
    try {
      clearBookmarksByType(type);
      refreshCounts();
      logger.info('Bookmarks cleared by type', { type });
    } catch (error) {
      logger.error('Failed to clear bookmarks by type', error as Error, { type });
    }
  }, [refreshCounts]);

  return {
    isBookmarked,
    toggleBookmark: handleToggle,
    getBookmarkedIds,
    counts,
    clearAll: handleClearAll,
    clearByType: handleClearByType,
    refreshCounts,
  };
}
