'use client';

import { useState } from 'react';
import { Video } from '@/lib/supabaseClient';
import { VideoCard } from './VideoCard';
import { VideoPlayerModal } from './VideoPlayerModal';

interface VideoGridProps {
  videos: Video[];
}

export function VideoGrid({ videos }: VideoGridProps) {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Aucune vidéo disponible pour le moment</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            onClick={() => setSelectedVideo(video)}
          />
        ))}
      </div>

      <VideoPlayerModal
        video={selectedVideo}
        open={selectedVideo !== null}
        onClose={() => setSelectedVideo(null)}
      />
    </>
  );
}
