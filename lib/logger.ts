/**
 * Système de logs structuré avec niveaux et contextes
 * Permet un debugging unifié et une observabilité transverse
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  namespace: string;
  message: string;
  timestamp: string;
  sessionId?: string;
  context?: LogContext;
  error?: Error;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private currentLevel: LogLevel;
  private namespace: string;
  private isDevelopment: boolean;

  constructor(namespace: string = 'app') {
    this.namespace = namespace;
    this.isDevelopment = process.env.NODE_ENV !== 'production';

    // Récupérer le niveau depuis les variables d'environnement
    const envLevel = (process.env.NEXT_PUBLIC_LOG_LEVEL ||
                     (this.isDevelopment ? 'debug' : 'info')) as LogLevel;

    this.currentLevel = envLevel;
  }

  /**
   * Crée un logger enfant avec un namespace spécifique
   * @param childNamespace Namespace du logger enfant
   * @returns Nouvelle instance de Logger
   */
  child(childNamespace: string): Logger {
    return new Logger(`${this.namespace}:${childNamespace}`);
  }

  /**
   * Vérifie si un niveau de log doit être affiché
   * @param level Niveau à vérifier
   * @returns true si le niveau doit être affiché
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.currentLevel];
  }

  /**
   * Récupère le session ID depuis sessionStorage (corrélation avec RUM)
   * @returns Session ID ou null
   */
  private getSessionId(): string | null {
    if (typeof window === 'undefined') return null;

    try {
      return sessionStorage.getItem('analytics-session-id');
    } catch {
      return null;
    }
  }

  /**
   * Sanitize les données pour éviter les fuites de données sensibles
   * @param data Données à sanitizer
   * @returns Données sanitizées
   */
  private sanitize(data: any): any {
    if (!data) return data;

    // Copie profonde pour ne pas modifier l'original
    const sanitized = JSON.parse(JSON.stringify(data));

    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'authorization', 'cookie'];

    const sanitizeObject = (obj: any): void => {
      if (typeof obj !== 'object' || obj === null) return;

      Object.keys(obj).forEach(key => {
        const lowerKey = key.toLowerCase();

        // Masquer les clés sensibles
        if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          sanitizeObject(obj[key]);
        }
      });
    };

    sanitizeObject(sanitized);
    return sanitized;
  }

  /**
   * Formate et affiche une entrée de log
   * @param entry Entrée de log
   */
  private output(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const timestamp = new Date().toISOString();
    const sessionId = this.getSessionId();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.namespace}]`;

    // En développement, utiliser console avec couleurs
    if (this.isDevelopment) {
      const styles: Record<LogLevel, string> = {
        debug: 'color: #888',
        info: 'color: #0088cc',
        warn: 'color: #ff8800',
        error: 'color: #cc0000; font-weight: bold',
      };

      console.log(`%c${prefix}`, styles[entry.level], entry.message);

      if (sessionId) {
        console.log('Session ID:', sessionId);
      }

      if (entry.context) {
        console.log('Context:', this.sanitize(entry.context));
      }

      if (entry.error) {
        console.error('Error:', entry.error);
      }
    } else {
      // En production, log structuré JSON
      const logData = {
        ...entry,
        timestamp,
        ...(sessionId && { sessionId }),
      };

      // Sanitizer les données sensibles
      if (logData.context) {
        logData.context = this.sanitize(logData.context);
      }

      // Utiliser console approprié selon le niveau
      switch (entry.level) {
        case 'error':
          console.error(JSON.stringify(logData));
          break;
        case 'warn':
          console.warn(JSON.stringify(logData));
          break;
        default:
          console.log(JSON.stringify(logData));
      }
    }
  }

  /**
   * Log un message de debug
   * @param message Message à logger
   * @param context Contexte optionnel
   */
  debug(message: string, context?: LogContext): void {
    this.output({
      level: 'debug',
      namespace: this.namespace,
      message,
      timestamp: new Date().toISOString(),
      context,
    });
  }

  /**
   * Log un message d'information
   * @param message Message à logger
   * @param context Contexte optionnel
   */
  info(message: string, context?: LogContext): void {
    this.output({
      level: 'info',
      namespace: this.namespace,
      message,
      timestamp: new Date().toISOString(),
      context,
    });
  }

  /**
   * Log un avertissement
   * @param message Message à logger
   * @param context Contexte optionnel
   */
  warn(message: string, context?: LogContext): void {
    this.output({
      level: 'warn',
      namespace: this.namespace,
      message,
      timestamp: new Date().toISOString(),
      context,
    });
  }

  /**
   * Log une erreur
   * @param message Message à logger
   * @param error Erreur optionnelle
   * @param context Contexte optionnel
   */
  error(message: string, error?: Error | any, context?: LogContext): void {
    // Si le second paramètre est un objet sans stack, c'est probablement le contexte
    let actualError: Error | undefined;
    let actualContext: LogContext | undefined = context;

    if (error) {
      if (error instanceof Error || error?.stack) {
        actualError = error;
      } else {
        // C'est probablement un contexte passé en second paramètre
        actualContext = error;
        actualError = undefined;
      }
    }

    this.output({
      level: 'error',
      namespace: this.namespace,
      message,
      timestamp: new Date().toISOString(),
      error: actualError,
      context: actualContext,
    });
  }

  /**
   * Définit le niveau de log courant
   * @param level Nouveau niveau
   */
  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  /**
   * Récupère le niveau de log courant
   * @returns Niveau actuel
   */
  getLevel(): LogLevel {
    return this.currentLevel;
  }
}

// Logger par défaut
export const logger = new Logger('app');

// Créer des loggers pour différentes parties de l'application
export const createLogger = (namespace: string): Logger => {
  return new Logger(namespace);
};

// Loggers pré-configurés pour les services
export const serviceLogger = createLogger('service');
export const componentLogger = createLogger('component');
export const apiLogger = createLogger('api');
