'use client';

import { useState, useEffect } from 'react';
import { Repository } from '@/lib/supabaseClient';
import { repositoryService } from '@/services/repositoryService';
import { githubService } from '@/services/githubService';
import { FileExplorer } from './FileExplorer';
import { CodeViewer } from './CodeViewer';
import { MarkdownViewer } from './MarkdownViewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, FileText, Code, Folder } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface RepositoryDetailProps {
  repositoryId: string;
  className?: string;
}

/**
 * Page de détail d'un dépôt avec explorateur de fichiers et visualisation de code
 */
export function RepositoryDetail({ repositoryId, className }: RepositoryDetailProps) {
  const [repository, setRepository] = useState<Repository | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [readme, setReadme] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingFile, setLoadingFile] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadRepository();
  }, [repositoryId]);

  useEffect(() => {
    if (repository && repository.source_type === 'github') {
      loadReadme();
    }
  }, [repository]);

  const loadRepository = async () => {
    setLoading(true);
    setError(null);

    try {
      const { repository: repo, error: repoError } = await repositoryService.getRepositoryById(repositoryId);

      if (repoError) {
        setError(repoError);
        return;
      }

      setRepository(repo);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const loadReadme = async () => {
    if (!repository || repository.source_type !== 'github' || !repository.github_owner || !repository.github_repo) {
      return;
    }

    try {
      const { readme: readmeContent, error: readmeError } = await githubService.getReadme(
        repository.github_owner,
        repository.github_repo,
        repository.github_branch || 'main'
      );

      if (!readmeError && readmeContent) {
        setReadme(readmeContent);
      }
    } catch (err) {
      console.error('Error loading README:', err);
    }
  };

  const handleFileSelect = async (filePath: string) => {
    setSelectedFile(filePath);
    setLoadingFile(true);
    setFileContent(null);

    try {
      const { content, error: contentError } = await repositoryService.getFileContent(repositoryId, filePath);

      if (contentError) {
        setError(contentError);
        return;
      }

      setFileContent(content);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoadingFile(false);
    }
  };

  const getFileLanguage = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const languageMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      java: 'java',
      c: 'c',
      cpp: 'cpp',
      cs: 'csharp',
      php: 'php',
      rb: 'ruby',
      go: 'go',
      rs: 'rust',
      swift: 'swift',
      kt: 'kotlin',
      html: 'html',
      css: 'css',
      scss: 'scss',
      json: 'json',
      xml: 'xml',
      sql: 'sql',
      md: 'markdown',
      sh: 'bash',
      yml: 'yaml',
      yaml: 'yaml',
    };
    return languageMap[ext] || 'text';
  };

  const isMarkdownFile = (filename: string): boolean => {
    return filename.toLowerCase().endsWith('.md') || filename.toLowerCase().endsWith('.markdown');
  };

  if (loading) {
    return (
      <div className={className}>
        <Skeleton className="h-32 w-full mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !repository) {
    return (
      <div className={className}>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            {error?.message || 'Dépôt non trouvé'}
          </p>
        </div>
      </div>
    );
  }

  const githubUrl = repository.source_type === 'github' && repository.github_owner && repository.github_repo
    ? `https://github.com/${repository.github_owner}/${repository.github_repo}`
    : null;

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{repository.name}</h1>
            {repository.description && (
              <p className="text-muted-foreground">{repository.description}</p>
            )}
          </div>
          {githubUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={githubUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Voir sur GitHub
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="files" className="space-y-4">
        <TabsList>
          <TabsTrigger value="files">
            <Folder className="h-4 w-4 mr-2" />
            Fichiers
          </TabsTrigger>
          {readme && (
            <TabsTrigger value="readme">
              <FileText className="h-4 w-4 mr-2" />
              README
            </TabsTrigger>
          )}
          {selectedFile && (
            <TabsTrigger value="code">
              <Code className="h-4 w-4 mr-2" />
              {selectedFile.split('/').pop()}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="files" className="space-y-4">
          <FileExplorer
            repositoryId={repositoryId}
            onFileSelect={handleFileSelect}
          />
        </TabsContent>

        {readme && (
          <TabsContent value="readme">
            <div className="rounded-lg border bg-card p-6">
              <MarkdownViewer content={readme} />
            </div>
          </TabsContent>
        )}

        {selectedFile && (
          <TabsContent value="code">
            {loadingFile ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : fileContent ? (
              <CodeViewer
                code={fileContent}
                language={isMarkdownFile(selectedFile) ? 'markdown' : getFileLanguage(selectedFile)}
                filename={selectedFile.split('/').pop() || undefined}
                showLineNumbers={true}
              />
            ) : (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
                <p className="text-sm text-destructive">Impossible de charger le fichier</p>
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

