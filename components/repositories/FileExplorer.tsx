'use client';

import { useState, useEffect } from 'react';
import { Folder, File, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { repositoryService } from '@/services/repositoryService';
import { GitHubFile } from '@/services/githubService';
import { RepositoryFile } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';

interface FileExplorerProps {
  repositoryId: string;
  onFileSelect?: (path: string) => void;
  className?: string;
}

type FileItem = (GitHubFile | RepositoryFile) & {
  name: string;
  path: string;
  type: 'file' | 'dir';
};

/**
 * Explorateur de fichiers style GitHub
 */
export function FileExplorer({ repositoryId, onFileSelect, className }: FileExplorerProps) {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['']));

  useEffect(() => {
    loadFiles('');
  }, [repositoryId]);

  const loadFiles = async (path: string) => {
    setLoading(true);
    setError(null);

    try {
      const { files: fetchedFiles, error: fetchError } = await repositoryService.getRepositoryFiles(
        repositoryId,
        path
      );

      if (fetchError) {
        setError(fetchError);
        setFiles([]);
        return;
      }

      // Normaliser les fichiers pour avoir un format uniforme
      const normalizedFiles: FileItem[] = (fetchedFiles || []).map((file: any) => ({
        name: file.name,
        path: file.path,
        type: file.is_directory ? 'dir' : 'file',
        size: file.size,
        ...file,
      }));

      // Trier : dossiers d'abord, puis fichiers
      normalizedFiles.sort((a, b) => {
        if (a.type === 'dir' && b.type !== 'dir') return -1;
        if (a.type !== 'dir' && b.type === 'dir') return 1;
        return a.name.localeCompare(b.name);
      });

      setFiles(normalizedFiles);
    } catch (err) {
      setError(err as Error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePathClick = (path: string) => {
    setCurrentPath(path);
    loadFiles(path);
  };

  const handleFileClick = (file: FileItem) => {
    if (file.type === 'dir') {
      // Toggle expansion
      const newExpanded = new Set(expandedPaths);
      if (newExpanded.has(file.path)) {
        newExpanded.delete(file.path);
      } else {
        newExpanded.add(file.path);
        loadFiles(file.path);
      }
      setExpandedPaths(newExpanded);
    } else {
      onFileSelect?.(file.path);
    }
  };

  const getBreadcrumbs = () => {
    if (!currentPath) return [];
    return currentPath.split('/').filter(Boolean);
  };

  const formatFileSize = (bytes: number | null | undefined): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (file: FileItem) => {
    if (file.type === 'dir') {
      return <Folder className="h-4 w-4 text-blue-500" />;
    }
    return <File className="h-4 w-4 text-muted-foreground" />;
  };

  if (loading && files.length === 0) {
    return (
      <div className={cn('rounded-lg border bg-card', className)}>
        <div className="p-4 space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('rounded-lg border border-destructive bg-destructive/10 p-4', className)}>
        <p className="text-sm text-destructive">Erreur lors du chargement des fichiers: {error.message}</p>
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border bg-card', className)}>
      {/* Breadcrumb */}
      {currentPath && (
        <div className="flex items-center gap-1 border-b bg-muted/30 px-4 py-2 text-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePathClick('')}
            className="h-6 px-2 text-xs"
          >
            Root
          </Button>
          {getBreadcrumbs().map((segment, index) => {
            const path = getBreadcrumbs()
              .slice(0, index + 1)
              .join('/');
            return (
              <div key={path} className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePathClick(path)}
                  className="h-6 px-2 text-xs"
                >
                  {segment}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* File list */}
      <div className="divide-y">
        {files.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Ce dossier est vide
          </div>
        ) : (
          files.map((file) => (
            <button
              key={file.path}
              onClick={() => handleFileClick(file)}
              className={cn(
                'flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-muted/50 transition-colors',
                file.type === 'file' && 'cursor-pointer'
              )}
            >
              {getFileIcon(file)}
              <span className="flex-1 font-mono text-sm">{file.name}</span>
              {file.type === 'file' && file.size && (
                <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
              )}
              {file.type === 'dir' && expandedPaths.has(file.path) && (
                <ChevronRight className="h-4 w-4 text-muted-foreground rotate-90" />
              )}
            </button>
          ))
        )}
      </div>

      {loading && files.length > 0 && (
        <div className="flex items-center justify-center border-t bg-muted/30 p-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

