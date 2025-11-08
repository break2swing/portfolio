import { supabaseClient, Photo } from '@/lib/supabaseClient';

export const photoService = {
  async getAllPhotos() {
    const { data, error } = await supabaseClient
      .from('photos')
      .select('*')
      .order('display_order', { ascending: true });

    return { photos: data as Photo[] | null, error };
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
};
