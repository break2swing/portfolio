import { supabaseClient } from '@/lib/supabaseClient';

const PHOTO_BUCKET = 'photo-files';
const AUDIO_BUCKET = 'audio-files';
const VIDEO_BUCKET = 'video-files';

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
