import { supabaseClient, Category } from '@/lib/supabaseClient';

export const categoryService = {
  async getAllCategories() {
    const { data, error } = await supabaseClient
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    return { categories: data as Category[] | null, error };
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

    return { category: data as Category | null, error };
  },

  async updateCategory(id: string, updates: Partial<Category>) {
    const { data, error } = await supabaseClient
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { category: data as Category | null, error };
  },

  async deleteCategory(id: string) {
    const { error } = await supabaseClient
      .from('categories')
      .delete()
      .eq('id', id);

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
