import { supabaseClient, Gist, GistFile, GistWithFiles } from '@/lib/supabaseClient';
import { cache } from '@/lib/cache';
import { createLogger } from '@/lib/logger';

const logger = createLogger('gist-service');

export const gistService = {
  /**
   * Récupère tous les Gists publics (ou tous si admin)
   */
  async getAllGists(): Promise<{ gists: Gist[] | null; error: Error | null }> {
    const cacheKey = 'gists:all';

    // Vérifier le cache
    const cached = cache.get<Gist[]>(cacheKey);
    if (cached) {
      logger.debug('Gists loaded from cache');
      return { gists: cached, error: null };
    }

    try {
      logger.info('Fetching gists from database');

      const { data, error } = await supabaseClient
        .from('gists')
        .select('*')
        .eq('is_public', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch gists', error);
        return { gists: null, error };
      }

      // Mettre en cache
      cache.set(cacheKey, data, { ttl: 5 * 60 * 1000 });
      logger.debug('Gists cached', { count: data.length });

      return { gists: data as Gist[], error: null };
    } catch (error) {
      logger.error('Unexpected error fetching gists', error as Error);
      return { gists: null, error: error as Error };
    }
  },

  /**
   * Récupère tous les Gists (pour admin)
   */
  async getAllGistsAdmin(): Promise<{ gists: Gist[] | null; error: Error | null }> {
    const cacheKey = 'gists:all:admin';

    try {
      logger.info('Fetching all gists (admin)');

      const { data, error } = await supabaseClient
        .from('gists')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch gists (admin)', error);
        return { gists: null, error };
      }

      return { gists: data as Gist[], error: null };
    } catch (error) {
      logger.error('Unexpected error fetching gists (admin)', error as Error);
      return { gists: null, error: error as Error };
    }
  },

  /**
   * Récupère un Gist par son ID avec ses fichiers
   */
  async getGistById(id: string): Promise<{ gist: GistWithFiles | null; error: Error | null }> {
    const cacheKey = `gists:${id}`;

    // Vérifier le cache
    const cached = cache.get<GistWithFiles>(cacheKey);
    if (cached) {
      logger.debug('Gist loaded from cache', { id });
      return { gist: cached, error: null };
    }

    try {
      logger.info('Fetching gist', { id });

      // Récupérer le Gist
      const { data: gistData, error: gistError } = await supabaseClient
        .from('gists')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (gistError) {
        logger.error('Failed to fetch gist', gistError, { id });
        return { gist: null, error: gistError };
      }

      if (!gistData) {
        return { gist: null, error: new Error('Gist not found') };
      }

      // Récupérer les fichiers du Gist
      const { data: filesData, error: filesError } = await supabaseClient
        .from('gist_files')
        .select('*')
        .eq('gist_id', id)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (filesError) {
        logger.error('Failed to fetch gist files', filesError, { id });
        return { gist: null, error: filesError };
      }

      const gist: GistWithFiles = {
        ...(gistData as Gist),
        files: (filesData || []) as GistFile[],
      };

      // Mettre en cache
      cache.set(cacheKey, gist, { ttl: 5 * 60 * 1000 });

      return { gist, error: null };
    } catch (error) {
      logger.error('Unexpected error fetching gist', error as Error, { id });
      return { gist: null, error: error as Error };
    }
  },

  /**
   * Crée un nouveau Gist avec ses fichiers
   */
  async createGist(data: {
    title?: string | null;
    description?: string | null;
    is_public?: boolean;
    files: Array<{
      filename: string;
      content: string;
      language?: string | null;
      display_order?: number;
    }>;
    display_order?: number;
  }): Promise<{ gist: Gist | null; error: Error | null }> {
    logger.debug('Creating gist', { title: data.title, fileCount: data.files.length });

    try {
      // Récupérer l'utilisateur connecté
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

      if (authError || !user) {
        logger.warn('No user found - authentication required');
        return {
          gist: null,
          error: {
            message: 'Vous devez être connecté pour créer un Gist',
            code: 'NOT_AUTHENTICATED',
            hint: 'Connectez-vous depuis la page /login'
          } as any
        };
      }

      // Valider qu'il y a au moins un fichier
      if (!data.files || data.files.length === 0) {
        return {
          gist: null,
          error: new Error('Au moins un fichier est requis pour créer un Gist')
        };
      }

      // Créer le Gist
      const { data: gistData, error: gistError } = await supabaseClient
        .from('gists')
        .insert({
          title: data.title || null,
          description: data.description || null,
          is_public: data.is_public ?? true,
          user_id: user.id,
          display_order: data.display_order ?? 0,
        })
        .select()
        .single();

      if (gistError) {
        logger.error('Failed to create gist', gistError);
        return { gist: null, error: gistError };
      }

      // Créer les fichiers
      const filesToInsert = data.files.map((file, index) => ({
        gist_id: gistData.id,
        filename: file.filename,
        content: file.content,
        language: file.language || null,
        display_order: file.display_order ?? index,
      }));

      const { error: filesError } = await supabaseClient
        .from('gist_files')
        .insert(filesToInsert);

      if (filesError) {
        logger.error('Failed to create gist files', filesError);
        // Nettoyer le Gist créé en cas d'erreur
        await supabaseClient.from('gists').delete().eq('id', gistData.id);
        return { gist: null, error: filesError };
      }

      // Invalider le cache
      cache.invalidatePattern('gists:');
      logger.debug('Cache invalidated');

      return { gist: gistData as Gist, error: null };
    } catch (error) {
      logger.error('Unexpected error creating gist', error as Error);
      return { gist: null, error: error as Error };
    }
  },

  /**
   * Met à jour un Gist
   */
  async updateGist(
    id: string,
    updates: Partial<Omit<Gist, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<{ gist: Gist | null; error: Error | null }> {
    logger.info('Updating gist', { id });

    try {
      const { data, error } = await supabaseClient
        .from('gists')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update gist', error, { id });
        return { gist: null, error };
      }

      // Invalider le cache
      cache.invalidatePattern('gists:');

      return { gist: data as Gist, error: null };
    } catch (error) {
      logger.error('Unexpected error updating gist', error as Error, { id });
      return { gist: null, error: error as Error };
    }
  },

  /**
   * Met à jour les fichiers d'un Gist
   */
  async updateGistFiles(
    gistId: string,
    files: Array<{
      id?: string;
      filename: string;
      content: string;
      language?: string | null;
      display_order?: number;
    }>
  ): Promise<{ error: Error | null }> {
    logger.info('Updating gist files', { gistId, fileCount: files.length });

    try {
      // Supprimer tous les fichiers existants
      const { error: deleteError } = await supabaseClient
        .from('gist_files')
        .delete()
        .eq('gist_id', gistId);

      if (deleteError) {
        logger.error('Failed to delete existing gist files', deleteError);
        return { error: deleteError };
      }

      // Insérer les nouveaux fichiers
      const filesToInsert = files.map((file, index) => ({
        gist_id: gistId,
        filename: file.filename,
        content: file.content,
        language: file.language || null,
        display_order: file.display_order ?? index,
      }));

      const { error: insertError } = await supabaseClient
        .from('gist_files')
        .insert(filesToInsert);

      if (insertError) {
        logger.error('Failed to insert gist files', insertError);
        return { error: insertError };
      }

      // Invalider le cache
      cache.invalidatePattern('gists:');

      return { error: null };
    } catch (error) {
      logger.error('Unexpected error updating gist files', error as Error, { gistId });
      return { error: error as Error };
    }
  },

  /**
   * Supprime un Gist
   */
  async deleteGist(id: string): Promise<{ error: Error | null }> {
    logger.info('Deleting gist', { id });

    try {
      // Les fichiers seront supprimés automatiquement grâce à ON DELETE CASCADE
      const { error } = await supabaseClient
        .from('gists')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error('Failed to delete gist', error, { id });
        return { error };
      }

      // Invalider le cache
      cache.invalidatePattern('gists:');

      return { error: null };
    } catch (error) {
      logger.error('Unexpected error deleting gist', error as Error, { id });
      return { error: error as Error };
    }
  },

  /**
   * Met à jour l'ordre d'affichage des Gists
   */
  async updateGistOrder(
    updates: Array<{ id: string; display_order: number }>
  ): Promise<{ error: Error | null }> {
    logger.info('Updating gist order', { count: updates.length });

    try {
      // Mettre à jour chaque Gist individuellement
      const updatePromises = updates.map(({ id, display_order }) =>
        supabaseClient
          .from('gists')
          .update({ display_order })
          .eq('id', id)
      );

      const results = await Promise.all(updatePromises);
      const errors = results.filter(r => r.error);

      if (errors.length > 0) {
        const error = errors[0].error;
        logger.error('Failed to update gist order', error);
        return { error };
      }

      // Invalider le cache
      cache.invalidatePattern('gists:');

      return { error: null };
    } catch (error) {
      logger.error('Unexpected error updating gist order', error as Error);
      return { error: error as Error };
    }
  },
};

