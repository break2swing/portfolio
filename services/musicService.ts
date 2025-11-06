import { supabaseClient, MusicTrack } from '@/lib/supabaseClient';

export const musicService = {
  async getAllTracks() {
    const { data, error } = await supabaseClient
      .from('music_tracks')
      .select('*')
      .order('display_order', { ascending: true });

    return { tracks: data as MusicTrack[] | null, error };
  },

  async getTrackById(id: string) {
    const { data, error } = await supabaseClient
      .from('music_tracks')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    return { track: data as MusicTrack | null, error };
  },

  async getMaxDisplayOrder() {
    const { data, error } = await supabaseClient
      .from('music_tracks')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    return { maxOrder: data?.display_order ?? -1, error };
  },

  async createTrack(track: {
    title: string;
    artist: string | null;
    album: string | null;
    audio_url: string;
    cover_image_url: string | null;
    duration: number | null;
    display_order: number;
  }) {
    const { data, error } = await supabaseClient
      .from('music_tracks')
      .insert(track)
      .select()
      .single();

    return { track: data as MusicTrack | null, error };
  },

  async updateTrack(id: string, updates: Partial<MusicTrack>) {
    const { data, error } = await supabaseClient
      .from('music_tracks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { track: data as MusicTrack | null, error };
  },

  async deleteTrack(id: string) {
    const { error } = await supabaseClient
      .from('music_tracks')
      .delete()
      .eq('id', id);

    return { error };
  },

  async updateDisplayOrder(id: string, display_order: number) {
    const { error } = await supabaseClient
      .from('music_tracks')
      .update({ display_order })
      .eq('id', id);

    return { error };
  },
};
