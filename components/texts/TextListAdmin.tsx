'use client';

import { useState } from 'react';
import { TextWithMetadata } from '@/lib/supabaseClient';
import { textService } from '@/services/textService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, GripVertical, Calendar, User, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
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
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CategoryBadge } from './CategoryBadge';
import { TagBadge } from './TagBadge';
import { TextEditModal } from './TextEditModal';

interface TextListAdminProps {
  texts: TextWithMetadata[];
  onUpdate: () => void;
}

export function TextListAdmin({ texts, onUpdate }: TextListAdminProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<TextWithMetadata | null>(null);
  const [editingText, setEditingText] = useState<TextWithMetadata | null>(null);

  const handleDelete = async (text: TextWithMetadata) => {
    try {
      const { error } = await textService.deleteText(text.id);

      if (error) throw error;

      toast.success('Texte supprimé', {
        description: `"${text.title}" a été supprimé`,
      });
      onUpdate();
    } catch (error) {
      console.error('Error deleting text:', error);
      toast.error('Erreur', {
        description: 'Impossible de supprimer le texte',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDragStart = (text: TextWithMetadata) => {
    setDraggedItem(text);
  };

  const handleDragOver = (e: React.DragEvent, text: TextWithMetadata) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === text.id) return;

    const draggedIndex = texts.findIndex((t) => t.id === draggedItem.id);
    const targetIndex = texts.findIndex((t) => t.id === text.id);

    if (draggedIndex !== targetIndex) {
      const newTexts = [...texts];
      newTexts.splice(draggedIndex, 1);
      newTexts.splice(targetIndex, 0, draggedItem);

      newTexts.forEach((text, index) => {
        textService.updateDisplayOrder(text.id, index);
      });

      onUpdate();
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  if (texts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Aucun texte pour le moment
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {texts.map((text) => {
          const publishedDate = text.published_date
            ? format(new Date(text.published_date), 'dd/MM/yyyy', { locale: fr })
            : null;

          return (
            <Card
              key={text.id}
              draggable
              onDragStart={() => handleDragStart(text)}
              onDragOver={(e) => handleDragOver(e, text)}
              onDragEnd={handleDragEnd}
              className="cursor-move hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <GripVertical className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg truncate">{text.title}</h3>
                      {!text.is_published && (
                        <Badge variant="outline" className="text-xs">
                          Brouillon
                        </Badge>
                      )}
                    </div>
                    {text.subtitle && (
                      <p className="text-sm text-muted-foreground truncate">{text.subtitle}</p>
                    )}
                    {text.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {text.excerpt}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {text.author && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{text.author}</span>
                          </div>
                        )}
                        {publishedDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{publishedDate}</span>
                          </div>
                        )}
                      </div>
                      {text.category && (
                        <CategoryBadge category={text.category} className="text-xs" />
                      )}
                      {text.tags && text.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {text.tags.map((tag) => (
                            <TagBadge key={tag.id} tag={tag} variant="outline" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setEditingText(text)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => setDeletingId(text.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editingText && (
        <TextEditModal
          text={editingText}
          open={!!editingText}
          onClose={() => setEditingText(null)}
          onSuccess={() => {
            setEditingText(null);
            onUpdate();
          }}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deletingId !== null} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce texte ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le texte sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const text = texts.find((t) => t.id === deletingId);
                if (text) handleDelete(text);
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
