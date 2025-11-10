import { supabaseClient } from '@/lib/supabaseClient';
import { serviceLogger } from '@/lib/logger';

const logger = serviceLogger.child('bookmarks');

const BOOKMARKS_STORAGE_KEY = 'portfolio:bookmarks';

export type BookmarkType = 'text' | 'photo' | 'video' | 'music';

export interface Bookmark {
  id: string;
  type: BookmarkType;
  itemId: string;
  title: string;
  description?: string;
  imageUrl?: string;
  createdAt: string;
}

interface LocalBookmarks {
  texts: string[];
  photos: string[];
  videos: string[];
  music: string[];
}

function getLocalBookmarks(): LocalBookmarks {
  if (typeof window === 'undefined') {
    return { texts: [], photos: [], videos: [], music: [] };
  }

  try {
    const stored = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    if (!stored) {
      return { texts: [], photos: [], videos: [], music: [] };
    }
    return JSON.parse(stored);
  } catch (error) {
    logger.error('Failed to parse local bookmarks', error as Error);
    return { texts: [], photos: [], videos: [], music: [] };
  }
}

function setLocalBookmarks(bookmarks: LocalBookmarks): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks));
    logger.debug('Local bookmarks updated', { counts: {
      texts: bookmarks.texts.length,
      photos: bookmarks.photos.length,
      videos: bookmarks.videos.length,
      music: bookmarks.music.length,
    }});
  } catch (error) {
    logger.error('Failed to save local bookmarks', error as Error);
  }
}

export function isBookmarked(type: BookmarkType, itemId: string): boolean {
  const bookmarks = getLocalBookmarks();
  const typeKey = `${type}s` as keyof LocalBookmarks;
  return bookmarks[typeKey]?.includes(itemId) ?? false;
}

export function addBookmark(type: BookmarkType, itemId: string): void {
  const bookmarks = getLocalBookmarks();
  const typeKey = `${type}s` as keyof LocalBookmarks;

  if (!bookmarks[typeKey]) {
    bookmarks[typeKey] = [];
  }

  if (!bookmarks[typeKey].includes(itemId)) {
    bookmarks[typeKey].push(itemId);
    setLocalBookmarks(bookmarks);
    logger.info('Bookmark added', { type, itemId });
  }
}

export function removeBookmark(type: BookmarkType, itemId: string): void {
  const bookmarks = getLocalBookmarks();
  const typeKey = `${type}s` as keyof LocalBookmarks;

  if (!bookmarks[typeKey]) {
    return;
  }

  const index = bookmarks[typeKey].indexOf(itemId);
  if (index > -1) {
    bookmarks[typeKey].splice(index, 1);
    setLocalBookmarks(bookmarks);
    logger.info('Bookmark removed', { type, itemId });
  }
}

export function toggleBookmark(type: BookmarkType, itemId: string): boolean {
  if (isBookmarked(type, itemId)) {
    removeBookmark(type, itemId);
    return false;
  } else {
    addBookmark(type, itemId);
    return true;
  }
}

export function getBookmarkedIds(type: BookmarkType): string[] {
  const bookmarks = getLocalBookmarks();
  const typeKey = `${type}s` as keyof LocalBookmarks;
  return bookmarks[typeKey] || [];
}

export function getAllBookmarks(): LocalBookmarks {
  return getLocalBookmarks();
}

export function clearAllBookmarks(): void {
  setLocalBookmarks({ texts: [], photos: [], videos: [], music: [] });
  logger.info('All bookmarks cleared');
}

export function clearBookmarksByType(type: BookmarkType): void {
  const bookmarks = getLocalBookmarks();
  const typeKey = `${type}s` as keyof LocalBookmarks;
  bookmarks[typeKey] = [];
  setLocalBookmarks(bookmarks);
  logger.info('Bookmarks cleared', { type });
}

export function getBookmarkCounts(): Record<BookmarkType, number> {
  const bookmarks = getLocalBookmarks();
  return {
    text: bookmarks.texts.length,
    photo: bookmarks.photos.length,
    video: bookmarks.videos.length,
    music: bookmarks.music.length,
  };
}

export async function syncBookmarksToSupabase(userId: string): Promise<void> {
  try {
    const localBookmarks = getLocalBookmarks();
    
    logger.info('Syncing bookmarks to Supabase', { userId });
    
  } catch (error) {
    logger.error('Failed to sync bookmarks to Supabase', error as Error);
    throw error;
  }
}

export async function syncBookmarksFromSupabase(userId: string): Promise<void> {
  try {
    logger.info('Syncing bookmarks from Supabase', { userId });
    
  } catch (error) {
    logger.error('Failed to sync bookmarks from Supabase', error as Error);
    throw error;
  }
}
