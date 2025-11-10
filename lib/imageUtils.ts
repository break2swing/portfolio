/**
 * Utilitaires pour la génération de placeholders LQIP (Low Quality Image Placeholder)
 * Utilise l'API Canvas pour créer des placeholders flous optimisés
 */

/**
 * Génère un placeholder LQIP (Low Quality Image Placeholder) à partir d'une image
 * @param imageUrl - URL de l'image source
 * @param width - Largeur du placeholder (défaut: 20px)
 * @param height - Hauteur du placeholder (défaut: 20px)
 * @returns Promise<string> - Data URL du placeholder en base64
 */
export async function generateLQIP(
  imageUrl: string,
  width: number = 20,
  height: number = 20
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        // Créer un canvas temporaire
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Impossible de créer le contexte canvas'));
          return;
        }

        // Dessiner l'image redimensionnée sur le canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir en base64 data URL
        const dataURL = canvas.toDataURL('image/jpeg', 0.5); // Qualité 50% pour réduire la taille

        resolve(dataURL);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Erreur lors du chargement de l\'image pour générer le LQIP'));
    };

    img.src = imageUrl;
  });
}

/**
 * Génère un LQIP à partir d'un fichier File (pour les uploads)
 * @param file - Fichier image
 * @param width - Largeur du placeholder (défaut: 20px)
 * @param height - Hauteur du placeholder (défaut: 20px)
 * @returns Promise<string> - Data URL du placeholder en base64
 */
export async function generateLQIPFromFile(
  file: File,
  width: number = 20,
  height: number = 20
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Impossible de créer le contexte canvas'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataURL = canvas.toDataURL('image/jpeg', 0.5);

          resolve(dataURL);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Erreur lors du traitement de l\'image'));
      };

      if (e.target?.result) {
        img.src = e.target.result as string;
      } else {
        reject(new Error('Impossible de lire le fichier'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier'));
    };

    reader.readAsDataURL(file);
  });
}

