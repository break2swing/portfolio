'use client';

import { useState, useEffect } from 'react';
import { Video } from '@/lib/supabaseClient';
import { videoService } from '@/services/videoService';
import { VideoGrid } from '@/components/videos/VideoGrid';
import { Loader2 } from 'lucide-react';

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const { videos: data, error } = await videoService.getAllVideos();

      if (error) {
        console.error('Error fetching videos:', error);
        return;
      }

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
        <h1 className="text-3xl font-bold">Vidéos</h1>
        <p className="text-muted-foreground mt-2">
          Découvrez mes créations vidéo
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Chargement des vidéos...</p>
          </div>
        </div>
      ) : (
        <VideoGrid videos={videos} />
      )}
    </div>
  );
}
