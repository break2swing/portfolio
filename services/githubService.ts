import { createLogger } from '@/lib/logger';

const logger = createLogger('github-service');

export interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size?: number;
  sha?: string;
  url?: string;
}

export interface GitHubFileContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  content: string;
  encoding: 'base64' | 'utf-8';
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  default_branch: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
}

const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Service pour interagir avec l'API GitHub
 */
export const githubService = {
  /**
   * Récupère les métadonnées d'un dépôt GitHub
   */
  async getRepository(owner: string, repo: string): Promise<{ repository: GitHubRepository | null; error: Error | null }> {
    try {
      logger.debug('Fetching GitHub repository', { owner, repo });

      const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
      const headers: HeadersInit = {
        Accept: 'application/vnd.github.v3+json',
      };

      if (token) {
        headers.Authorization = `token ${token}`;
      }

      const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, {
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Failed to fetch GitHub repository', new Error(errorText), { owner, repo, status: response.status });
        return { repository: null, error: new Error(`GitHub API error: ${response.status} ${errorText}`) };
      }

      const repository = await response.json();
      logger.debug('GitHub repository fetched successfully', { name: repository.name });

      return { repository, error: null };
    } catch (error) {
      logger.error('Unexpected error fetching GitHub repository', error as Error, { owner, repo });
      return { repository: null, error: error as Error };
    }
  },

  /**
   * Récupère l'arbre de fichiers d'un dépôt GitHub
   */
  async getFileTree(
    owner: string,
    repo: string,
    branch: string = 'main',
    path: string = ''
  ): Promise<{ files: GitHubFile[]; error: Error | null }> {
    try {
      logger.debug('Fetching GitHub file tree', { owner, repo, branch, path });

      const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
      const headers: HeadersInit = {
        Accept: 'application/vnd.github.v3+json',
      };

      if (token) {
        headers.Authorization = `token ${token}`;
      }

      // Construire l'URL selon si on veut le contenu d'un dossier spécifique ou la racine
      const url = path
        ? `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
        : `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents?ref=${branch}`;

      const response = await fetch(url, { headers });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Failed to fetch GitHub file tree', new Error(errorText), { owner, repo, branch, path, status: response.status });
        return { files: [], error: new Error(`GitHub API error: ${response.status} ${errorText}`) };
      }

      const data = await response.json();
      
      // L'API GitHub retourne un tableau pour les dossiers, un objet pour un fichier unique
      const items = Array.isArray(data) ? data : [data];
      
      const files: GitHubFile[] = items.map((item: any) => ({
        name: item.name,
        path: item.path,
        type: item.type === 'dir' ? 'dir' : 'file',
        size: item.size,
        sha: item.sha,
        url: item.html_url,
      }));

      logger.debug('GitHub file tree fetched successfully', { count: files.length });

      return { files, error: null };
    } catch (error) {
      logger.error('Unexpected error fetching GitHub file tree', error as Error, { owner, repo, branch, path });
      return { files: [], error: error as Error };
    }
  },

  /**
   * Récupère le contenu d'un fichier GitHub
   */
  async getFileContent(
    owner: string,
    repo: string,
    branch: string = 'main',
    path: string
  ): Promise<{ content: GitHubFileContent | null; error: Error | null }> {
    try {
      logger.debug('Fetching GitHub file content', { owner, repo, branch, path });

      const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
      const headers: HeadersInit = {
        Accept: 'application/vnd.github.v3+json',
      };

      if (token) {
        headers.Authorization = `token ${token}`;
      }

      const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, {
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Failed to fetch GitHub file content', new Error(errorText), { owner, repo, branch, path, status: response.status });
        return { content: null, error: new Error(`GitHub API error: ${response.status} ${errorText}`) };
      }

      const data = await response.json();

      // Décoder le contenu base64 si nécessaire
      let content = '';
      if (data.encoding === 'base64' && data.content) {
        try {
          content = atob(data.content.replace(/\s/g, ''));
        } catch (e) {
          logger.error('Failed to decode base64 content', e as Error, { path });
          return { content: null, error: new Error('Failed to decode file content') };
        }
      } else if (data.content) {
        content = data.content;
      }

      const fileContent: GitHubFileContent = {
        name: data.name,
        path: data.path,
        sha: data.sha,
        size: data.size,
        url: data.html_url,
        content,
        encoding: data.encoding || 'utf-8',
      };

      logger.debug('GitHub file content fetched successfully', { path, size: fileContent.size });

      return { content: fileContent, error: null };
    } catch (error) {
      logger.error('Unexpected error fetching GitHub file content', error as Error, { owner, repo, branch, path });
      return { content: null, error: error as Error };
    }
  },

  /**
   * Récupère le README d'un dépôt GitHub
   */
  async getReadme(
    owner: string,
    repo: string,
    branch: string = 'main'
  ): Promise<{ readme: string | null; error: Error | null }> {
    try {
      logger.debug('Fetching GitHub README', { owner, repo, branch });

      // Essayer différents noms de README courants
      const readmeNames = ['README.md', 'readme.md', 'README.MD', 'Readme.md'];

      for (const readmeName of readmeNames) {
        const { content, error } = await this.getFileContent(owner, repo, branch, readmeName);
        
        if (!error && content) {
          logger.debug('GitHub README found', { readmeName });
          return { readme: content.content, error: null };
        }
      }

      logger.warn('No README found in repository', { owner, repo, branch });
      return { readme: null, error: new Error('README not found') };
    } catch (error) {
      logger.error('Unexpected error fetching GitHub README', error as Error, { owner, repo, branch });
      return { readme: null, error: error as Error };
    }
  },
};

