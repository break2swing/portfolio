/**
 * Génère un placeholder flou (LQIP - Low Quality Image Placeholder) pour une image
 * en utilisant l'API Canvas
 *
 * @param src - URL de l'image source
 * @param width - Largeur du placeholder (par défaut 16px)
 * @param height - Hauteur du placeholder (par défaut 16px)
 * @returns Promise<string> - Data URL du placeholder flou
 */
export async function generateBlurPlaceholder(
  src: string,
  width: number = 16,
  height: number = 16
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        // Créer un canvas de petite taille
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Impossible de créer le contexte 2D'));
          return;
        }

        // Dessiner l'image redimensionnée
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir en data URL avec qualité réduite
        const dataUrl = canvas.toDataURL('image/jpeg', 0.1);
        resolve(dataUrl);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error(`Impossible de charger l'image: ${src}`));
    };

    img.src = src;
  });
}

/**
 * Génère les URLs srcset pour différentes largeurs responsive
 *
 * @param baseSrc - URL de base de l'image
 * @param widths - Tableau des largeurs désirées (par défaut [320, 640, 1024, 1920])
 * @returns string - Attribut srcset formaté
 */
export function generateSrcSet(
  baseSrc: string,
  widths: number[] = [320, 640, 1024, 1920]
): string {
  // Si l'URL contient déjà des paramètres, utiliser & sinon ?
  const separator = baseSrc.includes('?') ? '&' : '?';

  return widths
    .map(width => `${baseSrc}${separator}w=${width} ${width}w`)
    .join(', ');
}

/**
 * Génère l'attribut sizes selon les breakpoints Tailwind
 *
 * @param variant - Type de layout ('full' | 'half' | 'third' | 'card')
 * @returns string - Attribut sizes formaté
 */
export function generateSizes(variant: 'full' | 'half' | 'third' | 'card' = 'full'): string {
  const sizesMap = {
    full: '100vw',
    half: '(max-width: 768px) 100vw, 50vw',
    third: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw',
    card: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw',
  };

  return sizesMap[variant];
}
