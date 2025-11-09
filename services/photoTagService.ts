import { supabaseClient, Tag } from '@/lib/supabaseClient';

export const photoTagService = {
  /**
   * Récupère tous les tags d'une photo
   */
  async getTagsForPhoto(photoId: string) {
    const { data, error } = await supabaseClient
      .from('photo_tags')
      .select('tag_id, tags(*)')
      .eq('photo_id', photoId);

    if (error) return { tags: null, error };

    const tags = data.map((item: any) => item.tags).filter(Boolean);
    return { tags: tags as Tag[], error: null };
  },

  /**
   * Ajoute un tag à une photo
   */
  async addTagToPhoto(photoId: string, tagId: string) {
    const { error } = await supabaseClient
      .from('photo_tags')
      .insert({ photo_id: photoId, tag_id: tagId });

    return { error };
  },

  /**
   * Retire un tag d'une photo
   */
  async removeTagFromPhoto(photoId: string, tagId: string) {
    const { error } = await supabaseClient
      .from('photo_tags')
      .delete()
      .eq('photo_id', photoId)
      .eq('tag_id', tagId);

    return { error };
  },

  /**
   * Définit l'ensemble des tags d'une photo
   * (remplace tous les tags existants)
   */
  async setTagsForPhoto(photoId: string, tagIds: string[]) {
    // Supprimer tous les tags existants
    const { error: deleteError } = await supabaseClient
      .from('photo_tags')
      .delete()
      .eq('photo_id', photoId);

    if (deleteError) {
      console.error('[PHOTO TAG SERVICE] Error deleting existing tags:', deleteError);
      return { error: deleteError };
    }

    // Ajouter les nouveaux tags
    if (tagIds.length > 0) {
      const { error } = await supabaseClient
        .from('photo_tags')
        .insert(tagIds.map(tagId => ({ photo_id: photoId, tag_id: tagId })));

      if (error) {
        console.error('[PHOTO TAG SERVICE] Error inserting tags:', error);
      }
      return { error };
    }

    return { error: null };
  },

  /**
   * Récupère tous les tags uniques utilisés dans les photos
   */
  async getAllTagsUsedInPhotos() {
    const { data, error } = await supabaseClient
      .from('photo_tags')
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
