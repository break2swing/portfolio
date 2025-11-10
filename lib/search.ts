/**
 * lib/search.ts
 * Module de recherche avancée avec fuzzy matching et highlighting
 */

export interface SearchOptions {
  fuzzy?: boolean;
  threshold?: number;
  highlight?: boolean;
  sortByRelevance?: boolean;
  maxResults?: number;
}

export interface SearchResult {
  item: any;
  score: number;
  highlightedFields?: Record<string, string>;
}

/**
 * Normalise une chaîne de caractères pour la recherche (lowercase, suppression accents)
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Supprime les accents
}

/**
 * Calcule la distance de Levenshtein entre deux chaînes
 * @param str1 Première chaîne
 * @param str2 Deuxième chaîne
 * @returns Distance de Levenshtein (nombre de modifications nécessaires)
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);
  const len1 = s1.length;
  const len2 = s2.length;

  // Créer une matrice pour la programmation dynamique
  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  // Initialiser la première ligne et colonne
  for (let i = 0; i <= len1; i++) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Remplir la matrice
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // Suppression
        matrix[i][j - 1] + 1, // Insertion
        matrix[i - 1][j - 1] + cost // Substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calcule le ratio de similarité entre deux chaînes (0-1)
 */
function similarityRatio(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;
  return 1 - distance / maxLength;
}

/**
 * Vérifie si une chaîne correspond à une requête avec fuzzy matching
 * @param query Requête de recherche
 * @param text Texte à rechercher
 * @param threshold Seuil de similarité (0-1, défaut: 0.7)
 * @returns true si le texte correspond à la requête
 */
export function fuzzyMatch(
  query: string,
  text: string,
  threshold: number = 0.7
): boolean {
  const normalizedQuery = normalizeString(query);
  const normalizedText = normalizeString(text);

  // Recherche exacte d'abord (plus rapide)
  if (normalizedText.includes(normalizedQuery)) {
    return true;
  }

  // Recherche fuzzy pour chaque mot de la requête
  const queryWords = normalizedQuery.split(/\s+/).filter((w) => w.length > 0);
  if (queryWords.length === 0) return false;

  // Tous les mots doivent correspondre (logique AND)
  return queryWords.every((word) => {
    // Vérifier si le mot est présent dans le texte
    if (normalizedText.includes(word)) {
      return true;
    }

    // Recherche fuzzy par sous-chaînes
    const textWords = normalizedText.split(/\s+/);
    for (const textWord of textWords) {
      if (similarityRatio(word, textWord) >= threshold) {
        return true;
      }
    }

    // Recherche fuzzy sur le texte complet
    return similarityRatio(word, normalizedText) >= threshold;
  });
}

/**
 * Échappe les caractères HTML pour éviter les injections XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Surligne les termes recherchés dans un texte avec des balises <mark>
 * @param text Texte à surligner
 * @param query Requête de recherche
 * @returns HTML avec les termes surlignés
 */
export function highlightText(text: string, query: string): string {
  if (!query || !text) return escapeHtml(text);

  const normalizedQuery = normalizeString(query);
  const normalizedText = normalizeString(text);
  const escapedText = escapeHtml(text);

  // Si correspondance exacte, surligner directement
  if (normalizedText.includes(normalizedQuery)) {
    const regex = new RegExp(`(${escapeRegex(normalizedQuery)})`, 'gi');
    return escapedText.replace(regex, '<mark>$1</mark>');
  }

  // Recherche fuzzy : trouver les mots similaires
  const queryWords = normalizedQuery.split(/\s+/).filter((w) => w.length > 0);
  let highlightedText = escapedText;
  const textWords = normalizedText.split(/\s+/);

  for (const queryWord of queryWords) {
    for (let i = 0; i < textWords.length; i++) {
      const textWord = textWords[i];
      if (similarityRatio(queryWord, textWord) >= 0.7) {
        // Trouver la position dans le texte original (en tenant compte des accents)
        const wordRegex = new RegExp(
          `\\b${escapeRegex(text.split(/\s+/)[i])}\\b`,
          'gi'
        );
        highlightedText = highlightedText.replace(
          wordRegex,
          (match) => `<mark>${match}</mark>`
        );
      }
    }
  }

  return highlightedText;
}

/**
 * Échappe les caractères spéciaux pour les expressions régulières
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Calcule un score de pertinence pour un élément de recherche
 * @param item Élément à évaluer
 * @param query Requête de recherche
 * @param fields Champs à rechercher avec leurs poids (ex: [{ field: 'title', weight: 3 }])
 * @returns Score de pertinence (plus élevé = plus pertinent)
 */
export function calculateRelevanceScore(
  item: any,
  query: string,
  fields: Array<{ field: string; weight: number }>
): number {
  const normalizedQuery = normalizeString(query);
  let score = 0;

  for (const { field, weight } of fields) {
    const fieldValue = item[field];
    if (!fieldValue) continue;

    const normalizedValue = normalizeString(String(fieldValue));

    // Correspondance exacte au début du champ (score maximal)
    if (normalizedValue.startsWith(normalizedQuery)) {
      score += weight * 3;
    }
    // Correspondance exacte dans le champ
    else if (normalizedValue.includes(normalizedQuery)) {
      score += weight * 2;
    }
    // Correspondance fuzzy
    else {
      const queryWords = normalizedQuery.split(/\s+/).filter((w) => w.length > 0);
      for (const word of queryWords) {
        if (normalizedValue.includes(word)) {
          score += weight;
        } else {
          // Score basé sur la similarité
          const similarity = similarityRatio(word, normalizedValue);
          if (similarity >= 0.7) {
            score += weight * similarity;
          }
        }
      }
    }
  }

  return score;
}

/**
 * Recherche dans une collection avec options de fuzzy matching et highlighting
 * @param collection Collection à rechercher
 * @param query Requête de recherche
 * @param searchFields Champs à rechercher avec leurs poids
 * @param options Options de recherche
 * @returns Résultats de recherche triés par pertinence
 */
export function searchInCollection<T>(
  collection: T[],
  query: string,
  searchFields: Array<{ field: string; weight: number }>,
  options: SearchOptions = {}
): SearchResult[] {
  const {
    fuzzy = true,
    threshold = 0.7,
    highlight = false,
    sortByRelevance = true,
    maxResults,
  } = options;

  if (!query || !query.trim()) {
    return collection.map((item) => ({
      item,
      score: 0,
    }));
  }

  const normalizedQuery = normalizeString(query.trim());
  const results: SearchResult[] = [];

  for (const item of collection) {
    let matches = false;
    let score = 0;

    if (fuzzy) {
      // Recherche fuzzy sur tous les champs
      for (const { field, weight } of searchFields) {
        const fieldValue = item[field as keyof T];
        if (fieldValue && fuzzyMatch(normalizedQuery, String(fieldValue), threshold)) {
          matches = true;
          if (sortByRelevance) {
            score += calculateRelevanceScore(item, normalizedQuery, searchFields);
          }
        }
      }
    } else {
      // Recherche exacte
      for (const { field } of searchFields) {
        const fieldValue = item[field as keyof T];
        if (fieldValue && normalizeString(String(fieldValue)).includes(normalizedQuery)) {
          matches = true;
          if (sortByRelevance) {
            score += calculateRelevanceScore(item, normalizedQuery, searchFields);
          }
        }
      }
    }

    if (matches) {
      const result: SearchResult = {
        item,
        score: sortByRelevance ? score : 1,
      };

      if (highlight) {
        result.highlightedFields = {};
        for (const { field } of searchFields) {
          const fieldValue = item[field as keyof T];
          if (fieldValue) {
            result.highlightedFields[field] = highlightText(String(fieldValue), query);
          }
        }
      }

      results.push(result);
    }
  }

  // Trier par score décroissant si activé
  if (sortByRelevance) {
    results.sort((a, b) => b.score - a.score);
  }

  // Limiter le nombre de résultats si spécifié
  if (maxResults && maxResults > 0) {
    return results.slice(0, maxResults);
  }

  return results;
}

export interface GlobalSearchItem {
  id: string;
  title: string;
  type: 'text' | 'photo' | 'video' | 'music' | 'application';
  description?: string;
  excerpt?: string;
  url: string;
  icon?: string;
}

/**
 * Recherche globale dans tous les types de contenu
 * @param query Requête de recherche
 * @param allContent Objet contenant tous les contenus par type
 * @param options Options de recherche
 * @returns Résultats groupés par type
 */
export function searchAllContent(
  query: string,
  allContent: {
    texts?: any[];
    photos?: any[];
    videos?: any[];
    music?: any[];
    applications?: any[];
  },
  options: SearchOptions = {}
): Record<string, GlobalSearchItem[]> {
  const results: Record<string, GlobalSearchItem[]> = {
    texts: [],
    photos: [],
    videos: [],
    music: [],
    applications: [],
  };

  if (!query || !query.trim()) {
    return results;
  }

  if (allContent.texts) {
    const textResults = searchInCollection(
      allContent.texts,
      query,
      [
        { field: 'title', weight: 3 },
        { field: 'subtitle', weight: 2 },
        { field: 'excerpt', weight: 2 },
        { field: 'content', weight: 1 },
      ],
      { ...options, maxResults: 5 }
    );

    results.texts = textResults.map(({ item }) => ({
      id: item.id,
      title: item.title,
      type: 'text' as const,
      description: item.subtitle || item.excerpt,
      url: `/textes`,
      icon: 'FileText',
    }));
  }

  if (allContent.photos) {
    const photoResults = searchInCollection(
      allContent.photos,
      query,
      [
        { field: 'title', weight: 3 },
        { field: 'description', weight: 2 },
      ],
      { ...options, maxResults: 5 }
    );

    results.photos = photoResults.map(({ item }) => ({
      id: item.id,
      title: item.title,
      type: 'photo' as const,
      description: item.description,
      url: `/photos`,
      icon: 'Image',
    }));
  }

  if (allContent.videos) {
    const videoResults = searchInCollection(
      allContent.videos,
      query,
      [
        { field: 'title', weight: 3 },
        { field: 'description', weight: 2 },
      ],
      { ...options, maxResults: 5 }
    );

    results.videos = videoResults.map(({ item }) => ({
      id: item.id,
      title: item.title,
      type: 'video' as const,
      description: item.description,
      url: `/videos`,
      icon: 'Video',
    }));
  }

  if (allContent.music) {
    const musicResults = searchInCollection(
      allContent.music,
      query,
      [
        { field: 'title', weight: 3 },
        { field: 'artist', weight: 2 },
        { field: 'album', weight: 1 },
      ],
      { ...options, maxResults: 5 }
    );

    results.music = musicResults.map(({ item }) => ({
      id: item.id,
      title: item.title,
      type: 'music' as const,
      description: item.artist,
      excerpt: item.album,
      url: `/musique`,
      icon: 'Music',
    }));
  }

  if (allContent.applications) {
    const appResults = searchInCollection(
      allContent.applications,
      query,
      [
        { field: 'name', weight: 3 },
        { field: 'description', weight: 2 },
      ],
      { ...options, maxResults: 5 }
    );

    results.applications = appResults.map(({ item }) => ({
      id: item.id,
      title: item.name || item.title,
      type: 'application' as const,
      description: item.description,
      url: `/applications`,
      icon: 'AppWindow',
    }));
  }

  return results;
}

