'use client';

import { Repository } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, GitFork, Eye, AlertCircle, Github, Folder } from 'lucide-react';
import Link from 'next/link';
import { formatNumber } from '@/lib/formatNumber';

interface RepositoryCardProps {
  repository: Repository;
  className?: string;
}

/**
 * Carte de dépôt style GitHub
 */
export function RepositoryCard({ repository, className }: RepositoryCardProps) {
  const getLanguageColor = (language: string | null): string => {
    if (!language) return 'bg-gray-500';
    
    const colors: Record<string, string> = {
      JavaScript: 'bg-yellow-500',
      TypeScript: 'bg-blue-500',
      Python: 'bg-green-500',
      Java: 'bg-orange-500',
      'C++': 'bg-blue-600',
      C: 'bg-gray-600',
      'C#': 'bg-purple-500',
      PHP: 'bg-indigo-500',
      Ruby: 'bg-red-500',
      Go: 'bg-cyan-500',
      Rust: 'bg-orange-600',
      Swift: 'bg-orange-400',
      Kotlin: 'bg-purple-600',
      HTML: 'bg-orange-500',
      CSS: 'bg-blue-400',
      SCSS: 'bg-pink-500',
      Shell: 'bg-gray-700',
      Dockerfile: 'bg-blue-500',
      Makefile: 'bg-yellow-600',
    };

    return colors[language] || 'bg-gray-500';
  };

  // Construire le contenu de la carte (réutilisable)
  const cardContent = (
    <Card className={`cursor-pointer hover:shadow-lg transition-shadow h-full ${className}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 mb-2">
              {repository.source_type === 'github' ? (
                <Github className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              ) : (
                <Folder className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              )}
              <span className="truncate">{repository.name}</span>
            </CardTitle>
            {repository.description && (
              <CardDescription className="line-clamp-2">
                {repository.description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Métriques GitHub */}
          {repository.source_type === 'github' && (
            <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
              {repository.github_stars !== null && repository.github_stars !== undefined && (
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span>{formatNumber(repository.github_stars)}</span>
                </div>
              )}
              {repository.github_forks !== null && repository.github_forks !== undefined && (
                <div className="flex items-center gap-1">
                  <GitFork className="h-3.5 w-3.5" />
                  <span>{formatNumber(repository.github_forks)}</span>
                </div>
              )}
              {repository.github_watchers !== null && repository.github_watchers !== undefined && (
                <div className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  <span>{formatNumber(repository.github_watchers)}</span>
                </div>
              )}
              {repository.github_open_issues !== null && repository.github_open_issues !== undefined && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>{formatNumber(repository.github_open_issues)}</span>
                </div>
              )}
            </div>
          )}
          
          {/* Langage et badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {repository.language && (
              <div className="flex items-center gap-1.5">
                <span
                  className={`h-3 w-3 rounded-full ${getLanguageColor(repository.language)}`}
                />
                <span className="text-xs text-muted-foreground">{repository.language}</span>
              </div>
            )}
            {repository.source_type === 'github' && repository.github_owner && repository.github_repo && (
              <Badge variant="outline" className="text-xs">
                {repository.github_owner}/{repository.github_repo}
              </Badge>
            )}
            {repository.source_type === 'local' && (
              <Badge variant="secondary" className="text-xs">
                Local
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Pour les dépôts GitHub avec informations complètes, rediriger vers GitHub
  if (repository.source_type === 'github' && repository.github_owner && repository.github_repo) {
    const githubUrl = `https://github.com/${repository.github_owner}/${repository.github_repo}`;
    return (
      <a
        href={githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {cardContent}
      </a>
    );
  }

  // Pour les dépôts locaux ou GitHub incomplets, rediriger vers la page de détail
  return (
    <Link href={`/applications/${repository.id}`}>
      {cardContent}
    </Link>
  );
}

