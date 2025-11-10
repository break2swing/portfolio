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
};
