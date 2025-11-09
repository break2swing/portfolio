'use client';

import { useState } from 'react';
import { Photo } from '@/lib/supabaseClient';
import { photoService } from '@/services/photoService';
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
import { Trash2, GripVertical, Loader2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PhotoEditDialog } from './PhotoEditDialog';

interface PhotoListProps {
  photos: Photo[];
  onUpdate: () => void;
}

export function PhotoList({ photos, onUpdate }: PhotoListProps) {
  const [deletePhotoId, setDeletePhotoId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [editPhoto, setEditPhoto] = useState<Photo | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleEdit = (photo: Photo) => {
    setEditPhoto(photo);
    setEditDialogOpen(true);
  };

  const handleDelete = async (photo: Photo) => {
    setDeleting(true);

    try {
      const fileName = storageService.extractFileNameFromUrl(photo.image_url);

      const { error: storageError } = await storageService.deletePhoto(fileName);

      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
      }

      const { error: dbError } = await photoService.deletePhoto(photo.id);

      if (dbError) {
        throw dbError;
      }

      toast.success('Photo supprimée', {
        description: 'La photo a été supprimée de la galerie',
      });

      onUpdate();
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Erreur', {
        description: 'Impossible de supprimer la photo',
      });
    } finally {
      setDeleting(false);
      setDeletePhotoId(null);
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

    const reorderedPhotos = [...photos];
    const [movedPhoto] = reorderedPhotos.splice(draggedIndex, 1);
    reorderedPhotos.splice(dragOverIndex, 0, movedPhoto);

    const updates = reorderedPhotos.map((photo, index) => ({
      id: photo.id,
      display_order: index,
    }));

    try {
      for (const update of updates) {
        const { error } = await photoService.updateDisplayOrder(
          update.id,
          update.display_order
        );

        if (error) throw error;
      }

      toast.success('Ordre mis à jour', {
        description: 'L\'ordre des photos a été modifié',
      });

      onUpdate();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Erreur', {
        description: 'Impossible de réorganiser les photos',
      });
    } finally {
      setDraggedIndex(null);
      setDragOverIndex(null);
    }
  };

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Aucune photo dans la galerie</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {photos.map((photo, index) => (
          <Card
            key={photo.id}
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
                <img
                  src={photo.image_url}
                  alt={photo.title}
                  className="w-20 h-20 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate">{photo.title}</h4>
                  {photo.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {photo.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Ordre: {photo.display_order}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(photo)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => setDeletePhotoId(photo.id)}
                    disabled={deleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog
        open={deletePhotoId !== null}
        onOpenChange={(open) => !open && setDeletePhotoId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette photo ? Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const photo = photos.find((p) => p.id === deletePhotoId);
                if (photo) handleDelete(photo);
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

      <PhotoEditDialog
        photo={editPhoto}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={onUpdate}
      />
    </>
  );
}
