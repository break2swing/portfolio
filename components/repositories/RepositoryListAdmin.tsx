'use client';

import { useState, useEffect } from 'react';
import { Repository } from '@/lib/supabaseClient';
import { repositoryService } from '@/services/repositoryService';
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
import { Github, Folder, GripVertical, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
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
import { RepositoryEditDialog } from './RepositoryEditDialog';

interface RepositoryListAdminProps {
  repositories: Repository[];
  onUpdate: () => void;
}

interface SortableRepositoryItemProps {
  repository: Repository;
  onEdit: (repo: Repository) => void;
  onDelete: (repo: Repository) => void;
  onView: (repo: Repository) => void;
}

function SortableRepositoryItem({
  repository,
  onEdit,
  onDelete,
  onView,
}: SortableRepositoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: repository.id });

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
          {repository.source_type === 'github' ? (
            <Github className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}
          <h3 className="font-semibold truncate">{repository.name}</h3>
          <Badge variant={repository.source_type === 'github' ? 'default' : 'secondary'} className="text-xs">
            {repository.source_type === 'github' ? 'GitHub' : 'Local'}
          </Badge>
          {!repository.is_public && (
            <Badge variant="outline" className="text-xs">Privé</Badge>
          )}
        </div>
        {repository.description && (
          <p className="text-sm text-muted-foreground line-clamp-1">{repository.description}</p>
        )}
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          {repository.language && (
            <span>Langage: {repository.language}</span>
          )}
          {repository.source_type === 'github' && repository.github_owner && repository.github_repo && (
            <span>{repository.github_owner}/{repository.github_repo}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onView(repository)}
          title="Voir"
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(repository)}
          title="Éditer"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(repository)}
          title="Supprimer"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function RepositoryListAdmin({ repositories, onUpdate }: RepositoryListAdminProps) {
  const [items, setItems] = useState<Repository[]>(repositories);
  const [updatingOrder, setUpdatingOrder] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [repositoryToDelete, setRepositoryToDelete] = useState<Repository | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [repositoryToEdit, setRepositoryToEdit] = useState<Repository | null>(null);
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Synchroniser items avec repositories quand ils changent
  useEffect(() => {
    setItems(repositories);
  }, [repositories]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    const newItems = arrayMove(items, oldIndex, newIndex);
    setItems(newItems);

    // Mettre à jour display_order
    setUpdatingOrder(true);
    try {
      const updates = newItems.map((item, index) => ({
        id: item.id,
        display_order: index,
      }));

      const { error } = await repositoryService.updateRepositoryOrder(updates);

      if (error) {
        toast.error('Erreur', { description: 'Impossible de mettre à jour l\'ordre' });
        // Restaurer l'ordre précédent
        setItems(repositories);
      } else {
        toast.success('Ordre mis à jour');
        onUpdate();
      }
    } catch (error) {
      toast.error('Erreur', { description: 'Une erreur inattendue s\'est produite' });
      setItems(repositories);
    } finally {
      setUpdatingOrder(false);
    }
  };

  const handleDelete = (repository: Repository) => {
    setRepositoryToDelete(repository);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!repositoryToDelete) return;

    try {
      const { error } = await repositoryService.deleteRepository(repositoryToDelete.id);

      if (error) {
        toast.error('Erreur', { description: error.message || 'Impossible de supprimer le dépôt' });
        return;
      }

      toast.success('Dépôt supprimé avec succès');
      setDeleteDialogOpen(false);
      setRepositoryToDelete(null);
      onUpdate();
    } catch (error) {
      toast.error('Erreur', { description: 'Une erreur inattendue s\'est produite' });
    }
  };

  const handleEdit = (repository: Repository) => {
    setRepositoryToEdit(repository);
    setEditDialogOpen(true);
  };

  const handleView = (repository: Repository) => {
    router.push(`/applications/${repository.id}`);
  };

  if (repositories.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Aucun dépôt disponible</p>
        <p className="text-sm mt-2">Ajoutez votre premier dépôt pour commencer</p>
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
        <SortableContext items={items.map((r) => r.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.map((repository) => (
              <SortableRepositoryItem
                key={repository.id}
                repository={repository}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {updatingOrder && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
          <span className="text-sm text-muted-foreground">Mise à jour de l'ordre...</span>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le dépôt</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le dépôt &quot;{repositoryToDelete?.name}&quot; ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {repositoryToEdit && (
        <RepositoryEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          repository={repositoryToEdit}
          onSuccess={() => {
            setEditDialogOpen(false);
            setRepositoryToEdit(null);
            onUpdate();
          }}
        />
      )}
    </>
  );
}

