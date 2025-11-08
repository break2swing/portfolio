'use client';

import { Video } from '@/lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Video as VideoIcon, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/OptimizedImage';

interface VideoCardProps {
  video: Video;
  onClick: () => void;
}

export function VideoCard({ video, onClick }: VideoCardProps) {
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card
      className="overflow-hidden cursor-pointer group transition-all hover:shadow-lg"
      onClick={onClick}
    >
      <div className="relative aspect-video bg-secondary">
        {video.thumbnail_url ? (
          <>
            <OptimizedImage
              src={video.thumbnail_url}
              alt={video.title}
              className="aspect-video"
              objectFit="cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                <Play className="h-8 w-8 text-foreground ml-1" />
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <VideoIcon className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
            {formatDuration(video.duration)}
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg line-clamp-2 mb-1">{video.title}</h3>
        {video.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {video.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
