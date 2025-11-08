'use client';

import { useState } from 'react';
import { Video } from '@/lib/supabaseClient';
import { videoService } from '@/services/videoService';
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
import { Trash2, GripVertical, Loader2, Video as VideoIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface VideoListAdminProps {
  videos: Video[];
  onUpdate: () => void;
}

export function VideoListAdmin({ videos, onUpdate }: VideoListAdminProps) {
  const [deleteVideoId, setDeleteVideoId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDelete = async (video: Video) => {
    setDeleting(true);

    try {
      const videoFileName = storageService.extractFileNameFromUrl(video.video_url);

      const { error: videoStorageError } = await storageService.deleteVideo(videoFileName);

      if (videoStorageError) {
        console.error('Error deleting video file from storage:', videoStorageError);
      }

      if (video.thumbnail_url) {
        const thumbnailFileName = storageService.extractFileNameFromUrl(video.thumbnail_url);
        const { error: thumbnailStorageError } = await storageService.deletePhoto(thumbnailFileName);

        if (thumbnailStorageError) {
          console.error('Error deleting thumbnail from storage:', thumbnailStorageError);
        }
      }

      const { error: dbError } = await videoService.deleteVideo(video.id);

      if (dbError) {
        throw dbError;
      }

      toast.success('Vidéo supprimée', {
        description: 'La vidéo a été supprimée de la bibliothèque',
      });

      onUpdate();
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Erreur', {
        description: 'Impossible de supprimer la vidéo',
      });
    } finally {
      setDeleting(false);
      setDeleteVideoId(null);
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

    const reorderedVideos = [...videos];
    const [movedVideo] = reorderedVideos.splice(draggedIndex, 1);
    reorderedVideos.splice(dragOverIndex, 0, movedVideo);

    const updates = reorderedVideos.map((video, index) => ({
      id: video.id,
      display_order: index,
    }));

    try {
      for (const update of updates) {
        const { error } = await videoService.updateDisplayOrder(
          update.id,
          update.display_order
        );

        if (error) throw error;
      }

      toast.success('Ordre mis à jour', {
        description: 'L\'ordre des vidéos a été modifié',
      });

      onUpdate();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Erreur', {
        description: 'Impossible de réorganiser les vidéos',
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

  if (videos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Aucune vidéo dans la bibliothèque</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {videos.map((video, index) => (
          <Card
            key={video.id}
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
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-16 h-16 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-16 bg-secondary rounded flex items-center justify-center">
                    <VideoIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate">{video.title}</h4>
                  {video.description && (
                    <p className="text-sm text-muted-foreground truncate">
                      {video.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Durée: {formatDuration(video.duration)} • Ordre: {video.display_order}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => setDeleteVideoId(video.id)}
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
        open={deleteVideoId !== null}
        onOpenChange={(open) => !open && setDeleteVideoId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette vidéo ? Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const video = videos.find((v) => v.id === deleteVideoId);
                if (video) handleDelete(video);
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
