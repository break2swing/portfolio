/**
 * Validation des URLs pour prévenir les injections et les redirections malveillantes
 */

// Domaines autorisés pour les URLs (Supabase Storage)
const ALLOWED_DOMAINS = [
  'supabase.co',
  'supabase.in',
  'storage.googleapis.com', // Pour les buckets Supabase
];

// Protocoles dangereux à bloquer
const DANGEROUS_PROTOCOLS = [
  'javascript:',
  'data:',
  'vbscript:',
  'file:',
  'about:',
];

/**
 * Valide qu'une URL est sécurisée
 * @param url - URL à valider
 * @param options - Options de validation
 * @returns { valid: boolean; error?: string }
 */
export function validateUrl(
  url: string,
  options: {
    requireHttps?: boolean;
    allowedDomains?: string[];
    allowLocalhost?: boolean;
  } = {}
): { valid: boolean; error?: string } {
  const {
    requireHttps = true,
    allowedDomains = ALLOWED_DOMAINS,
    allowLocalhost = false,
  } = options;

  // Vérifier que l'URL n'est pas vide
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return {
      valid: false,
      error: 'URL vide ou invalide',
    };
  }

  const trimmedUrl = url.trim();

  // Vérifier les protocoles dangereux
  const lowerUrl = trimmedUrl.toLowerCase();
  for (const protocol of DANGEROUS_PROTOCOLS) {
    if (lowerUrl.startsWith(protocol)) {
      return {
        valid: false,
        error: `Protocole dangereux détecté: ${protocol}`,
      };
    }
  }

  // Vérifier le format de l'URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmedUrl);
  } catch (error) {
    return {
      valid: false,
      error: 'Format d\'URL invalide',
    };
  }

  // Vérifier le protocole HTTPS (ou HTTP en développement)
  if (requireHttps) {
    if (parsedUrl.protocol !== 'https:') {
      // Autoriser HTTP uniquement pour localhost en développement
      if (parsedUrl.protocol === 'http:' && allowLocalhost && parsedUrl.hostname === 'localhost') {
        // OK pour développement local
      } else {
        return {
          valid: false,
          error: 'Seules les URLs HTTPS sont autorisées',
        };
      }
    }
  } else {
    // Si HTTPS n'est pas requis, vérifier au moins que ce n'est pas un protocole dangereux
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return {
        valid: false,
        error: `Protocole non autorisé: ${parsedUrl.protocol}`,
      };
    }
  }

  // Vérifier le domaine autorisé
  if (allowedDomains.length > 0) {
    const hostname = parsedUrl.hostname.toLowerCase();
    const isAllowed = allowedDomains.some((domain) => {
      // Vérifier si le hostname correspond exactement ou est un sous-domaine
      return hostname === domain || hostname.endsWith('.' + domain);
    });

    // Autoriser localhost en développement si spécifié
    if (!isAllowed && allowLocalhost && hostname === 'localhost') {
      // OK pour développement local
    } else if (!isAllowed) {
      return {
        valid: false,
        error: `Domaine non autorisé: ${hostname}. Domaines autorisés: ${allowedDomains.join(', ')}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Valide une URL Supabase Storage
 * @param url - URL à valider
 * @returns { valid: boolean; error?: string }
 */
export function validateSupabaseStorageUrl(url: string): { valid: boolean; error?: string } {
  return validateUrl(url, {
    requireHttps: true,
    allowedDomains: ALLOWED_DOMAINS,
    allowLocalhost: false,
  });
}

/**
 * Valide une URL pour les champs image_url, video_url, audio_url
 * @param url - URL à valider
 * @param fieldName - Nom du champ (pour les messages d'erreur)
 * @returns { valid: boolean; error?: string }
 */
export function validateMediaUrl(
  url: string,
  fieldName: string = 'URL'
): { valid: boolean; error?: string } {
  // Pour les médias, on exige HTTPS et un domaine autorisé
  return validateUrl(url, {
    requireHttps: true,
    allowedDomains: ALLOWED_DOMAINS,
    allowLocalhost: false,
  });
}

