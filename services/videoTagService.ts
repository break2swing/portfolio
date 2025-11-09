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
    const { error: deleteError } = await supabaseClient
      .from('video_tags')
      .delete()
      .eq('video_id', videoId);

    if (deleteError) {
      console.error('[VIDEO TAG SERVICE] Error deleting existing tags:', deleteError);
      return { error: deleteError };
    }

    // Ajouter les nouveaux tags
    if (tagIds.length > 0) {
      const { error } = await supabaseClient
        .from('video_tags')
        .insert(tagIds.map(tagId => ({ video_id: videoId, tag_id: tagId })));

      if (error) {
        console.error('[VIDEO TAG SERVICE] Error inserting tags:', error);
      }
      return { error };
    }

    return { error: null };
  },

  /**
   * Récupère tous les tags uniques utilisés dans les vidéos
   */
  async getAllTagsUsedInVideos() {
    const { data, error } = await supabaseClient
      .from('video_tags')
      .select('tag_id, tags(*)')
      .order('tags(name)', { ascending: true });

    if (error) {
      // Si la table n'existe pas, retourner une liste vide
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        return { tags: [], error: null };
      }
      return { tags: null, error };
    }

    // Extraire les tags uniques
    const tagMap = new Map<string, Tag>();
    data.forEach((item: any) => {
      if (item.tags && !tagMap.has(item.tag_id)) {
        tagMap.set(item.tag_id, item.tags);
      }
    });

    const tags = Array.from(tagMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );

    return { tags: tags as Tag[], error: null };
  },
};
