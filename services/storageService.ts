import { supabaseClient } from '@/lib/supabaseClient';

const PHOTO_BUCKET = 'photo-files';
const AUDIO_BUCKET = 'audio-files';

export const storageService = {
  async uploadPhoto(file: File, fileName: string) {
    const { data, error } = await supabaseClient.storage
      .from(PHOTO_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    return { data, error };
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
    const { data, error } = await supabaseClient.storage
      .from(AUDIO_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

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

  extractFileNameFromUrl(url: string): string {
    const urlParts = url.split('/');
    return urlParts[urlParts.length - 1];
  },
};
