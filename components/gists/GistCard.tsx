'use client';

import { Gist } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileCode, Lock, Globe } from 'lucide-react';
import Link from 'next/link';
import { formatLanguageName } from '@/lib/detectLanguage';

interface GistCardProps {
  gist: Gist;
  fileCount?: number;
  languages?: string[];
  className?: string;
}

/**
 * Carte de Gist style GitHub
 */
export function GistCard({ gist, fileCount = 0, languages = [], className }: GistCardProps) {
  return (
    <Link href={`/applications/gist/${gist.id}`}>
      <Card className={`cursor-pointer hover:shadow-lg transition-shadow h-full ${className}`}>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="flex items-center gap-2 mb-2">
                {gist.title || 'Sans titre'}
                {gist.is_public ? (
                  <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
              </CardTitle>
              {gist.description && (
                <CardDescription className="line-clamp-2">
                  {gist.description}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            <Badge variant="secondary" className="gap-1">
              <FileCode className="h-3 w-3" />
              {fileCount} {fileCount === 1 ? 'fichier' : 'fichiers'}
            </Badge>
            {languages.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {languages.slice(0, 3).map((lang) => (
                  <Badge key={lang} variant="outline" className="text-xs">
                    {formatLanguageName(lang)}
                  </Badge>
                ))}
                {languages.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{languages.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

