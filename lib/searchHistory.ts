/**
 * lib/searchHistory.ts
 * Gestion de l'historique de recherche dans localStorage
 */

const STORAGE_KEY = 'portfolio_search_history';
const MAX_HISTORY = 5;

/**
 * Sauvegarde une requête de recherche dans l'historique
 * @param query Requête à sauvegarder
 */
export function saveSearchQuery(query: string): void {
  if (!query || !query.trim()) return;

  try {
    const history = getSearchHistory();
    const normalizedQuery = query.trim().toLowerCase();

    // Retirer la requête si elle existe déjà (pour la remettre en haut)
    const filteredHistory = history.filter((q) => q.toLowerCase() !== normalizedQuery);

    // Ajouter la nouvelle requête en premier
    const newHistory = [query.trim(), ...filteredHistory].slice(0, MAX_HISTORY);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
  } catch (error) {
    console.error('[searchHistory] Error saving search query:', error);
  }
}

/**
 * Récupère l'historique de recherche
 * @returns Liste des recherches récentes (plus récentes en premier)
 */
export function getSearchHistory(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const history = JSON.parse(stored);
    if (!Array.isArray(history)) return [];

    return history.filter((item) => typeof item === 'string' && item.trim().length > 0);
  } catch (error) {
    console.error('[searchHistory] Error reading search history:', error);
    return [];
  }
}

/**
 * Efface tout l'historique de recherche
 */
export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('[searchHistory] Error clearing search history:', error);
  }
}

/**
 * Supprime une requête spécifique de l'historique
 * @param query Requête à supprimer
 */
export function removeSearchQuery(query: string): void {
  try {
    const history = getSearchHistory();
    const normalizedQuery = query.trim().toLowerCase();
    const filteredHistory = history.filter(
      (q) => q.trim().toLowerCase() !== normalizedQuery
    );

    if (filteredHistory.length !== history.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredHistory));
    }
  } catch (error) {
    console.error('[searchHistory] Error removing search query:', error);
  }
}

