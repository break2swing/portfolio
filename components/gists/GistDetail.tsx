'use client';

import { useState, useEffect } from 'react';
import { GistWithFiles } from '@/lib/supabaseClient';
import { gistService } from '@/services/gistService';
import { CodeViewer } from '@/components/repositories/CodeViewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, FileCode, Lock, Globe } from 'lucide-react';
import { formatLanguageName } from '@/lib/detectLanguage';
import { Badge } from '@/components/ui/badge';

interface GistDetailProps {
  gistId: string;
}

/**
 * Page de détail d'un Gist avec affichage des fichiers
 */
export function GistDetail({ gistId }: GistDetailProps) {
  const [gist, setGist] = useState<GistWithFiles | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFileIndex, setActiveFileIndex] = useState(0);

  useEffect(() => {
    loadGist();
  }, [gistId]);

  const loadGist = async () => {
    setLoading(true);
    setError(null);

    try {
      const { gist: gistData, error: gistError } = await gistService.getGistById(gistId);

      if (gistError) {
        throw gistError;
      }

      if (!gistData) {
        throw new Error('Gist non trouvé');
      }

      setGist(gistData);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement du Gist');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Chargement du Gist...</p>
        </div>
      </div>
    );
  }

  if (error || !gist) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <FileCode className="h-12 w-12 mx-auto text-muted-foreground" />
          <h2 className="text-2xl font-bold">Gist non trouvé</h2>
          <p className="text-muted-foreground">{error || 'Ce Gist n\'existe pas ou n\'est pas accessible'}</p>
        </div>
      </div>
    );
  }

  const activeFile = gist.files[activeFileIndex];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">
            {gist.title || 'Sans titre'}
          </h1>
          {gist.is_public ? (
            <Badge variant="secondary" className="gap-1">
              <Globe className="h-3 w-3" />
              Public
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <Lock className="h-3 w-3" />
              Privé
            </Badge>
          )}
        </div>
        {gist.description && (
          <p className="text-muted-foreground">{gist.description}</p>
        )}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{gist.files.length} {gist.files.length === 1 ? 'fichier' : 'fichiers'}</span>
          {gist.files.some((f) => f.language) && (
            <div className="flex items-center gap-2">
              <span>Langages :</span>
              <div className="flex gap-1 flex-wrap">
                {Array.from(new Set(gist.files.map((f) => f.language).filter((l): l is string => l !== null))).map(
                  (lang) => (
                    <Badge key={lang} variant="outline" className="text-xs">
                      {formatLanguageName(lang)}
                    </Badge>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Files */}
      {gist.files.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Aucun fichier dans ce Gist</p>
        </div>
      ) : gist.files.length === 1 ? (
        // Un seul fichier : affichage direct
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              <span className="font-mono text-sm">{gist.files[0].filename}</span>
              {gist.files[0].language && (
                <Badge variant="outline" className="text-xs">
                  {formatLanguageName(gist.files[0].language)}
                </Badge>
              )}
            </div>
          </div>
          <CodeViewer
            code={gist.files[0].content}
            language={gist.files[0].language || undefined}
            filename={gist.files[0].filename}
            showLineNumbers={true}
          />
        </div>
      ) : (
        // Plusieurs fichiers : utiliser des tabs
        <Tabs value={activeFileIndex.toString()} onValueChange={(v) => setActiveFileIndex(Number(v))}>
          <TabsList className="grid w-full grid-cols-auto overflow-x-auto">
            {gist.files.map((file, index) => (
              <TabsTrigger key={file.id} value={index.toString()} className="gap-2">
                <FileCode className="h-4 w-4" />
                <span className="font-mono text-sm">{file.filename}</span>
                {file.language && (
                  <Badge variant="outline" className="text-xs">
                    {formatLanguageName(file.language)}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {gist.files.map((file, index) => (
            <TabsContent key={file.id} value={index.toString()} className="mt-4">
              <CodeViewer
                code={file.content}
                language={file.language || undefined}
                filename={file.filename}
                showLineNumbers={true}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}

