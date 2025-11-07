import { supabaseClient, Text } from '@/lib/supabaseClient';

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
};
