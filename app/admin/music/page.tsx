'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MusicTrack } from '@/lib/supabaseClient';
import { musicService } from '@/services/musicService';
import { MusicUploadForm } from '@/components/music/MusicUploadForm';
import { TrackListAdmin } from '@/components/music/TrackListAdmin';
import { TagManager } from '@/components/texts/TagManager';
import { RefreshButton } from '@/components/RefreshButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Loader2, Upload, Settings, Tags } from 'lucide-react';

function AdminMusicContent() {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    setLoading(true);
    try {
      const { tracks: data, error } = await musicService.getAllTracks();

      if (error) throw error;

      setTracks(data || []);
    } catch (error) {
      console.error('Error fetching tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Administration de la Musique</h1>
          <p className="text-muted-foreground">Gérez votre bibliothèque musicale et les tags</p>
        </div>
        <RefreshButton
          onRefresh={fetchTracks}
          cachePattern="music:"
          label="Rafraîchir"
        />
      </div>

      <Tabs defaultValue="music" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto">
          <TabsTrigger value="music" className="gap-2">
            <Upload className="h-4 w-4" />
            Musique
          </TabsTrigger>
          <TabsTrigger value="tags" className="gap-2">
            <Tags className="h-4 w-4" />
            Tags
          </TabsTrigger>
        </TabsList>

        {/* Music Tab */}
        <TabsContent value="music" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  <CardTitle>Ajouter un morceau</CardTitle>
                </div>
                <CardDescription>
                  Téléversez un nouveau morceau dans la bibliothèque
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MusicUploadForm onSuccess={fetchTracks} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  <CardTitle>Gérer les morceaux</CardTitle>
                </div>
                <CardDescription>
                  Réorganisez et supprimez vos morceaux. Glissez-déposez pour changer l&apos;ordre.
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
                    <TrackListAdmin tracks={tracks} onUpdate={fetchTracks} />
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
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{tracks.length}</p>
                  <p className="text-sm text-muted-foreground">
                    {tracks.length === 0
                      ? 'Aucun morceau'
                      : tracks.length === 1
                      ? 'Morceau dans la bibliothèque'
                      : 'Morceaux dans la bibliothèque'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tags Tab */}
        <TabsContent value="tags">
          <TagManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminMusicPage() {
  return (
    <ProtectedRoute>
      <AdminMusicContent />
    </ProtectedRoute>
  );
}
