import { supabaseClient } from '@/lib/supabaseClient';

const BUCKET_NAME = 'photo-files';

export const storageService = {
  async uploadPhoto(file: File, fileName: string) {
    const { data, error } = await supabaseClient.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    return { data, error };
  },

  getPublicUrl(fileName: string) {
    const { data } = supabaseClient.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    return data.publicUrl;
  },

  async deletePhoto(fileName: string) {
    const { data, error } = await supabaseClient.storage
      .from(BUCKET_NAME)
      .remove([fileName]);

    return { data, error };
  },

  extractFileNameFromUrl(url: string): string {
    const urlParts = url.split('/');
    return urlParts[urlParts.length - 1];
  },
};
