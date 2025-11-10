'use client';

import { MusicTrack } from '@/lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Music, Play, Pause } from 'lucide-react';
import { BookmarkButton } from '@/components/BookmarkButton';

interface TrackListProps {
  tracks: MusicTrack[];
  currentTrackId?: string;
  isPlaying?: boolean;
  onTrackSelect: (index: number) => void;
}

export function TrackList({ tracks, currentTrackId, isPlaying = false, onTrackSelect }: TrackListProps) {
  if (tracks.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Aucun morceau disponible</p>
        </CardContent>
      </Card>
    );
  }

  const formatDuration = (seconds: number | null | undefined): string => {
    if (!seconds || seconds <= 0) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-2">
      {tracks.map((track, index) => {
        const isCurrentTrack = track.id === currentTrackId;
        return (
          <Card
            key={track.id}
            className={`cursor-pointer transition-all hover:bg-accent/50 ${
              isCurrentTrack
                ? 'bg-accent border-primary shadow-sm'
                : 'border-border'
            }`}
            onClick={() => onTrackSelect(index)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-8 text-center">
                  {isCurrentTrack ? (
                    <div className="flex items-center justify-center">
                      {isPlaying ? (
                        <Pause className="h-4 w-4 text-primary" />
                      ) : (
                        <Play className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground font-mono">
                      {(index + 1).toString().padStart(2, '0')}
                    </span>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {track.cover_image_url ? (
                    <img
                      src={track.cover_image_url}
                      alt={track.title}
                      className="w-12 h-12 rounded object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-secondary flex items-center justify-center">
                      <Music className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold truncate ${isCurrentTrack ? 'text-primary' : ''}`}>
                    {track.title}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {track.artist || 'Artiste inconnu'}
                  </p>
                  {track.album && (
                    <p className="text-xs text-muted-foreground truncate">
                      {track.album}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-sm text-muted-foreground">
                    {formatDuration(track.duration)}
                  </div>
                  <BookmarkButton
                    type="audio"
                    itemId={track.id}
                    itemTitle={track.title}
                    variant="ghost"
                    size="icon"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
