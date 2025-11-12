'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Repository, Gist } from '@/lib/supabaseClient';
import { repositoryService } from '@/services/repositoryService';
import { gistService } from '@/services/gistService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Loader2, Upload, Settings, Code, FileCode } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load RepositoryUploadForm
const RepositoryUploadForm = dynamic(() => import('@/components/repositories/RepositoryUploadForm').then(mod => ({ default: mod.RepositoryUploadForm })), {
  loading: () => <Skeleton className="h-96 w-full" />,
  ssr: false,
});

// Lazy load RepositoryListAdmin
const RepositoryListAdmin = dynamic(() => import('@/components/repositories/RepositoryListAdmin').then(mod => ({ default: mod.RepositoryListAdmin })), {
  loading: () => <Skeleton className="h-96 w-full" />,
  ssr: false,
});

// Lazy load GistForm
const GistForm = dynamic(() => import('@/components/gists/GistForm').then(mod => ({ default: mod.GistForm })), {
  loading: () => <Skeleton className="h-96 w-full" />,
  ssr: false,
});

// Lazy load GistListAdmin
const GistListAdmin = dynamic(() => import('@/components/gists/GistListAdmin').then(mod => ({ default: mod.GistListAdmin })), {
  loading: () => <Skeleton className="h-96 w-full" />,
  ssr: false,
});

// Lazy load RefreshButton (uses cache which can cause webpack issues)
const RefreshButton = dynamic(() => import('@/components/RefreshButton').then(mod => ({ default: mod.RefreshButton })), {
  ssr: false,
});

function AdminApplicationsContent() {
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
      const { repositories: data, error } = await repositoryService.getAllRepositories();

      if (error) throw error;

      setRepositories(data || []);
    } catch (error) {
      console.error('Error fetching repositories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGists = async () => {
    setLoadingGists(true);
    try {
      const { gists: data, error } = await gistService.getAllGistsAdmin();

      if (error) throw error;

      setGists(data || []);
    } catch (error) {
      console.error('Error fetching gists:', error);
    } finally {
      setLoadingGists(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Administration des Applications</h1>
          <p className="text-muted-foreground">Gérez vos dépôts de code GitHub et locaux</p>
        </div>
        <RefreshButton
          onRefresh={fetchRepositories}
          cachePattern="repositories:"
          label="Rafraîchir"
        />
      </div>

      <Tabs defaultValue="repositories" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto">
          <TabsTrigger value="repositories" className="gap-2">
            <Code className="h-4 w-4" />
            Dépôts
          </TabsTrigger>
          <TabsTrigger value="gists" className="gap-2">
            <FileCode className="h-4 w-4" />
            Gists
          </TabsTrigger>
        </TabsList>

        {/* Repositories Tab */}
        <TabsContent value="repositories" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  <CardTitle>Ajouter un dépôt</CardTitle>
                </div>
                <CardDescription>
                  Ajoutez un dépôt GitHub ou uploadez une base de code locale
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RepositoryUploadForm onSuccess={fetchRepositories} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  <CardTitle>Gérer les dépôts</CardTitle>
                </div>
                <CardDescription>
                  Réorganisez et modifiez vos dépôts. Glissez-déposez pour changer l&apos;ordre.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Chargement...</p>
                    </div>
                  </div>
                ) : (
                  <div className="max-h-[600px] overflow-y-auto pr-2">
                    <RepositoryListAdmin repositories={repositories} onUpdate={fetchRepositories} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Separator />

          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-2xl font-bold">{repositories.length}</p>
                  <p className="text-sm text-muted-foreground">
                    {repositories.length === 0
                      ? 'Aucun dépôt'
                      : repositories.length === 1
                      ? 'Dépôt total'
                      : 'Dépôts totaux'}
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {repositories.filter(r => r.source_type === 'github').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Dépôts GitHub</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {repositories.filter(r => r.source_type === 'local').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Dépôts locaux</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {repositories.filter(r => r.is_public).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Dépôts publics</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gists Tab */}
        <TabsContent value="gists" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  <CardTitle>Créer un Gist</CardTitle>
                </div>
                <CardDescription>
                  Créez un nouveau Gist avec un ou plusieurs fichiers de code
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GistForm onSuccess={fetchGists} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  <CardTitle>Gérer les Gists</CardTitle>
                </div>
                <CardDescription>
                  Réorganisez et modifiez vos Gists. Glissez-déposez pour changer l&apos;ordre.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingGists ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Chargement...</p>
                    </div>
                  </div>
                ) : (
                  <div className="max-h-[600px] overflow-y-auto pr-2">
                    <GistListAdmin gists={gists} onUpdate={fetchGists} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Separator />

          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-2xl font-bold">{gists.length}</p>
                  <p className="text-sm text-muted-foreground">
                    {gists.length === 0
                      ? 'Aucun Gist'
                      : gists.length === 1
                      ? 'Gist total'
                      : 'Gists totaux'}
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {gists.filter(g => g.is_public).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Gists publics</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {gists.filter(g => !g.is_public).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Gists privés</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {repositories.length + gists.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Applications</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminApplicationsPage() {
  return (
    <ProtectedRoute>
      <AdminApplicationsContent />
    </ProtectedRoute>
  );
}

