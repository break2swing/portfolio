import { supabaseClient, Category } from '@/lib/supabaseClient';
import { cache } from '@/lib/cache';

export const categoryService = {
  async getAllCategories() {
    const CACHE_KEY = 'categories:all';
    const TTL = 10 * 60 * 1000; // 10 minutes

    // Vérifier le cache
    const cached = cache.get<{ categories: Category[]; error: null }>(CACHE_KEY);
    if (cached) {
      return cached;
    }

    const { data, error } = await supabaseClient
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) return { categories: null, error };

    const result = { categories: data as Category[], error: null };

    // Mettre en cache
    cache.set(CACHE_KEY, result, { ttl: TTL, storage: 'session' });

    return result;
  },

  async getCategoryById(id: string) {
    const { data, error } = await supabaseClient
      .from('categories')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    return { category: data as Category | null, error };
  },

  async getCategoryBySlug(slug: string) {
    const { data, error } = await supabaseClient
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    return { category: data as Category | null, error };
  },

  async createCategory(category: {
    name: string;
    slug?: string;
    description?: string | null;
    color?: string;
    display_order: number;
  }) {
    const { data, error } = await supabaseClient
      .from('categories')
      .insert(category)
      .select()
      .single();

    if (!error) {
      // Invalider le cache des catégories et des textes (qui dépendent des catégories)
      cache.invalidatePattern('categories:');
      cache.invalidatePattern('texts:');
    }

    return { category: data as Category | null, error };
  },

  async updateCategory(id: string, updates: Partial<Category>) {
    const { data, error } = await supabaseClient
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (!error) {
      // Invalider le cache des catégories et des textes
      cache.invalidatePattern('categories:');
      cache.invalidatePattern('texts:');
    }

    return { category: data as Category | null, error };
  },

  async deleteCategory(id: string) {
    const { error } = await supabaseClient
      .from('categories')
      .delete()
      .eq('id', id);

    if (!error) {
      // Invalider le cache des catégories et des textes
      cache.invalidatePattern('categories:');
      cache.invalidatePattern('texts:');
    }

    return { error };
  },

  async getMaxDisplayOrder() {
    const { data, error } = await supabaseClient
      .from('categories')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    return { maxOrder: data?.display_order ?? -1, error };
  },
};
