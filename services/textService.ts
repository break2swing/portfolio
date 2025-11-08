import { supabaseClient, Text, TextWithMetadata, Category, Tag } from '@/lib/supabaseClient';
import { tagService } from './tagService';

export const textService = {
  async getAllTexts() {
    const { data, error } = await supabaseClient
      .from('texts')
      .select('*')
      .order('display_order', { ascending: true });

    return { texts: data as Text[] | null, error };
  },

  async getTextById(id: string) {
    const { data, error } = await supabaseClient
      .from('texts')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    return { text: data as Text | null, error };
  },

  async getMaxDisplayOrder() {
    const { data, error } = await supabaseClient
      .from('texts')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    return { maxOrder: data?.display_order ?? -1, error };
  },

  async createText(text: {
    title: string;
    subtitle: string | null;
    content: string;
    excerpt: string | null;
    author: string | null;
    published_date: string | null;
    category_id?: string | null;
    is_published?: boolean;
    display_order: number;
  }) {
    console.log('[TEXT SERVICE] Create text - Starting');
    console.log('[TEXT SERVICE] Text data:', JSON.stringify(text, null, 2));

    try {
      // Récupérer l'utilisateur connecté
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

      if (authError) {
        console.error('[TEXT SERVICE] Auth error:', authError);
        return {
          text: null,
          error: {
            message: 'Erreur d\'authentification',
            code: 'AUTH_ERROR',
            details: authError
          } as any
        };
      }

      if (!user) {
        console.error('[TEXT SERVICE] No user found - user must be authenticated');
        return {
          text: null,
          error: {
            message: 'Vous devez être connecté pour ajouter un texte',
            code: 'NOT_AUTHENTICATED',
            hint: 'Connectez-vous depuis la page /login'
          } as any
        };
      }

      console.log('[TEXT SERVICE] User authenticated:', user.id);

      // Ajouter le user_id au text
      const textWithUser = {
        ...text,
        user_id: user.id
      };

      console.log('[TEXT SERVICE] Inserting text with user_id:', textWithUser);

      const { data, error } = await supabaseClient
        .from('texts')
        .insert(textWithUser)
        .select()
        .single();

      if (error) {
        console.error('[TEXT SERVICE] Insert text - ERROR:', error);
        console.error('[TEXT SERVICE] Error code:', error.code);
        console.error('[TEXT SERVICE] Error message:', error.message);
        console.error('[TEXT SERVICE] Error details:', JSON.stringify(error, null, 2));
        return { text: null, error };
      }

      console.log('[TEXT SERVICE] Insert text - SUCCESS:', data);
      return { text: data as Text | null, error: null };
    } catch (err) {
      console.error('[TEXT SERVICE] Unexpected error:', err);
      return {
        text: null,
        error: {
          message: err instanceof Error ? err.message : 'Unknown error',
          details: err
        } as any
      };
    }
  },

  async updateText(id: string, updates: Partial<Text>) {
    const { data, error } = await supabaseClient
      .from('texts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { text: data as Text | null, error };
  },

  async deleteText(id: string) {
    const { error } = await supabaseClient
      .from('texts')
      .delete()
      .eq('id', id);

    return { error };
  },

  async updateDisplayOrder(id: string, display_order: number) {
    const { error } = await supabaseClient
      .from('texts')
      .update({ display_order })
      .eq('id', id);

    return { error };
  },

  // Méthodes avec métadonnées (catégories et tags)
  async getTextsWithMetadata() {
    const { data, error } = await supabaseClient
      .from('texts')
      .select(`
        *,
        category:categories(*),
        text_tags(tag:tags(*))
      `)
      .order('display_order', { ascending: true });

    if (error) return { texts: null, error };

    // Transformer les données pour avoir un format cohérent
    const texts = data.map((text: any) => ({
      ...text,
      category: text.category || null,
      tags: text.text_tags?.map((tt: any) => tt.tag).filter(Boolean) || [],
    }));

    // Supprimer text_tags car on a déjà tags
    texts.forEach((text: any) => delete text.text_tags);

    return { texts: texts as TextWithMetadata[], error: null };
  },

  async getTextWithMetadata(id: string) {
    const { data, error } = await supabaseClient
      .from('texts')
      .select(`
        *,
        category:categories(*),
        text_tags(tag:tags(*))
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) return { text: null, error };
    if (!data) return { text: null, error: null };

    const text = {
      ...data,
      category: data.category || null,
      tags: data.text_tags?.map((tt: any) => tt.tag).filter(Boolean) || [],
    };

    delete (text as any).text_tags;

    return { text: text as TextWithMetadata, error: null };
  },

  async getPublishedTexts() {
    const { data, error } = await supabaseClient
      .from('texts')
      .select(`
        *,
        category:categories(*),
        text_tags(tag:tags(*))
      `)
      .eq('is_published', true)
      .order('display_order', { ascending: true });

    if (error) return { texts: null, error };

    const texts = data.map((text: any) => ({
      ...text,
      category: text.category || null,
      tags: text.text_tags?.map((tt: any) => tt.tag).filter(Boolean) || [],
    }));

    texts.forEach((text: any) => delete text.text_tags);

    return { texts: texts as TextWithMetadata[], error: null };
  },

  async getTextsByCategory(categoryId: string) {
    const { data, error } = await supabaseClient
      .from('texts')
      .select(`
        *,
        category:categories(*),
        text_tags(tag:tags(*))
      `)
      .eq('category_id', categoryId)
      .eq('is_published', true)
      .order('display_order', { ascending: true });

    if (error) return { texts: null, error };

    const texts = data.map((text: any) => ({
      ...text,
      category: text.category || null,
      tags: text.text_tags?.map((tt: any) => tt.tag).filter(Boolean) || [],
    }));

    texts.forEach((text: any) => delete text.text_tags);

    return { texts: texts as TextWithMetadata[], error: null };
  },

  async getTextsByTag(tagId: string) {
    const { data, error } = await supabaseClient
      .from('text_tags')
      .select(`
        text:texts(
          *,
          category:categories(*),
          text_tags(tag:tags(*))
        )
      `)
      .eq('tag_id', tagId);

    if (error) return { texts: null, error };

    const texts = data
      .map((item: any) => item.text)
      .filter((text: any) => text && text.is_published)
      .map((text: any) => ({
        ...text,
        category: text.category || null,
        tags: text.text_tags?.map((tt: any) => tt.tag).filter(Boolean) || [],
      }));

    texts.forEach((text: any) => delete text.text_tags);

    return { texts: texts as TextWithMetadata[], error: null };
  },

  async searchTexts(query: string) {
    const { data, error } = await supabaseClient
      .from('texts')
      .select(`
        *,
        category:categories(*),
        text_tags(tag:tags(*))
      `)
      .textSearch('title', query, {
        type: 'websearch',
        config: 'french',
      })
      .eq('is_published', true);

    if (error) return { texts: null, error };

    const texts = data.map((text: any) => ({
      ...text,
      category: text.category || null,
      tags: text.text_tags?.map((tt: any) => tt.tag).filter(Boolean) || [],
    }));

    texts.forEach((text: any) => delete text.text_tags);

    return { texts: texts as TextWithMetadata[], error: null };
  },

  // Méthode pour créer un texte avec ses tags
  async createTextWithTags(
    textData: {
      title: string;
      subtitle: string | null;
      content: string;
      excerpt: string | null;
      author: string | null;
      published_date: string | null;
      category_id?: string | null;
      is_published?: boolean;
      display_order: number;
    },
    tagIds: string[] = []
  ) {
    const { text, error } = await this.createText(textData);

    if (error || !text) {
      return { text: null, error };
    }

    // Ajouter les tags
    if (tagIds.length > 0) {
      const { error: tagsError } = await tagService.setTagsForText(text.id, tagIds);
      if (tagsError) {
        console.error('[TEXT SERVICE] Error setting tags:', tagsError);
      }
    }

    // Récupérer le texte avec métadonnées
    return await this.getTextWithMetadata(text.id);
  },

  // Méthode pour mettre à jour un texte avec ses tags
  async updateTextWithTags(
    id: string,
    updates: Partial<Text>,
    tagIds?: string[]
  ) {
    const { text, error } = await this.updateText(id, updates);

    if (error || !text) {
      return { text: null, error };
    }

    // Mettre à jour les tags si fournis
    if (tagIds !== undefined) {
      const { error: tagsError } = await tagService.setTagsForText(id, tagIds);
      if (tagsError) {
        console.error('[TEXT SERVICE] Error updating tags:', tagsError);
      }
    }

    // Récupérer le texte avec métadonnées
    return await this.getTextWithMetadata(id);
  },
};
