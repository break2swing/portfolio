/**
 * Rate Limiter côté client
 * Utilise sessionStorage pour limiter les appels API et prévenir les abus
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class ClientRateLimiter {
  private storage: Storage;
  private configs: Map<string, RateLimitConfig>;

  constructor(storage?: Storage) {
    // Use provided storage or get sessionStorage only on client side
    if (storage) {
      this.storage = storage;
    } else {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined' && window.sessionStorage) {
        this.storage = window.sessionStorage;
      } else {
        // Fallback to a no-op storage for SSR
        this.storage = {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
          clear: () => {},
          key: () => null,
          length: 0,
        } as Storage;
      }
    }
    this.configs = new Map();
  }

  /**
   * Configure un rate limit pour une opération spécifique
   * @param operation - Nom de l'opération (ex: 'create', 'update')
   * @param config - Configuration du rate limit
   */
  configure(operation: string, config: RateLimitConfig): void {
    this.configs.set(operation, config);
  }

  /**
   * Vérifie si une opération peut être effectuée
   * @param operation - Nom de l'opération
   * @returns { allowed: boolean; remaining: number; resetAt: number | null }
   */
  check(operation: string): { allowed: boolean; remaining: number; resetAt: number | null } {
    const config = this.configs.get(operation);
    if (!config) {
      // Si aucune configuration n'existe, autoriser l'opération
      return { allowed: true, remaining: Infinity, resetAt: null };
    }

    const key = `rate_limit:${operation}`;
    const now = Date.now();
    const stored = this.storage.getItem(key);

    let entry: RateLimitEntry;
    if (stored) {
      try {
        entry = JSON.parse(stored);
      } catch {
        // Si le parsing échoue, créer une nouvelle entrée
        entry = { count: 0, resetAt: now + config.windowMs };
      }
    } else {
      entry = { count: 0, resetAt: now + config.windowMs };
    }

    // Vérifier si la fenêtre de temps est expirée
    if (now >= entry.resetAt) {
      // Réinitialiser le compteur
      entry = { count: 0, resetAt: now + config.windowMs };
    }

    // Vérifier si la limite est atteinte
    if (entry.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
      };
    }

    // Incrémenter le compteur
    entry.count++;
    this.storage.setItem(key, JSON.stringify(entry));

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetAt: entry.resetAt,
    };
  }

  /**
   * Réinitialise le rate limit pour une opération
   * @param operation - Nom de l'opération
   */
  reset(operation: string): void {
    const key = `rate_limit:${operation}`;
    this.storage.removeItem(key);
  }

  /**
   * Réinitialise tous les rate limits
   */
  resetAll(): void {
    const keys: string[] = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && key.startsWith('rate_limit:')) {
        keys.push(key);
      }
    }
    keys.forEach((key) => this.storage.removeItem(key));
  }

  /**
   * Obtient les informations de rate limit pour une opération
   * @param operation - Nom de l'opération
   * @returns { count: number; maxRequests: number; resetAt: number | null }
   */
  getInfo(operation: string): { count: number; maxRequests: number; resetAt: number | null } {
    const config = this.configs.get(operation);
    if (!config) {
      return { count: 0, maxRequests: Infinity, resetAt: null };
    }

    const key = `rate_limit:${operation}`;
    const stored = this.storage.getItem(key);

    if (!stored) {
      return { count: 0, maxRequests: config.maxRequests, resetAt: null };
    }

    try {
      const entry: RateLimitEntry = JSON.parse(stored);
      return {
        count: entry.count,
        maxRequests: config.maxRequests,
        resetAt: entry.resetAt,
      };
    } catch {
      return { count: 0, maxRequests: config.maxRequests, resetAt: null };
    }
  }
}

// Instance singleton avec configuration par défaut
export const rateLimiter = new ClientRateLimiter();

// Configuration par défaut
rateLimiter.configure('create', {
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minute
});

rateLimiter.configure('update', {
  maxRequests: 20,
  windowMs: 60 * 1000, // 1 minute
});

/**
 * Vérifie si une opération peut être effectuée et lance une erreur si la limite est atteinte
 * @param operation - Nom de l'opération
 * @throws Error si la limite est atteinte
 */
export function checkRateLimit(operation: string): void {
  const result = rateLimiter.check(operation);
  if (!result.allowed) {
    const resetIn = result.resetAt ? Math.ceil((result.resetAt - Date.now()) / 1000) : 0;
    throw new Error(
      `Rate limit atteint pour l'opération "${operation}". Réessayez dans ${resetIn} secondes.`
    );
  }
}

/**
 * Obtient les informations de rate limit pour une opération
 * @param operation - Nom de l'opération
 * @returns Informations sur le rate limit
 */
export function getRateLimitInfo(operation: string): {
  count: number;
  maxRequests: number;
  resetAt: number | null;
} {
  return rateLimiter.getInfo(operation);
}

