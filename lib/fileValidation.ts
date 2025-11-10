/**
 * Validation avancée des fichiers uploadés
 * Utilise les magic bytes (signatures de fichiers) pour détecter les falsifications de type MIME
 */

// Magic bytes pour différents formats de fichiers
const FILE_SIGNATURES: Record<string, number[][]> = {
  // Images
  'image/jpeg': [
    [0xff, 0xd8, 0xff], // JPEG standard
  ],
  'image/png': [
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], // PNG standard
  ],
  'image/webp': [
    [0x52, 0x49, 0x46, 0x46], // RIFF header
  ],
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
  // Vidéos
  'video/mp4': [
    [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], // MP4 (ftyp)
    [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70], // MP4 variant
    [0x00, 0x00, 0x00, 0x1c, 0x66, 0x74, 0x79, 0x70], // MP4 variant
  ],
  'video/webm': [
    [0x1a, 0x45, 0xdf, 0xa3], // WebM (EBML header)
  ],
  // Audio
  'audio/mpeg': [
    [0xff, 0xfb], // MP3 avec ID3v2
    [0xff, 0xf3], // MP3 sans ID3v2
    [0xff, 0xf2], // MP3 sans ID3v2
    [0x49, 0x44, 0x33], // MP3 avec ID3v2 (commence par ID3)
  ],
  'audio/wav': [
    [0x52, 0x49, 0x46, 0x46], // RIFF header
  ],
};

// Types MIME autorisés par catégorie
export const ALLOWED_MIME_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  videos: ['video/mp4', 'video/webm'],
  audio: ['audio/mpeg', 'audio/wav'],
} as const;

export type FileCategory = 'images' | 'videos' | 'audio';

/**
 * Lit les premiers bytes d'un fichier
 * @param file - Fichier à analyser
 * @param length - Nombre de bytes à lire (défaut: 12)
 * @returns Promise<Uint8Array> - Tableau des bytes lus
 */
async function readFileHeader(file: File, length: number = 12): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      if (e.target?.result instanceof ArrayBuffer) {
        const bytes = new Uint8Array(e.target.result);
        resolve(bytes);
      } else {
        reject(new Error('Impossible de lire le fichier'));
      }
    };
    
    reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
    
    // Lire seulement les premiers bytes
    const blob = file.slice(0, length);
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Vérifie si les bytes correspondent à une signature connue
 * @param bytes - Bytes à vérifier
 * @param signatures - Tableau de signatures possibles
 * @returns boolean - true si une signature correspond
 */
function matchesSignature(bytes: Uint8Array, signatures: number[][]): boolean {
  return signatures.some((signature) => {
    if (bytes.length < signature.length) return false;
    
    return signature.every((byte, index) => bytes[index] === byte);
  });
}

/**
 * Valide le type MIME réel d'un fichier en utilisant les magic bytes
 * @param file - Fichier à valider
 * @param expectedMimeType - Type MIME attendu
 * @returns Promise<{ valid: boolean; error?: string }>
 */
export async function validateFileSignature(
  file: File,
  expectedMimeType: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Vérifier que le type MIME attendu est dans nos signatures connues
    const signatures = FILE_SIGNATURES[expectedMimeType];
    if (!signatures) {
      return {
        valid: false,
        error: `Type MIME non supporté pour validation: ${expectedMimeType}`,
      };
    }

    // Lire les premiers bytes du fichier
    const maxSignatureLength = Math.max(...signatures.map((sig) => sig.length));
    const bytes = await readFileHeader(file, maxSignatureLength);

    // Vérifier si les bytes correspondent à une signature connue
    const isValid = matchesSignature(bytes, signatures);

    if (!isValid) {
      return {
        valid: false,
        error: `Le fichier ne correspond pas au type MIME déclaré (${expectedMimeType}). Signature invalide.`,
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: `Erreur lors de la validation du fichier: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
    };
  }
}

/**
 * Valide un fichier selon sa catégorie (images, videos, audio)
 * @param file - Fichier à valider
 * @param category - Catégorie du fichier
 * @returns Promise<{ valid: boolean; error?: string; mimeType?: string }>
 */
export async function validateFileByCategory(
  file: File,
  category: FileCategory
): Promise<{ valid: boolean; error?: string; mimeType?: string }> {
  const allowedTypes = ALLOWED_MIME_TYPES[category];
  
  // Vérifier que le type MIME déclaré est autorisé
  if (!allowedTypes.includes(file.type as any)) {
    return {
      valid: false,
      error: `Type MIME non autorisé: ${file.type}. Types autorisés: ${allowedTypes.join(', ')}`,
    };
  }

  // Valider la signature du fichier
  const signatureValidation = await validateFileSignature(file, file.type);
  if (!signatureValidation.valid) {
    return signatureValidation;
  }

  return {
    valid: true,
    mimeType: file.type,
  };
}

/**
 * Valide la taille d'un fichier
 * @param file - Fichier à valider
 * @param maxSizeBytes - Taille maximale en bytes
 * @returns { valid: boolean; error?: string }
 */
export function validateFileSize(file: File, maxSizeBytes: number): { valid: boolean; error?: string } {
  if (file.size > maxSizeBytes) {
    const maxSizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(2);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `Fichier trop volumineux: ${fileSizeMB} MB. Taille maximale autorisée: ${maxSizeMB} MB`,
    };
  }

  return { valid: true };
}

