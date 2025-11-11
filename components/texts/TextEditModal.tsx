'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextWithMetadata, Category, Tag } from '@/lib/supabaseClient';
import { textService } from '@/services/textService';
import { categoryService } from '@/services/categoryService';
import { tagService } from '@/services/tagService';
import { updateTextSchema, type UpdateTextFormData } from '@/lib/validators';
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
import { Skeleton } from '@/components/ui/skeleton';
import { TagBadge } from './TagBadge';

// Lazy load MarkdownRenderer (utilisé seulement dans l'onglet preview)
const MarkdownRenderer = dynamic(() => import('./MarkdownRenderer').then(mod => ({ default: mod.MarkdownRenderer })), {
  loading: () => <Skeleton className="h-64 w-full" />,
  ssr: false,
});

interface TextEditModalProps {
  text: TextWithMetadata;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TextEditModal({ text, open, onClose, onSuccess }: TextEditModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(text.tags?.map(t => t.id) || []);
  const [loadingData, setLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<UpdateTextFormData>({
    resolver: zodResolver(updateTextSchema),
    mode: 'onTouched',
    defaultValues: {
      title: text.title,
      subtitle: text.subtitle || null,
      content: text.content,
      excerpt: text.excerpt || null,
      author: text.author || null,
      published_date: text.published_date || null,
      category_id: text.category_id || null,
      is_published: text.is_published,
    },
  });

  const content = watch('content');
  const isPublished = watch('is_published');

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

  const onSubmit = async (data: UpdateTextFormData) => {
    setIsSubmitting(true);

    try {
      console.log('[MODAL] Updating text with data:', data);

      const { error } = await textService.updateTextWithTags(
        text.id,
        data,
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
      setIsSubmitting(false);
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

        <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Titre *</Label>
              <Input
                id="edit-title"
                {...register('title')}
                disabled={isSubmitting}
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? 'edit-title-error' : undefined}
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p id="edit-title-error" className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-subtitle">Sous-titre</Label>
              <Input
                id="edit-subtitle"
                {...register('subtitle')}
                disabled={isSubmitting}
                aria-invalid={!!errors.subtitle}
                aria-describedby={errors.subtitle ? 'edit-subtitle-error' : undefined}
                className={errors.subtitle ? 'border-red-500' : ''}
              />
              {errors.subtitle && (
                <p id="edit-subtitle-error" className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.subtitle.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="edit-author">Auteur</Label>
              <Input
                id="edit-author"
                {...register('author')}
                disabled={isSubmitting}
                aria-invalid={!!errors.author}
                aria-describedby={errors.author ? 'edit-author-error' : undefined}
                className={errors.author ? 'border-red-500' : ''}
              />
              {errors.author && (
                <p id="edit-author-error" className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.author.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-date">Date de publication</Label>
              <Input
                id="edit-date"
                type="date"
                {...register('published_date')}
                disabled={isSubmitting}
                aria-invalid={!!errors.published_date}
                aria-describedby={errors.published_date ? 'edit-date-error' : undefined}
                className={errors.published_date ? 'border-red-500' : ''}
              />
              {errors.published_date && (
                <p id="edit-date-error" className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.published_date.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Catégorie</Label>
              <Select
                value={watch('category_id') || 'none'}
                onValueChange={(value) => setValue('category_id', value === 'none' ? null : value)}
                disabled={isSubmitting}
              >
                <SelectTrigger
                  id="edit-category"
                  aria-invalid={!!errors.category_id}
                  aria-describedby={errors.category_id ? 'edit-category-error' : undefined}
                  className={errors.category_id ? 'border-red-500' : ''}
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
              {errors.category_id && (
                <p id="edit-category-error" className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.category_id.message}
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
              onCheckedChange={(checked) => setValue('is_published', checked)}
              disabled={isSubmitting}
            />
            <Label htmlFor="edit-published">
              Publier ce texte (visible publiquement)
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-excerpt">Extrait / Résumé</Label>
            <Textarea
              id="edit-excerpt"
              {...register('excerpt')}
              disabled={isSubmitting}
              rows={3}
              aria-invalid={!!errors.excerpt}
              aria-describedby={errors.excerpt ? 'edit-excerpt-error' : undefined}
              className={errors.excerpt ? 'border-red-500' : ''}
            />
            {errors.excerpt && (
              <p id="edit-excerpt-error" className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.excerpt.message}
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
                {...register('content')}
                disabled={isSubmitting}
                rows={15}
                className={`font-mono text-sm ${errors.content ? 'border-red-500' : ''}`}
                aria-invalid={!!errors.content}
                aria-describedby={errors.content ? 'edit-content-error' : undefined}
              />
              {errors.content && (
                <p id="edit-content-error" className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.content.message}
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
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
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
