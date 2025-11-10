/**
 * Système de cache côté client avec TTL (Time To Live)
 * Permet de réduire les appels API redondants et d'améliorer la réactivité
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheOptions {
  ttl?: number; // TTL en millisecondes
  storage?: 'memory' | 'session'; // Type de stockage
}

export class SimpleCache {
  private cache: Map<string, CacheEntry<any>>;
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes par défaut

  constructor() {
    this.cache = new Map();

    // Charger les données depuis sessionStorage si disponible
    if (typeof window !== 'undefined') {
      this.loadFromSessionStorage();
    }
  }

  /**
   * Récupère une valeur du cache
   * @param key Clé du cache
   * @returns La valeur si elle existe et n'a pas expiré, null sinon
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    // Vérifier si l'entrée a expiré
    if (age > entry.ttl) {
      this.cache.delete(key);
      this.syncSessionStorage();
      return null;
    }

    return entry.data as T;
  }

  /**
   * Stocke une valeur dans le cache
   * @param key Clé du cache
   * @param data Données à stocker
   * @param options Options de cache (TTL, storage)
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl ?? this.DEFAULT_TTL;

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    this.cache.set(key, entry);

    // Synchroniser avec sessionStorage si demandé
    if (options.storage === 'session') {
      this.syncSessionStorage();
    }
  }

  /**
   * Invalide une ou plusieurs clés du cache
   * @param keys Clé(s) à invalider (string ou array de strings)
   */
  invalidate(keys: string | string[]): void {
    const keysArray = Array.isArray(keys) ? keys : [keys];

    keysArray.forEach(key => {
      this.cache.delete(key);
    });

    this.syncSessionStorage();
  }

  /**
   * Invalide toutes les clés correspondant à un pattern
   * @param pattern Pattern à matcher (utilise includes)
   */
  invalidatePattern(pattern: string): void {
    const keysToDelete: string[] = [];

    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
    this.syncSessionStorage();
  }

  /**
   * Vide complètement le cache
   */
  clear(): void {
    this.cache.clear();

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('app-cache');
      } catch (error) {
        console.warn('Failed to clear sessionStorage cache:', error);
      }
    }
  }

  /**
   * Retourne toutes les clés du cache
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Retourne la taille du cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Synchronise le cache en mémoire avec sessionStorage
   */
  private syncSessionStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const cacheData: Record<string, CacheEntry<any>> = {};

      this.cache.forEach((value, key) => {
        cacheData[key] = value;
      });

      sessionStorage.setItem('app-cache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to sync cache to sessionStorage:', error);
    }
  }

  /**
   * Charge le cache depuis sessionStorage
   */
  private loadFromSessionStorage(): void {
    try {
      const stored = sessionStorage.getItem('app-cache');

      if (!stored) return;

      const cacheData: Record<string, CacheEntry<any>> = JSON.parse(stored);
      const now = Date.now();

      Object.entries(cacheData).forEach(([key, entry]) => {
        const age = now - entry.timestamp;

        // Ne charger que les entrées non expirées
        if (age <= entry.ttl) {
          this.cache.set(key, entry);
        }
      });
    } catch (error) {
      console.warn('Failed to load cache from sessionStorage:', error);
    }
  }
}

// Instance singleton du cache
export const cache = new SimpleCache();

/**
 * Hook utilitaire pour wrapper un appel de fonction avec cache
 * @param key Clé du cache
 * @param fetchFn Fonction à appeler si le cache est vide
 * @param options Options de cache
 * @returns La valeur du cache ou le résultat de fetchFn
 */
export async function withCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Vérifier le cache
  const cached = cache.get<T>(key);

  if (cached !== null) {
    return cached;
  }

  // Appeler la fonction et mettre en cache
  const data = await fetchFn();
  cache.set(key, data, options);

  return data;
}
