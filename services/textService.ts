import { supabaseClient, Text, TextWithMetadata, Category, Tag } from '@/lib/supabaseClient';
import { tagService } from './tagService';
import { cache } from '@/lib/cache';
import { createLogger } from '@/lib/logger';

const logger = createLogger('text-service');

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
    logger.debug('Create text - Starting', { title: text.title });

    try {
      // Récupérer l'utilisateur connecté
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

      if (authError) {
        logger.error('Auth error during text creation', authError);
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
        logger.warn('No user found - authentication required');
        return {
          text: null,
          error: {
            message: 'Vous devez être connecté pour ajouter un texte',
            code: 'NOT_AUTHENTICATED',
            hint: 'Connectez-vous depuis la page /login'
          } as any
        };
      }

      logger.debug('User authenticated', { userId: user.id });

      // Ajouter le user_id au text
      const textWithUser = {
        ...text,
        user_id: user.id
      };

      const { data, error } = await supabaseClient
        .from('texts')
        .insert(textWithUser)
        .select()
        .single();

      if (error) {
        logger.error('Insert text failed', error, {
          code: error.code,
          message: error.message,
        });
        return { text: null, error };
      }

      logger.info('Text created successfully', { textId: data.id, title: data.title });

      // Invalider le cache des textes
      cache.invalidatePattern('texts:');

      return { text: data as Text | null, error: null };
    } catch (err) {
      logger.error('Unexpected error during text creation', err as Error);
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

    if (!error) {
      // Invalider le cache des textes
      cache.invalidatePattern('texts:');
    }

    return { text: data as Text | null, error };
  },

  async deleteText(id: string) {
    const { error } = await supabaseClient
      .from('texts')
      .delete()
      .eq('id', id);

    if (!error) {
      // Invalider le cache des textes
      cache.invalidatePattern('texts:');
    }

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
    const CACHE_KEY = 'texts:all-with-metadata';
    const TTL = 5 * 60 * 1000; // 5 minutes

    // Vérifier le cache
    const cached = cache.get<{ texts: TextWithMetadata[]; error: null }>(CACHE_KEY);
    if (cached) {
      return cached;
    }

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

    const result = { texts: texts as TextWithMetadata[], error: null };

    // Mettre en cache
    cache.set(CACHE_KEY, result, { ttl: TTL, storage: 'session' });

    return result;
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
