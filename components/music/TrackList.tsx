'use client';

import { MusicTrack } from '@/lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Music } from 'lucide-react';
import { BookmarkButton } from '@/components/BookmarkButton';

interface TrackListProps {
  tracks: MusicTrack[];
  currentTrackId?: string;
  onTrackSelect: (index: number) => void;
}

export function TrackList({ tracks, currentTrackId, onTrackSelect }: TrackListProps) {
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

  return (
    <div className="space-y-2">
      {tracks.map((track, index) => (
        <Card
          key={track.id}
          className={`cursor-pointer transition-colors hover:bg-accent/50 ${
            track.id === currentTrackId ? 'bg-accent border-primary' : ''
          }`}
          onClick={() => onTrackSelect(index)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
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
                <h3 className="font-semibold truncate">{track.title}</h3>
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
                {track.duration && track.duration > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                  </div>
                )}
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
      ))}
    </div>
  );
}
