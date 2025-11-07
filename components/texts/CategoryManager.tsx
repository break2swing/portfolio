'use client';

import { useState, useEffect } from 'react';
import { Category } from '@/lib/supabaseClient';
import { categoryService } from '@/services/categoryService';
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
import { Loader2, Plus, Edit2, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { CategoryBadge } from './CategoryBadge';

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('210 100% 50%'); // HSL format

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
    setName('');
    setDescription('');
    setColor('210 100% 50%');
    setEditingCategory(null);
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setName(category.name);
      setDescription(category.description || '');
      setColor(category.color);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Erreur', { description: 'Le nom est requis' });
      return;
    }

    setSubmitting(true);

    try {
      if (editingCategory) {
        // Update existing category
        const { error } = await categoryService.updateCategory(editingCategory.id, {
          name: name.trim(),
          description: description.trim() || null,
          color,
        });

        if (error) throw error;

        toast.success('Catégorie modifiée', {
          description: 'La catégorie a été modifiée avec succès',
        });
      } else {
        // Create new category
        const { maxOrder } = await categoryService.getMaxDisplayOrder();
        const { error } = await categoryService.createCategory({
          name: name.trim(),
          description: description.trim() || null,
          color,
          display_order: (maxOrder ?? -1) + 1,
        });

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
      setSubmitting(false);
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
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category-name">Nom *</Label>
                  <Input
                    id="category-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category-description">Description</Label>
                  <Textarea
                    id="category-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={submitting}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category-color">Couleur (HSL)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="category-color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      disabled={submitting}
                      placeholder="210 100% 50%"
                    />
                    <div
                      className="w-12 h-10 rounded border"
                      style={{ backgroundColor: `hsl(${color})` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Format: &quot;teinte saturation luminosité&quot; (ex: 210 100% 50%)
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    disabled={submitting}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={submitting || !name.trim()}>
                    {submitting ? (
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