'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Tag } from '@/lib/supabaseClient';
import { tagService } from '@/services/tagService';
import { createTagSchema, updateTagSchema, type CreateTagFormData, type UpdateTagFormData } from '@/lib/validators';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { TagBadge } from './TagBadge';

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#ef4444', // red
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#6366f1', // indigo
];

export function TagManager() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<CreateTagFormData | UpdateTagFormData>({
    resolver: zodResolver(editingTag ? updateTagSchema : createTagSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      color: '#3b82f6',
    },
  });

  const color = watch('color');

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    setLoading(true);
    try {
      const { tags: tgs, error } = await tagService.getAllTags();
      if (error) throw error;
      setTags(tgs || []);
    } catch (error: any) {
      console.error('Error loading tags:', error);
      toast.error('Erreur', {
        description: 'Impossible de charger les tags',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    reset({
      name: '',
      color: '#3b82f6',
    });
    setEditingTag(null);
  };

  const handleOpenDialog = (tag?: Tag) => {
    if (tag) {
      setEditingTag(tag);
      reset({
        name: tag.name,
        color: tag.color,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const onSubmit = async (data: CreateTagFormData | UpdateTagFormData) => {
    setIsSubmitting(true);

    try {
      console.log('[TAG] Submitting data:', data);

      if (editingTag) {
        // Update existing tag
        const { error } = await tagService.updateTag(editingTag.id, data);

        if (error) throw error;

        toast.success('Tag modifié', {
          description: 'Le tag a été modifié avec succès',
        });
      } else {
        // Create new tag
        const { error } = await tagService.createTag(data);

        if (error) throw error;

        toast.success('Tag créé', {
          description: 'Le tag a été créé avec succès',
        });
      }

      await loadTags();
      handleCloseDialog();
    } catch (error: any) {
      console.error('Error saving tag:', error);
      toast.error('Erreur', {
        description: error.message || 'Impossible de sauvegarder le tag',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (tag: Tag) => {
    if (!confirm(`Supprimer le tag "${tag.name}" ?\n\nCette action supprimera le tag de tous les textes associés.`)) {
      return;
    }

    try {
      const { error } = await tagService.deleteTag(tag.id);
      if (error) throw error;

      toast.success('Tag supprimé', {
        description: 'Le tag a été supprimé avec succès',
      });
      await loadTags();
    } catch (error: any) {
      console.error('Error deleting tag:', error);
      toast.error('Erreur', {
        description: error.message || 'Impossible de supprimer le tag',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Tags</CardTitle>
            <CardDescription>
              Gérez les tags pour classifier vos textes
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau tag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingTag ? 'Modifier le tag' : 'Nouveau tag'}
                </DialogTitle>
                <DialogDescription>
                  {editingTag
                    ? 'Modifiez les informations du tag'
                    : 'Créez un nouveau tag pour classifier vos textes'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tag-name">Nom *</Label>
                  <Input
                    id="tag-name"
                    {...register('name')}
                    disabled={isSubmitting}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'tag-name-error' : undefined}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p id="tag-name-error" className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tag-color-hex">Couleur</Label>
                  <div className="flex gap-2">
                    {PRESET_COLORS.map((presetColor) => (
                      <button
                        key={presetColor}
                        type="button"
                        className={`w-10 h-10 rounded-full border-2 ${
                          color === presetColor
                            ? 'border-foreground scale-110'
                            : 'border-transparent'
                        } transition-all`}
                        style={{ backgroundColor: presetColor }}
                        onClick={() => setValue('color', presetColor)}
                        disabled={isSubmitting}
                        aria-label={`Sélectionner la couleur ${presetColor}`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Input
                      type="color"
                      value={color}
                      onChange={(e) => setValue('color', e.target.value)}
                      disabled={isSubmitting}
                      className="w-20 h-10"
                      aria-label="Sélecteur de couleur"
                      aria-invalid={!!errors.color}
                    />
                    <Input
                      id="tag-color-hex"
                      {...register('color')}
                      disabled={isSubmitting}
                      placeholder="#3b82f6"
                      aria-invalid={!!errors.color}
                      aria-describedby={errors.color ? 'tag-color-error' : undefined}
                      className={errors.color ? 'border-red-500' : ''}
                    />
                  </div>
                  {errors.color && (
                    <p id="tag-color-error" className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.color.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    disabled={isSubmitting}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      'Enregistrer'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {tags.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Aucun tag. Créez-en un pour commencer.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <TagBadge tag={tag} />
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenDialog(tag)}
                    className="h-6 w-6 p-0"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(tag)}
                    className="h-6 w-6 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}