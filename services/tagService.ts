import { supabaseClient, Tag } from '@/lib/supabaseClient';
import { cache } from '@/lib/cache';

export const tagService = {
  async getAllTags() {
    const CACHE_KEY = 'tags:all';
    const TTL = 10 * 60 * 1000; // 10 minutes

    // Vérifier le cache
    const cached = cache.get<{ tags: Tag[]; error: null }>(CACHE_KEY);
    if (cached) {
      return cached;
    }

    const { data, error } = await supabaseClient
      .from('tags')
      .select('*')
      .order('name', { ascending: true });

    if (error) return { tags: null, error };

    const result = { tags: data as Tag[], error: null };

    // Mettre en cache
    cache.set(CACHE_KEY, result, { ttl: TTL, storage: 'session' });

    return result;
  },

  async getTagById(id: string) {
    const { data, error } = await supabaseClient
      .from('tags')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    return { tag: data as Tag | null, error };
  },

  async getTagBySlug(slug: string) {
    const { data, error} = await supabaseClient
      .from('tags')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    return { tag: data as Tag | null, error };
  },

  async createTag(tag: {
    name: string;
    slug?: string;
    color?: string;
  }) {
    const { data, error } = await supabaseClient
      .from('tags')
      .insert(tag)
      .select()
      .single();

    if (!error) {
      // Invalider le cache des tags
      cache.invalidatePattern('tags:');
    }

    return { tag: data as Tag | null, error };
  },

  async updateTag(id: string, updates: Partial<Tag>) {
    const { data, error } = await supabaseClient
      .from('tags')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (!error) {
      // Invalider le cache des tags et des textes (qui affichent les tags)
      cache.invalidatePattern('tags:');
      cache.invalidatePattern('texts:');
    }

    return { tag: data as Tag | null, error };
  },

  async deleteTag(id: string) {
    const { error } = await supabaseClient
      .from('tags')
      .delete()
      .eq('id', id);

    if (!error) {
      // Invalider le cache des tags et des textes
      cache.invalidatePattern('tags:');
      cache.invalidatePattern('texts:');
    }

    return { error };
  },

  // Méthodes pour gérer les relations text_tags
  async getTagsForText(textId: string) {
    const { data, error } = await supabaseClient
      .from('text_tags')
      .select('tag_id, tags(*)')
      .eq('text_id', textId);

    if (error) return { tags: null, error };

    const tags = data.map((item: any) => item.tags).filter(Boolean);
    return { tags: tags as Tag[], error: null };
  },

  async addTagToText(textId: string, tagId: string) {
    const { error } = await supabaseClient
      .from('text_tags')
      .insert({ text_id: textId, tag_id: tagId });

    return { error };
  },

  async removeTagFromText(textId: string, tagId: string) {
    const { error } = await supabaseClient
      .from('text_tags')
      .delete()
      .eq('text_id', textId)
      .eq('tag_id', tagId);

    return { error };
  },

  async setTagsForText(textId: string, tagIds: string[]) {
    // Supprimer tous les tags existants
    const { error: deleteError } = await supabaseClient
      .from('text_tags')
      .delete()
      .eq('text_id', textId);

    if (deleteError) {
      console.error('[TAG SERVICE] Error deleting existing tags:', deleteError);
      return { error: deleteError };
    }

    // Ajouter les nouveaux tags
    if (tagIds.length > 0) {
      const { error } = await supabaseClient
        .from('text_tags')
        .insert(tagIds.map(tagId => ({ text_id: textId, tag_id: tagId })));

      if (error) {
        console.error('[TAG SERVICE] Error inserting tags:', error);
        return { error };
      }
    }

    // Invalider le cache des textes (les tags des textes ont changé)
    cache.invalidatePattern('texts:');

    return { error: null };
  },

  /**
   * Récupère tous les tags uniques utilisés dans les textes publiés
   */
  async getAllTagsUsedInTexts() {
    // Récupérer les tags via les textes publiés
    const { data, error } = await supabaseClient
      .from('texts')
      .select(`
        text_tags(tag:tags(*))
      `)
      .eq('is_published', true);

    if (error) {
      return { tags: null, error };
    }

    // Extraire les tags uniques des textes publiés uniquement
    const tagMap = new Map<string, Tag>();
    data.forEach((text: any) => {
      if (text.text_tags) {
        text.text_tags.forEach((tt: any) => {
          if (tt.tag && !tagMap.has(tt.tag.id)) {
            tagMap.set(tt.tag.id, tt.tag);
          }
        });
      }
    });

    const tags = Array.from(tagMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );

    return { tags: tags as Tag[], error: null };
  },
};
