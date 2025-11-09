import { supabaseClient, Photo, PhotoWithTags } from '@/lib/supabaseClient';
import { photoTagService } from './photoTagService';

export const photoService = {
  async getAllPhotos() {
    const { data, error } = await supabaseClient
      .from('photos')
      .select('*')
      .order('display_order', { ascending: true });

    return { photos: data as Photo[] | null, error };
  },

  async getAllPhotosWithTags() {
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

    return { photos: photos as PhotoWithTags[], error: null };
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
    display_order: number;
  }) {
    const { data, error } = await supabaseClient
      .from('photos')
      .insert(photo)
      .select()
      .single();

    return { photo: data as Photo | null, error };
  },

  async updatePhoto(id: string, updates: Partial<Photo>) {
    const { data, error } = await supabaseClient
      .from('photos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { photo: data as Photo | null, error };
  },

  async deletePhoto(id: string) {
    const { error } = await supabaseClient
      .from('photos')
      .delete()
      .eq('id', id);

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
      display_order: number;
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
