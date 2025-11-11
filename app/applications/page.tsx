'use client';

import { useState, useEffect } from 'react';
import { Repository, Gist } from '@/lib/supabaseClient';
import { repositoryService } from '@/services/repositoryService';
import { gistService } from '@/services/gistService';
import { RepositoryList } from '@/components/repositories/RepositoryList';
import { GistList } from '@/components/gists/GistList';
import { Loader2, Code, FileCode } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ApplicationsPage() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [gists, setGists] = useState<Gist[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingGists, setLoadingGists] = useState(true);

  useEffect(() => {
    fetchRepositories();
    fetchGists();
  }, []);

  const fetchRepositories = async () => {
    setLoading(true);
    try {
      const { repositories: repos, error } = await repositoryService.getAllRepositories();

      if (error) {
        console.error('Error fetching repositories:', error);
        return;
      }

      setRepositories(repos || []);
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGists = async () => {
    setLoadingGists(true);
    try {
      const { gists: gistsData, error } = await gistService.getAllGists();

      if (error) {
        console.error('Error fetching gists:', error);
        return;
      }

      setGists(gistsData || []);
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoadingGists(false);
    }
  };

  if (loading || loadingGists) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Applications</h1>
        <p className="text-muted-foreground">
          Mes projets de développement, dépôts de code et Gists
        </p>
      </div>

      <Tabs defaultValue="repositories" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto">
          <TabsTrigger value="repositories" className="gap-2">
            <Code className="h-4 w-4" />
            Dépôts ({repositories.length})
          </TabsTrigger>
          <TabsTrigger value="gists" className="gap-2">
            <FileCode className="h-4 w-4" />
            Gists ({gists.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="repositories">
          <RepositoryList repositories={repositories} loading={loading} />
        </TabsContent>

        <TabsContent value="gists">
          <GistList gists={gists} loading={loadingGists} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
