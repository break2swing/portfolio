'use client';

import { useState } from 'react';
import { Text } from '@/lib/supabaseClient';
import { textService } from '@/services/textService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, GripVertical, Calendar, User } from 'lucide-react';
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
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TextListAdminProps {
  texts: Text[];
  onUpdate: () => void;
}

export function TextListAdmin({ texts, onUpdate }: TextListAdminProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<Text | null>(null);

  const handleDelete = async (text: Text) => {
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

  const handleDragStart = (text: Text) => {
    setDraggedItem(text);
  };

  const handleDragOver = (e: React.DragEvent, text: Text) => {
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
                    <h3 className="font-semibold text-lg truncate">{text.title}</h3>
                    {text.subtitle && (
                      <p className="text-sm text-muted-foreground truncate">{text.subtitle}</p>
                    )}
                    {text.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {text.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
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
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => setDeletingId(text.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
