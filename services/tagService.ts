import { supabaseClient, Tag } from '@/lib/supabaseClient';

export const tagService = {
  async getAllTags() {
    const { data, error } = await supabaseClient
      .from('tags')
      .select('*')
      .order('name', { ascending: true });

    return { tags: data as Tag[] | null, error };
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

    return { tag: data as Tag | null, error };
  },

  async updateTag(id: string, updates: Partial<Tag>) {
    const { data, error } = await supabaseClient
      .from('tags')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { tag: data as Tag | null, error };
  },

  async deleteTag(id: string) {
    const { error } = await supabaseClient
      .from('tags')
      .delete()
      .eq('id', id);

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
    await supabaseClient
      .from('text_tags')
      .delete()
      .eq('text_id', textId);

    // Ajouter les nouveaux tags
    if (tagIds.length > 0) {
      const { error } = await supabaseClient
        .from('text_tags')
        .insert(tagIds.map(tagId => ({ text_id: textId, tag_id: tagId })));

      return { error };
    }

    return { error: null };
  },
};
