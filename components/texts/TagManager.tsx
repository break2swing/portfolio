'use client';

import { useState, useEffect } from 'react';
import { Tag } from '@/lib/supabaseClient';
import { tagService } from '@/services/tagService';
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
import { Loader2, Plus, Edit2, Trash2 } from 'lucide-react';
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
  const [submitting, setSubmitting] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');

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
    setName('');
    setColor('#3b82f6');
    setEditingTag(null);
  };

  const handleOpenDialog = (tag?: Tag) => {
    if (tag) {
      setEditingTag(tag);
      setName(tag.name);
      setColor(tag.color);
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
      if (editingTag) {
        // Update existing tag
        const { error } = await tagService.updateTag(editingTag.id, {
          name: name.trim(),
          color,
        });

        if (error) throw error;

        toast.success('Tag modifié', {
          description: 'Le tag a été modifié avec succès',
        });
      } else {
        // Create new tag
        const { error } = await tagService.createTag({
          name: name.trim(),
          color,
        });

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
      setSubmitting(false);
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
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tag-name">Nom *</Label>
                  <Input
                    id="tag-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Couleur</Label>
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
                        onClick={() => setColor(presetColor)}
                        disabled={submitting}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      disabled={submitting}
                      className="w-20 h-10"
                    />
                    <Input
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      disabled={submitting}
                      placeholder="#3b82f6"
                    />
                  </div>
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