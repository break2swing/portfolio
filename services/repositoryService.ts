import { supabaseClient, Repository, RepositoryFile, RepositoryWithFiles } from '@/lib/supabaseClient';
import { githubService, GitHubFile, GitHubFileContent, GitHubRepository } from './githubService';
import { storageService } from './storageService';
import { cache } from '@/lib/cache';
import { createLogger } from '@/lib/logger';

const logger = createLogger('repository-service');

export const repositoryService = {
  /**
   * Récupère tous les dépôts
   */
  async getAllRepositories(): Promise<{ repositories: Repository[] | null; error: Error | null }> {
    const cacheKey = 'repositories:all';

    // Vérifier le cache
    const cached = cache.get<Repository[]>(cacheKey);
    if (cached) {
      logger.debug('Repositories loaded from cache');
      return { repositories: cached, error: null };
    }

    try {
      logger.info('Fetching repositories from database');

      const { data, error } = await supabaseClient
        .from('repositories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        logger.error('Failed to fetch repositories', error);
        return { repositories: null, error };
      }

      // Mettre en cache
      cache.set(cacheKey, data, { ttl: 5 * 60 * 1000 });
      logger.debug('Repositories cached', { count: data.length });

      return { repositories: data as Repository[], error: null };
    } catch (error) {
      logger.error('Unexpected error fetching repositories', error as Error);
      return { repositories: null, error: error as Error };
    }
  },

  /**
   * Récupère un dépôt par son ID
   */
  async getRepositoryById(id: string): Promise<{ repository: Repository | null; error: Error | null }> {
    const cacheKey = `repositories:${id}`;

    // Vérifier le cache
    const cached = cache.get<Repository>(cacheKey);
    if (cached) {
      logger.debug('Repository loaded from cache', { id });
      return { repository: cached, error: null };
    }

    try {
      logger.info('Fetching repository', { id });

      const { data, error } = await supabaseClient
        .from('repositories')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        logger.error('Failed to fetch repository', error, { id });
        return { repository: null, error };
      }

      if (data) {
        cache.set(cacheKey, data, { ttl: 5 * 60 * 1000 });
      }

      return { repository: data as Repository | null, error: null };
    } catch (error) {
      logger.error('Unexpected error fetching repository', error as Error, { id });
      return { repository: null, error: error as Error };
    }
  },

  /**
   * Crée un nouveau dépôt
   */
  async createRepository(repository: {
    name: string;
    description?: string | null;
    source_type: 'local' | 'github';
    github_owner?: string | null;
    github_repo?: string | null;
    github_branch?: string | null;
    storage_path?: string | null;
    language?: string | null;
    is_public?: boolean;
    display_order?: number;
    github_stars?: number | null;
    github_forks?: number | null;
    github_watchers?: number | null;
    github_open_issues?: number | null;
  }): Promise<{ repository: Repository | null; error: Error | null }> {
    logger.debug('Creating repository', { name: repository.name });

    try {
      // Récupérer l'utilisateur connecté
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

      if (authError || !user) {
        logger.warn('No user found - authentication required');
        return {
          repository: null,
          error: {
            message: 'Vous devez être connecté pour créer un dépôt',
            code: 'NOT_AUTHENTICATED',
            hint: 'Connectez-vous depuis la page /login'
          } as any
        };
      }

      const { data, error } = await supabaseClient
        .from('repositories')
        .insert({
          ...repository,
          user_id: user.id,
          display_order: repository.display_order ?? 0,
          is_public: repository.is_public ?? true,
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create repository', error);
        return { repository: null, error };
      }

      // Invalider le cache
      cache.invalidatePattern('repositories:');
      logger.debug('Cache invalidated');

      return { repository: data as Repository, error: null };
    } catch (error) {
      logger.error('Unexpected error creating repository', error as Error);
      return { repository: null, error: error as Error };
    }
  },

  /**
   * Met à jour un dépôt
   */
  async updateRepository(
    id: string,
    updates: Partial<Omit<Repository, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<{ repository: Repository | null; error: Error | null }> {
    logger.info('Updating repository', { id });

    try {
      const { data, error } = await supabaseClient
        .from('repositories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update repository', error, { id });
        return { repository: null, error };
      }

      // Invalider le cache
      cache.invalidatePattern('repositories:');

      return { repository: data as Repository, error: null };
    } catch (error) {
      logger.error('Unexpected error updating repository', error as Error, { id });
      return { repository: null, error: error as Error };
    }
  },

  /**
   * Supprime un dépôt
   */
  async deleteRepository(id: string): Promise<{ error: Error | null }> {
    logger.info('Deleting repository', { id });

    try {
      const { error } = await supabaseClient
        .from('repositories')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error('Failed to delete repository', error, { id });
        return { error };
      }

      // Invalider le cache
      cache.invalidatePattern('repositories:');

      return { error: null };
    } catch (error) {
      logger.error('Unexpected error deleting repository', error as Error, { id });
      return { error: error as Error };
    }
  },

  /**
   * Récupère les fichiers d'un dépôt
   */
  async getRepositoryFiles(
    repositoryId: string,
    path: string = ''
  ): Promise<{ files: (RepositoryFile | GitHubFile)[] | null; error: Error | null }> {
    try {
      logger.debug('Fetching repository files', { repositoryId, path });

      // Récupérer le dépôt pour connaître son type
      const { repository, error: repoError } = await this.getRepositoryById(repositoryId);

      if (repoError || !repository) {
        return { files: null, error: repoError || new Error('Repository not found') };
      }

      if (repository.source_type === 'github') {
        // Utiliser GitHub API
        if (!repository.github_owner || !repository.github_repo) {
          return { files: null, error: new Error('GitHub repository information missing') };
        }

        const { files, error } = await githubService.getFileTree(
          repository.github_owner,
          repository.github_repo,
          repository.github_branch || 'main',
          path
        );

        return { files, error };
      } else {
        // Dépôt local - utiliser Supabase Storage ou table repository_files
        if (repository.storage_path) {
          // Utiliser Storage
          const { files, error } = await storageService.listRepositoryFiles('repository-files', path || repository.storage_path);
          return { files, error };
        } else {
          // Utiliser la table repository_files
          const { data, error } = await supabaseClient
            .from('repository_files')
            .select('*')
            .eq('repository_id', repositoryId)
            .eq('is_directory', false)
            .like('path', `${path}%`)
            .order('path', { ascending: true });

          if (error) {
            logger.error('Failed to fetch repository files', error, { repositoryId, path });
            return { files: null, error };
          }

          return { files: data as RepositoryFile[], error: null };
        }
      }
    } catch (error) {
      logger.error('Unexpected error fetching repository files', error as Error, { repositoryId, path });
      return { files: null, error: error as Error };
    }
  },

  /**
   * Récupère le contenu d'un fichier
   */
  async getFileContent(
    repositoryId: string,
    filePath: string
  ): Promise<{ content: string | null; error: Error | null }> {
    try {
      logger.debug('Fetching file content', { repositoryId, filePath });

      // Récupérer le dépôt pour connaître son type
      const { repository, error: repoError } = await this.getRepositoryById(repositoryId);

      if (repoError || !repository) {
        return { content: null, error: repoError || new Error('Repository not found') };
      }

      if (repository.source_type === 'github') {
        // Utiliser GitHub API
        if (!repository.github_owner || !repository.github_repo) {
          return { content: null, error: new Error('GitHub repository information missing') };
        }

        const { content: fileContent, error } = await githubService.getFileContent(
          repository.github_owner,
          repository.github_repo,
          repository.github_branch || 'main',
          filePath
        );

        if (error || !fileContent) {
          return { content: null, error: error || new Error('File not found') };
        }

        return { content: fileContent.content, error: null };
      } else {
        // Dépôt local
        if (repository.storage_path) {
          // Utiliser Storage
          const { content, error } = await storageService.getRepositoryFile('repository-files', filePath);
          return { content, error };
        } else {
          // Utiliser la table repository_files
          const { data, error } = await supabaseClient
            .from('repository_files')
            .select('content')
            .eq('repository_id', repositoryId)
            .eq('path', filePath)
            .eq('is_directory', false)
            .maybeSingle();

          if (error) {
            logger.error('Failed to fetch file content', error, { repositoryId, filePath });
            return { content: null, error };
          }

          return { content: data?.content || null, error: null };
        }
      }
    } catch (error) {
      logger.error('Unexpected error fetching file content', error as Error, { repositoryId, filePath });
      return { content: null, error: error as Error };
    }
  },

  /**
   * Vérifie et récupère les métadonnées d'un dépôt GitHub
   */
  async verifyGitHubRepository(
    owner: string,
    repo: string
  ): Promise<{ repository: GitHubRepository | null; error: Error | null }> {
    try {
      logger.debug('Verifying GitHub repository', { owner, repo });

      const { repository, error } = await githubService.getRepository(owner, repo);

      if (error) {
        logger.error('Failed to verify GitHub repository', error, { owner, repo });
        return { repository: null, error };
      }

      return { repository, error: null };
    } catch (error) {
      logger.error('Unexpected error verifying GitHub repository', error as Error, { owner, repo });
      return { repository: null, error: error as Error };
    }
  },

  /**
   * Upload une base de code locale et crée le dépôt
   */
  async uploadLocalRepository(
    name: string,
    description: string | null,
    files: File[],
    storagePath: string
  ): Promise<{ repository: Repository | null; error: Error | null }> {
    logger.info('Uploading local repository', { name, fileCount: files.length });

    try {
      // Récupérer l'utilisateur connecté
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

      if (authError || !user) {
        logger.warn('No user found - authentication required');
        return {
          repository: null,
          error: {
            message: 'Vous devez être connecté pour créer un dépôt',
            code: 'NOT_AUTHENTICATED',
            hint: 'Connectez-vous depuis la page /login'
          } as any
        };
      }

      // Upload des fichiers vers Storage
      const uploadResults = await storageService.uploadRepositoryFiles('repository-files', files, storagePath);

      if (uploadResults.error) {
        logger.error('Failed to upload repository files', uploadResults.error);
        return { repository: null, error: uploadResults.error };
      }

      // Créer le dépôt dans la base de données
      const { data, error } = await supabaseClient
        .from('repositories')
        .insert({
          name,
          description,
          source_type: 'local',
          storage_path: storagePath,
          user_id: user.id,
          is_public: true,
          display_order: 0,
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create repository', error);
        return { repository: null, error };
      }

      // Invalider le cache
      cache.invalidatePattern('repositories:');
      logger.debug('Cache invalidated');

      return { repository: data as Repository, error: null };
    } catch (error) {
      logger.error('Unexpected error uploading local repository', error as Error);
      return { repository: null, error: error as Error };
    }
  },

  /**
   * Met à jour l'ordre d'affichage de plusieurs dépôts
   */
  async updateRepositoryOrder(
    repositories: { id: string; display_order: number }[]
  ): Promise<{ error: Error | null }> {
    logger.info('Updating repository order', { count: repositories.length });

    try {
      // Mettre à jour chaque dépôt
      const updates = repositories.map(({ id, display_order }) =>
        supabaseClient
          .from('repositories')
          .update({ display_order })
          .eq('id', id)
      );

      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error);

      if (errors.length > 0) {
        logger.error('Some repository order updates failed', errors[0].error);
        return { error: errors[0].error };
      }

      // Invalider le cache
      cache.invalidatePattern('repositories:');

      return { error: null };
    } catch (error) {
      logger.error('Unexpected error updating repository order', error as Error);
      return { error: error as Error };
    }
  },
};

