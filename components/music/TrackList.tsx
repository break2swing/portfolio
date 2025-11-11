'use client';

import { MusicTrack } from '@/lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Music, Play, Pause, GripVertical } from 'lucide-react';
import { BookmarkButton } from '@/components/BookmarkButton';
import { ShareButton } from '@/components/ShareButton';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TrackListProps {
  tracks: MusicTrack[];
  currentTrackId?: string;
  isPlaying?: boolean;
  onTrackSelect: (index: number) => void;
  onReorder?: (newOrder: number[]) => void;
  reorderable?: boolean;
}

interface SortableTrackItemProps {
  track: MusicTrack;
  index: number;
  isCurrentTrack: boolean;
  isPlaying: boolean;
  onTrackSelect: (index: number) => void;
  reorderable?: boolean;
}

function SortableTrackItem({
  track,
  index,
  isCurrentTrack,
  isPlaying,
  onTrackSelect,
  reorderable = false,
}: SortableTrackItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatDuration = (seconds: number | null | undefined): string => {
    if (!seconds || seconds <= 0) return '--:--';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={`cursor-pointer transition-all hover:bg-accent/50 ${
          isCurrentTrack
            ? 'bg-accent border-primary shadow-sm'
            : 'border-border'
        }`}
        onClick={() => onTrackSelect(index)}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {reorderable && (
              <div
                {...attributes}
                {...listeners}
                className="flex-shrink-0 cursor-grab active:cursor-grabbing touch-none"
                aria-label={`Réorganiser ${track.title}`}
                role="button"
                tabIndex={0}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
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
              <div
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <ShareButton
                  url={`${typeof window !== 'undefined' ? window.location.origin : ''}/musique#track-${track.id}`}
                  title={`${track.title} - ${track.artist || 'Artiste inconnu'}`}
                  description={track.album || undefined}
                  imageUrl={track.cover_image_url || undefined}
                  type="music"
                  variant="ghost"
                  size="sm"
                />
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
    </div>
  );
}

export function TrackList({
  tracks,
  currentTrackId,
  isPlaying = false,
  onTrackSelect,
  onReorder,
  reorderable = false,
}: TrackListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = tracks.findIndex((track) => track.id === active.id);
    const newIndex = tracks.findIndex((track) => track.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const newOrder = arrayMove(
      tracks.map((_, index) => index),
      oldIndex,
      newIndex
    );

    onReorder?.(newOrder);
  };

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

  const trackIds = tracks.map((track) => track.id);

  if (reorderable) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={trackIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {tracks.map((track, index) => {
              const isCurrentTrack = track.id === currentTrackId;
              return (
                <SortableTrackItem
                  key={track.id}
                  track={track}
                  index={index}
                  isCurrentTrack={isCurrentTrack}
                  isPlaying={isPlaying}
                  onTrackSelect={onTrackSelect}
                  reorderable={reorderable}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    );
  }

  // Version non-reorderable (comportement original)
  return (
    <div className="space-y-2">
      {tracks.map((track, index) => {
        const isCurrentTrack = track.id === currentTrackId;
        return (
          <SortableTrackItem
            key={track.id}
            track={track}
            index={index}
            isCurrentTrack={isCurrentTrack}
            isPlaying={isPlaying}
            onTrackSelect={onTrackSelect}
            reorderable={false}
          />
        );
      })}
    </div>
  );
}
