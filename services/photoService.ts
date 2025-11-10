import { supabaseClient, Photo, PhotoWithTags } from '@/lib/supabaseClient';
import { photoTagService } from './photoTagService';
import { cache } from '@/lib/cache';
import { validateMediaUrl } from '@/lib/urlValidation';
import { checkRateLimit } from '@/lib/rateLimiter';

export const photoService = {
  async getAllPhotos() {
    const { data, error } = await supabaseClient
      .from('photos')
      .select('*')
      .order('display_order', { ascending: true });

    return { photos: data as Photo[] | null, error };
  },

  async getAllPhotosWithTags() {
    const CACHE_KEY = 'photos:all-with-tags';
    const TTL = 5 * 60 * 1000; // 5 minutes

    // Vérifier le cache
    const cached = cache.get<{ photos: PhotoWithTags[]; error: null }>(CACHE_KEY);
    if (cached) {
      return cached;
    }

    const { data, error } = await supabaseClient
      .from('photos')
      .select(`
        *,
        photo_tags(tag:tags(*))
      `)
      .order('display_order', { ascending: true});

    if (error) return { photos: null, error };

    const photos = data.map((photo: any) => ({
      ...photo,
      tags: photo.photo_tags?.map((pt: any) => pt.tag).filter(Boolean) || [],
    }));

    photos.forEach((photo: any) => delete photo.photo_tags);

    const result = { photos: photos as PhotoWithTags[], error: null };

    // Mettre en cache
    cache.set(CACHE_KEY, result, { ttl: TTL, storage: 'session' });

    return result;
  },

  async getPhotoById(id: string) {
    const { data, error } = await supabaseClient
      .from('photos')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    return { photo: data as Photo | null, error };
  },

  async getMaxDisplayOrder() {
    const { data, error } = await supabaseClient
      .from('photos')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    return { maxOrder: data?.display_order ?? -1, error };
  },

  async createPhoto(photo: {
    title: string;
    description: string | null;
    image_url: string;
    blur_data_url?: string | null;
    display_order: number;
    user_id?: string | null;
  }) {
    // Vérifier le rate limit
    try {
      checkRateLimit('create');
    } catch (error) {
      return {
        photo: null,
        error: {
          message: error instanceof Error ? error.message : 'Rate limit atteint',
          code: 'RATE_LIMIT_EXCEEDED',
        } as any,
      };
    }

    // Valider l'URL de l'image
    const urlValidation = validateMediaUrl(photo.image_url, 'image_url');
    if (!urlValidation.valid) {
      return {
        photo: null,
        error: {
          message: urlValidation.error || 'URL invalide',
          code: 'INVALID_URL',
        } as any,
      };
    }

    // Récupérer l'utilisateur actuel si user_id n'est pas fourni
    const { data: { user } } = await supabaseClient.auth.getUser();
    const userId = photo.user_id ?? user?.id ?? null;

    const { data, error } = await supabaseClient
      .from('photos')
      .insert({
        ...photo,
        user_id: userId,
      })
      .select()
      .single();

    if (!error) {
      // Invalider le cache des photos
      cache.invalidatePattern('photos:');
    }

    return { photo: data as Photo | null, error };
  },

  async updatePhoto(id: string, updates: Partial<Photo>) {
    // Vérifier le rate limit
    try {
      checkRateLimit('update');
    } catch (error) {
      return {
        photo: null,
        error: {
          message: error instanceof Error ? error.message : 'Rate limit atteint',
          code: 'RATE_LIMIT_EXCEEDED',
        } as any,
      };
    }

    // Valider l'URL de l'image si elle est mise à jour
    if (updates.image_url) {
      const urlValidation = validateMediaUrl(updates.image_url, 'image_url');
      if (!urlValidation.valid) {
        return {
          photo: null,
          error: {
            message: urlValidation.error || 'URL invalide',
            code: 'INVALID_URL',
          } as any,
        };
      }
    }

    const { data, error } = await supabaseClient
      .from('photos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (!error) {
      // Invalider le cache des photos
      cache.invalidatePattern('photos:');
    }

    return { photo: data as Photo | null, error };
  },

  async deletePhoto(id: string) {
    const { error } = await supabaseClient
      .from('photos')
      .delete()
      .eq('id', id);

    if (!error) {
      // Invalider le cache des photos
      cache.invalidatePattern('photos:');
    }

    return { error };
  },

  async updateDisplayOrder(id: string, display_order: number) {
    const { error } = await supabaseClient
      .from('photos')
      .update({ display_order })
      .eq('id', id);

    return { error };
  },

  async createPhotoWithTags(
    photoData: {
      title: string;
      description: string | null;
      image_url: string;
      blur_data_url?: string | null;
      display_order: number;
      user_id?: string | null;
    },
    tagIds: string[] = []
  ) {
    const { photo, error } = await this.createPhoto(photoData);

    if (error || !photo) {
      return { photo: null, error };
    }

    // Ajouter les tags
    if (tagIds.length > 0) {
      const { error: tagsError } = await photoTagService.setTagsForPhoto(photo.id, tagIds);
      if (tagsError) {
        console.error('[PHOTO SERVICE] Error setting tags:', tagsError);
      }
    }

    return { photo, error: null };
  },
};
