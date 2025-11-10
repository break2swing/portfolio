'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Category } from '@/lib/supabaseClient';
import { categoryService } from '@/services/categoryService';
import { createCategorySchema, updateCategorySchema, type CreateCategoryFormData, type UpdateCategoryFormData } from '@/lib/validators';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Plus, Edit2, Trash2, GripVertical, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { CategoryBadge } from './CategoryBadge';

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<CreateCategoryFormData | UpdateCategoryFormData>({
    resolver: zodResolver(editingCategory ? updateCategorySchema : createCategorySchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      description: null,
      color: '#3b82f6',
    },
  });

  const color = watch('color');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const { categories: cats, error } = await categoryService.getAllCategories();
      if (error) throw error;
      setCategories(cats || []);
    } catch (error: any) {
      console.error('Error loading categories:', error);
      toast.error('Erreur', {
        description: 'Impossible de charger les catégories',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    reset({
      name: '',
      description: null,
      color: '#3b82f6',
    });
    setEditingCategory(null);
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      reset({
        name: category.name,
        description: category.description || null,
        color: category.color,
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

  const onSubmit = async (data: CreateCategoryFormData | UpdateCategoryFormData) => {
    setIsSubmitting(true);

    try {
      console.log('[CATEGORY] Submitting data:', data);

      if (editingCategory) {
        // Update existing category
        const { error } = await categoryService.updateCategory(editingCategory.id, data);

        if (error) throw error;

        toast.success('Catégorie modifiée', {
          description: 'La catégorie a été modifiée avec succès',
        });
      } else {
        // Create new category
        const { maxOrder } = await categoryService.getMaxDisplayOrder();
        const { error } = await categoryService.createCategory({
          ...data,
          display_order: (maxOrder ?? -1) + 1,
        } as any);

        if (error) throw error;

        toast.success('Catégorie créée', {
          description: 'La catégorie a été créée avec succès',
        });
      }

      await loadCategories();
      handleCloseDialog();
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast.error('Erreur', {
        description: error.message || 'Impossible de sauvegarder la catégorie',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`Supprimer la catégorie "${category.name}" ?\n\nLes textes associés ne seront pas supprimés, mais perdront leur catégorie.`)) {
      return;
    }

    try {
      const { error } = await categoryService.deleteCategory(category.id);
      if (error) throw error;

      toast.success('Catégorie supprimée', {
        description: 'La catégorie a été supprimée avec succès',
      });
      await loadCategories();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast.error('Erreur', {
        description: error.message || 'Impossible de supprimer la catégorie',
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
            <CardTitle>Catégories</CardTitle>
            <CardDescription>
              Gérez les catégories pour organiser vos textes
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle catégorie
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
                </DialogTitle>
                <DialogDescription>
                  {editingCategory
                    ? 'Modifiez les informations de la catégorie'
                    : 'Créez une nouvelle catégorie pour organiser vos textes'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category-name">Nom *</Label>
                  <Input
                    id="category-name"
                    {...register('name')}
                    disabled={isSubmitting}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'category-name-error' : undefined}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p id="category-name-error" className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category-description">Description</Label>
                  <Textarea
                    id="category-description"
                    {...register('description')}
                    disabled={isSubmitting}
                    rows={3}
                    aria-invalid={!!errors.description}
                    aria-describedby={errors.description ? 'category-description-error' : undefined}
                    className={errors.description ? 'border-red-500' : ''}
                  />
                  {errors.description && (
                    <p id="category-description-error" className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category-color">Couleur (Hex)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="category-color"
                      {...register('color')}
                      disabled={isSubmitting}
                      placeholder="#3b82f6"
                      aria-invalid={!!errors.color}
                      aria-describedby={errors.color ? 'category-color-error' : 'category-color-help'}
                      className={errors.color ? 'border-red-500' : ''}
                    />
                    <div
                      className="w-12 h-10 rounded border"
                      style={{ backgroundColor: color }}
                    />
                  </div>
                  {errors.color && (
                    <p id="category-color-error" className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.color.message}
                    </p>
                  )}
                  <p id="category-color-help" className="text-xs text-muted-foreground">
                    Format hexadécimal : #RRGGBB (ex: #3b82f6)
                  </p>
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
        {categories.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Aucune catégorie. Créez-en une pour commencer.
          </p>
        ) : (
          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                <CategoryBadge category={category} />
                <div className="flex-1">
                  <p className="font-medium">{category.name}</p>
                  {category.description && (
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenDialog(category)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(category)}
                  >
                    <Trash2 className="h-4 w-4" />
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