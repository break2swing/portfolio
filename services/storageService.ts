import { supabaseClient } from '@/lib/supabaseClient';
import imageCompression from 'browser-image-compression';
import { generateLQIPFromFile } from '@/lib/imageUtils';

const PHOTO_BUCKET = 'photo-files';
const AUDIO_BUCKET = 'audio-files';
const VIDEO_BUCKET = 'video-files';

/**
 * Compresse une image côté client pour réduire la taille du fichier
 * @param file - Fichier image à compresser
 * @returns Fichier compressé
 */
async function compressImage(file: File): Promise<File> {
  // Options de compression optimisées
  const options = {
    maxSizeMB: 1, // Taille maximale de 1MB
    maxWidthOrHeight: 1920, // Largeur/hauteur max pour garder une bonne qualité
    useWebWorker: true, // Utilise un Web Worker pour ne pas bloquer le thread principal
    fileType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
    initialQuality: 0.85, // Qualité initiale à 85% (bon compromis)
  };

  try {
    console.log('[COMPRESSION] Original file size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
    const compressedFile = await imageCompression(file, options);
    console.log('[COMPRESSION] Compressed file size:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('[COMPRESSION] Reduction:', ((1 - compressedFile.size / file.size) * 100).toFixed(1), '%');
    return compressedFile;
  } catch (error) {
    console.error('[COMPRESSION] Error compressing image:', error);
    // En cas d'erreur, on retourne le fichier original
    return file;
  }
}

export const storageService = {
  async uploadPhoto(file: File, fileName: string) {
    // Compresser l'image avant l'upload pour réduire la bande passante
    const compressedFile = await compressImage(file);

    const { data, error } = await supabaseClient.storage
      .from(PHOTO_BUCKET)
      .upload(fileName, compressedFile, {
        cacheControl: '3600',
        upsert: false,
      });

    return { data, error };
  },

  /**
   * Génère un LQIP pour un fichier image
   * @param file - Fichier image
   * @returns Promise<string | null> - Data URL du LQIP ou null en cas d'erreur
   */
  async generateLQIPForPhoto(file: File): Promise<string | null> {
    try {
      const lqip = await generateLQIPFromFile(file, 20, 20);
      return lqip;
    } catch (error) {
      console.error('[STORAGE] Error generating LQIP:', error);
      return null;
    }
  },

  getPublicUrl(fileName: string) {
    const { data } = supabaseClient.storage
      .from(PHOTO_BUCKET)
      .getPublicUrl(fileName);

    return data.publicUrl;
  },

  async deletePhoto(fileName: string) {
    const { data, error } = await supabaseClient.storage
      .from(PHOTO_BUCKET)
      .remove([fileName]);

    return { data, error };
  },

  async uploadAudio(file: File, fileName: string) {
    console.log('[STORAGE] Upload audio - Starting');
    console.log('[STORAGE] Bucket:', AUDIO_BUCKET);
    console.log('[STORAGE] File name:', fileName);
    console.log('[STORAGE] File type:', file.type);
    console.log('[STORAGE] File size:', file.size);

    const { data, error } = await supabaseClient.storage
      .from(AUDIO_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('[STORAGE] Upload audio - ERROR:', error);
      console.error('[STORAGE] Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log('[STORAGE] Upload audio - SUCCESS:', data);
    }

    return { data, error };
  },

  getAudioPublicUrl(fileName: string) {
    const { data } = supabaseClient.storage
      .from(AUDIO_BUCKET)
      .getPublicUrl(fileName);

    return data.publicUrl;
  },

  async deleteAudio(fileName: string) {
    const { data, error } = await supabaseClient.storage
      .from(AUDIO_BUCKET)
      .remove([fileName]);

    return { data, error };
  },

  async uploadVideo(file: File, fileName: string) {
    console.log('[STORAGE] Upload video - Starting');
    console.log('[STORAGE] Bucket:', VIDEO_BUCKET);
    console.log('[STORAGE] File name:', fileName);
    console.log('[STORAGE] File type:', file.type);
    console.log('[STORAGE] File size:', file.size);

    const { data, error } = await supabaseClient.storage
      .from(VIDEO_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('[STORAGE] Upload video - ERROR:', error);
      console.error('[STORAGE] Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log('[STORAGE] Upload video - SUCCESS:', data);
    }

    return { data, error };
  },

  getVideoPublicUrl(fileName: string) {
    const { data } = supabaseClient.storage
      .from(VIDEO_BUCKET)
      .getPublicUrl(fileName);

    return data.publicUrl;
  },

  async deleteVideo(fileName: string) {
    const { data, error } = await supabaseClient.storage
      .from(VIDEO_BUCKET)
      .remove([fileName]);

    return { data, error };
  },

  extractFileNameFromUrl(url: string): string {
    const urlParts = url.split('/');
    return urlParts[urlParts.length - 1];
  },

  /**
   * Liste les fichiers d'un dépôt dans Storage
   */
  async listRepositoryFiles(bucket: string, path: string = ''): Promise<{ files: any[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabaseClient.storage
        .from(bucket)
        .list(path, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' },
        });

      if (error) {
        console.error('[STORAGE] Error listing repository files:', error);
        return { files: null, error };
      }

      // Transformer les données Storage en format similaire à RepositoryFile
      const files = (data || []).map((item) => ({
        name: item.name,
        path: path ? `${path}/${item.name}` : item.name,
        size: item.metadata?.size || null,
        is_directory: !item.id, // Les dossiers n'ont pas d'id dans Storage
        last_modified: item.updated_at || null,
      }));

      return { files, error: null };
    } catch (error) {
      console.error('[STORAGE] Unexpected error listing repository files:', error);
      return { files: null, error: error as Error };
    }
  },

  /**
   * Télécharge le contenu d'un fichier depuis Storage
   */
  async getRepositoryFile(bucket: string, path: string): Promise<{ content: string | null; error: Error | null }> {
    try {
      const { data, error } = await supabaseClient.storage
        .from(bucket)
        .download(path);

      if (error) {
        console.error('[STORAGE] Error downloading repository file:', error);
        return { content: null, error };
      }

      if (!data) {
        return { content: null, error: new Error('File not found') };
      }

      // Convertir le Blob en texte
      const content = await data.text();
      return { content, error: null };
    } catch (error) {
      console.error('[STORAGE] Unexpected error downloading repository file:', error);
      return { content: null, error: error as Error };
    }
  },

  /**
   * Upload plusieurs fichiers d'un dépôt avec préservation de la structure
   */
  async uploadRepositoryFiles(
    bucket: string,
    files: File[],
    basePath: string
  ): Promise<{ uploaded: number; error: Error | null }> {
    try {
      let uploaded = 0;
      const errors: Error[] = [];

      for (const file of files) {
        // Utiliser webkitRelativePath si disponible (pour préserver la structure de dossiers)
        // Sinon utiliser juste le nom du fichier
        let relativePath = '';
        if ('webkitRelativePath' in file && file.webkitRelativePath) {
          // webkitRelativePath contient le chemin complet depuis la racine du dossier sélectionné
          relativePath = file.webkitRelativePath;
        } else {
          relativePath = file.name;
        }

        // Construire le chemin final dans Storage
        const filePath = basePath ? `${basePath}/${relativePath}` : relativePath;

        const { error } = await supabaseClient.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true, // Permettre l'écrasement si le fichier existe déjà
          });

        if (error) {
          console.error(`[STORAGE] Error uploading file ${filePath}:`, error);
          errors.push(error);
        } else {
          uploaded++;
        }
      }

      if (errors.length > 0 && uploaded === 0) {
        return { uploaded: 0, error: errors[0] };
      }

      return { uploaded, error: null };
    } catch (error) {
      console.error('[STORAGE] Unexpected error uploading repository files:', error);
      return { uploaded: 0, error: error as Error };
    }
  },

  /**
   * Crée une structure de dossiers dans Storage (via upload d'un fichier vide)
   * Note: Supabase Storage ne supporte pas les dossiers vides, donc on crée un fichier .gitkeep
   */
  async createRepositoryFolder(bucket: string, path: string): Promise<{ error: Error | null }> {
    try {
      // Créer un fichier .gitkeep pour représenter le dossier
      const folderPath = path.endsWith('/') ? `${path}.gitkeep` : `${path}/.gitkeep`;
      const emptyFile = new File([''], '.gitkeep', { type: 'text/plain' });

      const { error } = await supabaseClient.storage
        .from(bucket)
        .upload(folderPath, emptyFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('[STORAGE] Error creating repository folder:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('[STORAGE] Unexpected error creating repository folder:', error);
      return { error: error as Error };
    }
  },
};
