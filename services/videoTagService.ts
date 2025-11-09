import { supabaseClient, Tag } from '@/lib/supabaseClient';

export const videoTagService = {
  /**
   * Récupère tous les tags d'une vidéo
   */
  async getTagsForVideo(videoId: string) {
    const { data, error } = await supabaseClient
      .from('video_tags')
      .select('tag_id, tags(*)')
      .eq('video_id', videoId);

    if (error) return { tags: null, error };

    const tags = data.map((item: any) => item.tags).filter(Boolean);
    return { tags: tags as Tag[], error: null };
  },

  /**
   * Ajoute un tag à une vidéo
   */
  async addTagToVideo(videoId: string, tagId: string) {
    const { error } = await supabaseClient
      .from('video_tags')
      .insert({ video_id: videoId, tag_id: tagId });

    return { error };
  },

  /**
   * Retire un tag d'une vidéo
   */
  async removeTagFromVideo(videoId: string, tagId: string) {
    const { error } = await supabaseClient
      .from('video_tags')
      .delete()
      .eq('video_id', videoId)
      .eq('tag_id', tagId);

    return { error };
  },

  /**
   * Définit l'ensemble des tags d'une vidéo
   * (remplace tous les tags existants)
   */
  async setTagsForVideo(videoId: string, tagIds: string[]) {
    // Supprimer tous les tags existants
    await supabaseClient
      .from('video_tags')
      .delete()
      .eq('video_id', videoId);

    // Ajouter les nouveaux tags
    if (tagIds.length > 0) {
      const { error } = await supabaseClient
        .from('video_tags')
        .insert(tagIds.map(tagId => ({ video_id: videoId, tag_id: tagId })));

      return { error };
    }

    return { error: null };
  },
};
