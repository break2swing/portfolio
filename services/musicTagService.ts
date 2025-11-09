import { supabaseClient, Tag } from '@/lib/supabaseClient';

export const musicTagService = {
  /**
   * Récupère tous les tags d'un morceau de musique
   */
  async getTagsForMusicTrack(musicTrackId: string) {
    const { data, error } = await supabaseClient
      .from('music_tags')
      .select('tag_id, tags(*)')
      .eq('music_track_id', musicTrackId);

    if (error) return { tags: null, error };

    const tags = data.map((item: any) => item.tags).filter(Boolean);
    return { tags: tags as Tag[], error: null };
  },

  /**
   * Ajoute un tag à un morceau de musique
   */
  async addTagToMusicTrack(musicTrackId: string, tagId: string) {
    const { error } = await supabaseClient
      .from('music_tags')
      .insert({ music_track_id: musicTrackId, tag_id: tagId });

    return { error };
  },

  /**
   * Retire un tag d'un morceau de musique
   */
  async removeTagFromMusicTrack(musicTrackId: string, tagId: string) {
    const { error } = await supabaseClient
      .from('music_tags')
      .delete()
      .eq('music_track_id', musicTrackId)
      .eq('tag_id', tagId);

    return { error };
  },

  /**
   * Définit l'ensemble des tags d'un morceau de musique
   * (remplace tous les tags existants)
   */
  async setTagsForMusicTrack(musicTrackId: string, tagIds: string[]) {
    // Supprimer tous les tags existants
    const { error: deleteError } = await supabaseClient
      .from('music_tags')
      .delete()
      .eq('music_track_id', musicTrackId);

    if (deleteError) {
      console.error('[MUSIC TAG SERVICE] Error deleting existing tags:', deleteError);
      return { error: deleteError };
    }

    // Ajouter les nouveaux tags
    if (tagIds.length > 0) {
      const { error } = await supabaseClient
        .from('music_tags')
        .insert(tagIds.map(tagId => ({ music_track_id: musicTrackId, tag_id: tagId })));

      if (error) {
        console.error('[MUSIC TAG SERVICE] Error inserting tags:', error);
      }
      return { error };
    }

    return { error: null };
  },
};
