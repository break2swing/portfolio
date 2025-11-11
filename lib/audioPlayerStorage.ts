/**
 * Utilitaires pour sauvegarder et restaurer l'état du lecteur audio dans localStorage
 */

const STORAGE_PREFIX = 'audio-player-state:';
const PLAYLIST_STORAGE_KEY = 'audio-player-playlist';
const EXPIRATION_DAYS = 30;

interface PlayerState {
  currentTime: number;
  volume: number;
  timestamp: number;
}

interface PlaylistState {
  trackIds: string[];
  currentIndex: number;
  shuffle: boolean;
  repeat: 'none' | 'one' | 'all';
  timestamp: number;
}

/**
 * Vérifie si les données sont expirées
 */
function isExpired(timestamp: number): boolean {
  const expirationTime = EXPIRATION_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - timestamp > expirationTime;
}

/**
 * Sauvegarde l'état de lecture d'un morceau (position et volume)
 */
export function savePlayerState(trackId: string, currentTime: number, volume: number): void {
  if (typeof window === 'undefined') return;

  try {
    const state: PlayerState = {
      currentTime,
      volume,
      timestamp: Date.now(),
    };

    const key = `${STORAGE_PREFIX}${trackId}`;
    localStorage.setItem(key, JSON.stringify(state));
  } catch (error) {
    console.error('[AUDIO STORAGE] Failed to save player state:', error);
  }
}

/**
 * Récupère l'état sauvegardé d'un morceau
 */
export function getPlayerState(trackId: string): { currentTime: number; volume: number } | null {
  if (typeof window === 'undefined') return null;

  try {
    const key = `${STORAGE_PREFIX}${trackId}`;
    const stored = localStorage.getItem(key);

    if (!stored) return null;

    const state: PlayerState = JSON.parse(stored);

    // Vérifier l'expiration
    if (isExpired(state.timestamp)) {
      localStorage.removeItem(key);
      return null;
    }

    return {
      currentTime: state.currentTime,
      volume: state.volume,
    };
  } catch (error) {
    console.error('[AUDIO STORAGE] Failed to get player state:', error);
    return null;
  }
}

/**
 * Efface l'état sauvegardé d'un morceau
 */
export function clearPlayerState(trackId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const key = `${STORAGE_PREFIX}${trackId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('[AUDIO STORAGE] Failed to clear player state:', error);
  }
}

/**
 * Sauvegarde l'état de la playlist (ordre, index actuel, shuffle, repeat)
 */
export function savePlaylistState(
  trackIds: string[],
  currentIndex: number,
  shuffle: boolean,
  repeat: 'none' | 'one' | 'all'
): void {
  if (typeof window === 'undefined') return;

  try {
    const state: PlaylistState = {
      trackIds,
      currentIndex,
      shuffle,
      repeat,
      timestamp: Date.now(),
    };

    localStorage.setItem(PLAYLIST_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('[AUDIO STORAGE] Failed to save playlist state:', error);
  }
}

/**
 * Récupère l'état sauvegardé de la playlist
 */
export function getPlaylistState(): {
  trackIds: string[];
  currentIndex: number;
  shuffle: boolean;
  repeat: 'none' | 'one' | 'all';
} | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(PLAYLIST_STORAGE_KEY);

    if (!stored) return null;

    const state: PlaylistState = JSON.parse(stored);

    // Vérifier l'expiration
    if (isExpired(state.timestamp)) {
      localStorage.removeItem(PLAYLIST_STORAGE_KEY);
      return null;
    }

    return {
      trackIds: state.trackIds,
      currentIndex: state.currentIndex,
      shuffle: state.shuffle,
      repeat: state.repeat,
    };
  } catch (error) {
    console.error('[AUDIO STORAGE] Failed to get playlist state:', error);
    return null;
  }
}

/**
 * Efface l'état de la playlist
 */
export function clearPlaylistState(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(PLAYLIST_STORAGE_KEY);
  } catch (error) {
    console.error('[AUDIO STORAGE] Failed to clear playlist state:', error);
  }
}

