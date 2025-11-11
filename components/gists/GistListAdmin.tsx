'use client';

import { useState, useEffect } from 'react';
import { Gist } from '@/lib/supabaseClient';
import { gistService } from '@/services/gistService';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Edit, Trash2, Eye, Loader2, FileCode, Lock, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
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
import { GistEditDialog } from './GistEditDialog';

interface GistListAdminProps {
  gists: Gist[];
  onUpdate: () => void;
}

interface SortableGistItemProps {
  gist: Gist;
  fileCount: number;
  onEdit: (gist: Gist) => void;
  onDelete: (gist: Gist) => void;
  onView: (gist: Gist) => void;
}

function SortableGistItem({ gist, fileCount, onEdit, onDelete, onView }: SortableGistItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: gist.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-4 p-4 border rounded-lg bg-card',
        isDragging && 'shadow-lg'
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold truncate">
            {gist.title || 'Sans titre'}
          </h3>
          {gist.is_public ? (
            <Globe className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Lock className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        {gist.description && (
          <p className="text-sm text-muted-foreground line-clamp-1">
            {gist.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary" className="gap-1">
            <FileCode className="h-3 w-3" />
            {fileCount} {fileCount === 1 ? 'fichier' : 'fichiers'}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onView(gist)}
          className="gap-2"
        >
          <Eye className="h-4 w-4" />
          Voir
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(gist)}
          className="gap-2"
        >
          <Edit className="h-4 w-4" />
          Éditer
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(gist)}
          className="gap-2 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          Supprimer
        </Button>
      </div>
    </div>
  );
}

export function GistListAdmin({ gists, onUpdate }: GistListAdminProps) {
  const [items, setItems] = useState(gists);
  const [gistToDelete, setGistToDelete] = useState<Gist | null>(null);
  const [gistToEdit, setGistToEdit] = useState<Gist | null>(null);
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    const newItems = arrayMove(items, oldIndex, newIndex);
    setItems(newItems);

    // Mettre à jour l'ordre dans la base de données
    setUpdating(true);
    try {
      const updates = newItems.map((item, index) => ({
        id: item.id,
        display_order: index,
      }));

      const { error } = await gistService.updateGistOrder(updates);

      if (error) {
        throw error;
      }

      toast.success('Ordre mis à jour');
      onUpdate();
    } catch (error: any) {
      toast.error('Erreur', {
        description: error.message || 'Impossible de mettre à jour l\'ordre',
      });
      // Restaurer l'ordre précédent
      setItems(gists);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!gistToDelete) return;

    try {
      const { error } = await gistService.deleteGist(gistToDelete.id);

      if (error) {
        throw error;
      }

      toast.success('Gist supprimé');
      setGistToDelete(null);
      onUpdate();
    } catch (error: any) {
      toast.error('Erreur', {
        description: error.message || 'Impossible de supprimer le Gist',
      });
    }
  };

  const handleView = (gist: Gist) => {
    router.push(`/applications/gist/${gist.id}`);
  };

  // Charger le nombre de fichiers pour chaque Gist
  const [fileCounts, setFileCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadFileCounts = async () => {
      const counts: Record<string, number> = {};
      for (const gist of gists) {
        const { gist: fullGist } = await gistService.getGistById(gist.id);
        if (fullGist) {
          counts[gist.id] = fullGist.files.length;
        }
      }
      setFileCounts(counts);
    };
    if (gists.length > 0) {
      loadFileCounts();
    }
  }, [gists]);

  if (gists.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Aucun Gist créé pour le moment</p>
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {items.map((gist) => (
              <SortableGistItem
                key={gist.id}
                gist={gist}
                fileCount={fileCounts[gist.id] || 0}
                onEdit={setGistToEdit}
                onDelete={setGistToDelete}
                onView={handleView}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {updating && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      <AlertDialog open={!!gistToDelete} onOpenChange={(open) => !open && setGistToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le Gist ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le Gist &quot;{gistToDelete?.title || 'Sans titre'}&quot; ?
              Cette action est irréversible et supprimera également tous les fichiers associés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {gistToEdit && (
        <GistEditDialog
          gist={gistToEdit}
          open={!!gistToEdit}
          onOpenChange={(open) => !open && setGistToEdit(null)}
          onSuccess={() => {
            setGistToEdit(null);
            onUpdate();
          }}
        />
      )}
    </>
  );
}

