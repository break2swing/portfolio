'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Video } from '@/lib/supabaseClient';
import { videoService } from '@/services/videoService';
import { VideoUploadForm } from '@/components/videos/VideoUploadForm';
import { VideoListAdmin } from '@/components/videos/VideoListAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, Upload, Settings } from 'lucide-react';

function AdminVideosContent() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const { videos: data, error } = await videoService.getAllVideos();

      if (error) throw error;

      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Administration des Vidéos</h1>
        <p className="text-muted-foreground mt-2">
          Gérez votre bibliothèque de vidéos
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              <CardTitle>Ajouter une vidéo</CardTitle>
            </div>
            <CardDescription>
              Téléversez une nouvelle vidéo dans la bibliothèque
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VideoUploadForm onSuccess={fetchVideos} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <CardTitle>Gérer les vidéos</CardTitle>
            </div>
            <CardDescription>
              Réorganisez et supprimez vos vidéos. Glissez-déposez pour changer l'ordre.
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
                <VideoListAdmin videos={videos} onUpdate={fetchVideos} />
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
              <p className="text-2xl font-bold">{videos.length}</p>
              <p className="text-sm text-muted-foreground">
                {videos.length === 0
                  ? 'Aucune vidéo'
                  : videos.length === 1
                  ? 'Vidéo dans la bibliothèque'
                  : 'Vidéos dans la bibliothèque'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminVideosPage() {
  return (
    <ProtectedRoute>
      <AdminVideosContent />
    </ProtectedRoute>
  );
}
