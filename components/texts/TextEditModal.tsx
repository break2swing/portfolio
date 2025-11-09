'use client';

import { useState, useEffect } from 'react';
import { TextWithMetadata, Category, Tag } from '@/lib/supabaseClient';
import { textService } from '@/services/textService';
import { categoryService } from '@/services/categoryService';
import { tagService } from '@/services/tagService';
import { updateTextSchema } from '@/lib/validators';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { MarkdownRenderer } from './MarkdownRenderer';
import { TagBadge } from './TagBadge';
import type { ZodError } from 'zod';

interface TextEditModalProps {
  text: TextWithMetadata;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TextEditModal({ text, open, onClose, onSuccess }: TextEditModalProps) {
  const [title, setTitle] = useState(text.title);
  const [subtitle, setSubtitle] = useState(text.subtitle || '');
  const [content, setContent] = useState(text.content);
  const [excerpt, setExcerpt] = useState(text.excerpt || '');
  const [author, setAuthor] = useState(text.author || '');
  const [publishedDate, setPublishedDate] = useState(text.published_date || '');
  const [categoryId, setCategoryId] = useState<string>(text.category_id || 'none');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(text.tags?.map(t => t.id) || []);
  const [isPublished, setIsPublished] = useState(text.is_published);

  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [{ categories: cats }, { tags: tgs }] = await Promise.all([
        categoryService.getAllCategories(),
        tagService.getAllTags(),
      ]);
      setCategories(cats || []);
      setTags(tgs || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Réinitialiser les erreurs de validation
    setValidationErrors({});

    // Validation Zod avant soumission
    const updates = {
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      content: content.trim(),
      excerpt: excerpt.trim() || null,
      author: author.trim() || null,
      published_date: publishedDate || null,
      category_id: categoryId === 'none' ? null : categoryId,
      is_published: isPublished,
    };

    try {
      const validatedData = updateTextSchema.parse(updates);
      console.log('[MODAL] Validation passed:', validatedData);
    } catch (error) {
      if (error instanceof Object && 'errors' in error) {
        const zodError = error as ZodError;
        const errors: Record<string, string> = {};
        zodError.errors.forEach((err) => {
          if (err.path.length > 0) {
            errors[err.path[0] as string] = err.message;
          }
        });
        setValidationErrors(errors);
        toast.error('Erreur de validation', {
          description: 'Veuillez corriger les erreurs dans le formulaire',
        });
        return;
      }
      console.error('[MODAL] Validation error:', error);
      return;
    }

    setLoading(true);

    try {
      const { error } = await textService.updateTextWithTags(
        text.id,
        updates,
        selectedTagIds
      );

      if (error) {
        console.error('[MODAL] Update failed:', error);
        toast.error('Erreur lors de la modification', {
          description: error.message || 'Impossible de modifier le texte',
        });
        return;
      }

      toast.success('Texte modifié', {
        description: 'Le texte a été modifié avec succès',
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('[MODAL] Update failed:', error);
      toast.error('Erreur', {
        description: error?.message || 'Impossible de modifier le texte',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  if (loadingData) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Éditer le texte</DialogTitle>
          <DialogDescription>
            Modifiez les informations du texte ci-dessous
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Titre *</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
                required
                aria-invalid={!!validationErrors.title}
                aria-describedby={validationErrors.title ? 'edit-title-error' : undefined}
              />
              {validationErrors.title && (
                <p id="edit-title-error" className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {validationErrors.title}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-subtitle">Sous-titre</Label>
              <Input
                id="edit-subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                disabled={loading}
                aria-invalid={!!validationErrors.subtitle}
                aria-describedby={validationErrors.subtitle ? 'edit-subtitle-error' : undefined}
              />
              {validationErrors.subtitle && (
                <p id="edit-subtitle-error" className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {validationErrors.subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="edit-author">Auteur</Label>
              <Input
                id="edit-author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                disabled={loading}
                aria-invalid={!!validationErrors.author}
                aria-describedby={validationErrors.author ? 'edit-author-error' : undefined}
              />
              {validationErrors.author && (
                <p id="edit-author-error" className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {validationErrors.author}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-date">Date de publication</Label>
              <Input
                id="edit-date"
                type="date"
                value={publishedDate}
                onChange={(e) => setPublishedDate(e.target.value)}
                disabled={loading}
                aria-invalid={!!validationErrors.published_date}
                aria-describedby={validationErrors.published_date ? 'edit-date-error' : undefined}
              />
              {validationErrors.published_date && (
                <p id="edit-date-error" className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {validationErrors.published_date}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Catégorie</Label>
              <Select value={categoryId} onValueChange={setCategoryId} disabled={loading}>
                <SelectTrigger
                  id="edit-category"
                  aria-invalid={!!validationErrors.category_id}
                  aria-describedby={validationErrors.category_id ? 'edit-category-error' : undefined}
                >
                  <SelectValue placeholder="Aucune catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune catégorie</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.category_id && (
                <p id="edit-category-error" className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {validationErrors.category_id}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <TagBadge
                  key={tag.id}
                  tag={tag}
                  variant={selectedTagIds.includes(tag.id) ? 'default' : 'outline'}
                  onClick={() => toggleTag(tag.id)}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="edit-published"
              checked={isPublished}
              onCheckedChange={setIsPublished}
              disabled={loading}
            />
            <Label htmlFor="edit-published">
              Publier ce texte (visible publiquement)
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-excerpt">Extrait / Résumé</Label>
            <Textarea
              id="edit-excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              disabled={loading}
              rows={3}
              aria-invalid={!!validationErrors.excerpt}
              aria-describedby={validationErrors.excerpt ? 'edit-excerpt-error' : undefined}
            />
            {validationErrors.excerpt && (
              <p id="edit-excerpt-error" className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {validationErrors.excerpt}
              </p>
            )}
          </div>

          <Tabs defaultValue="edit" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit">Éditer</TabsTrigger>
              <TabsTrigger value="preview">Aperçu</TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="space-y-2 mt-4">
              <Label htmlFor="edit-content">Contenu (Markdown) *</Label>
              <Textarea
                id="edit-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={loading}
                rows={15}
                className="font-mono text-sm"
                required
                aria-invalid={!!validationErrors.content}
                aria-describedby={validationErrors.content ? 'edit-content-error' : undefined}
              />
              {validationErrors.content && (
                <p id="edit-content-error" className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {validationErrors.content}
                </p>
              )}
            </TabsContent>

            <TabsContent value="preview" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {content ? (
                    <MarkdownRenderer content={content} />
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      Aucun contenu à prévisualiser
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || !title.trim() || !content.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
