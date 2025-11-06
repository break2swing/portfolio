'use client';

import { useState } from 'react';
import { MusicTrack } from '@/lib/supabaseClient';
import { musicService } from '@/services/musicService';
import { storageService } from '@/services/storageService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2, GripVertical, Loader2, Music } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TrackListAdminProps {
  tracks: MusicTrack[];
  onUpdate: () => void;
}

export function TrackListAdmin({ tracks, onUpdate }: TrackListAdminProps) {
  const [deleteTrackId, setDeleteTrackId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDelete = async (track: MusicTrack) => {
    setDeleting(true);

    try {
      const audioFileName = storageService.extractFileNameFromUrl(track.audio_url);

      const { error: audioStorageError } = await storageService.deleteAudio(audioFileName);

      if (audioStorageError) {
        console.error('Error deleting audio file from storage:', audioStorageError);
      }

      if (track.cover_image_url) {
        const coverFileName = storageService.extractFileNameFromUrl(track.cover_image_url);
        const { error: coverStorageError } = await storageService.deletePhoto(coverFileName);

        if (coverStorageError) {
          console.error('Error deleting cover image from storage:', coverStorageError);
        }
      }

      const { error: dbError } = await musicService.deleteTrack(track.id);

      if (dbError) {
        throw dbError;
      }

      toast.success('Morceau supprimé', {
        description: 'Le morceau a été supprimé de la bibliothèque',
      });

      onUpdate();
    } catch (error) {
      console.error('Error deleting track:', error);
      toast.error('Erreur', {
        description: 'Impossible de supprimer le morceau',
      });
    } finally {
      setDeleting(false);
      setDeleteTrackId(null);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null || dragOverIndex === null || draggedIndex === dragOverIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const reorderedTracks = [...tracks];
    const [movedTrack] = reorderedTracks.splice(draggedIndex, 1);
    reorderedTracks.splice(dragOverIndex, 0, movedTrack);

    const updates = reorderedTracks.map((track, index) => ({
      id: track.id,
      display_order: index,
    }));

    try {
      for (const update of updates) {
        const { error } = await musicService.updateDisplayOrder(
          update.id,
          update.display_order
        );

        if (error) throw error;
      }

      toast.success('Ordre mis à jour', {
        description: 'L\'ordre des morceaux a été modifié',
      });

      onUpdate();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Erreur', {
        description: 'Impossible de réorganiser les morceaux',
      });
    } finally {
      setDraggedIndex(null);
      setDragOverIndex(null);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (tracks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Aucun morceau dans la bibliothèque</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {tracks.map((track, index) => (
          <Card
            key={track.id}
            className={cn(
              'transition-all duration-200',
              draggedIndex === index && 'opacity-50',
              dragOverIndex === index && 'border-primary'
            )}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="cursor-move">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                </div>
                {track.cover_image_url ? (
                  <img
                    src={track.cover_image_url}
                    alt={track.title}
                    className="w-16 h-16 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-16 bg-secondary rounded flex items-center justify-center">
                    <Music className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate">{track.title}</h4>
                  <p className="text-sm text-muted-foreground truncate">
                    {track.artist || 'Artiste inconnu'}
                  </p>
                  {track.album && (
                    <p className="text-xs text-muted-foreground truncate">
                      {track.album}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Durée: {formatDuration(track.duration)} • Ordre: {track.display_order}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => setDeleteTrackId(track.id)}
                  disabled={deleting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog
        open={deleteTrackId !== null}
        onOpenChange={(open) => !open && setDeleteTrackId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce morceau ? Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const track = tracks.find((t) => t.id === deleteTrackId);
                if (track) handleDelete(track);
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
