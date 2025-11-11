'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Category, Tag } from '@/lib/supabaseClient';
import { textService } from '@/services/textService';
import { categoryService } from '@/services/categoryService';
import { tagService } from '@/services/tagService';
import { createTextSchema, type CreateTextFormData } from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Upload, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { TagBadge } from './TagBadge';

// Lazy load MarkdownRenderer (utilisé seulement dans l'onglet preview)
const MarkdownRenderer = dynamic(() => import('./MarkdownRenderer').then(mod => ({ default: mod.MarkdownRenderer })), {
  loading: () => <Skeleton className="h-64 w-full" />,
  ssr: false,
});

interface TextUploadFormProps {
  onSuccess: () => void;
}

export function TextUploadForm({ onSuccess }: TextUploadFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<CreateTextFormData>({
    resolver: zodResolver(createTextSchema),
    mode: 'onTouched',
    defaultValues: {
      title: '',
      subtitle: null,
      content: '',
      excerpt: null,
      author: null,
      published_date: null,
      category_id: null,
      is_published: false,
    },
  });

  const content = watch('content');
  const isPublished = watch('is_published');

  useEffect(() => {
    loadData();
  }, []);

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
      toast.error('Erreur', {
        description: 'Impossible de charger les données',
      });
    } finally {
      setLoadingData(false);
    }
  };

  const onSubmit = async (data: CreateTextFormData) => {
    setIsSubmitting(true);

    try {
      const { maxOrder, error: maxError } = await textService.getMaxDisplayOrder();

      if (maxError) {
        console.error('[FORM] Error getting max order:', maxError);
        toast.error('Erreur', {
          description: 'Impossible de récupérer l\'ordre d\'affichage',
        });
        return;
      }

      const newText = {
        ...data,
        subtitle: data.subtitle ?? null,
        excerpt: data.excerpt ?? null,
        author: data.author ?? null,
        published_date: data.published_date ?? null,
        category_id: data.category_id ?? null,
        display_order: (maxOrder ?? -1) + 1,
      };

      console.log('[FORM] Creating text with data:', newText);

      const { text, error } = await textService.createTextWithTags(newText, selectedTagIds);

      if (error) {
        console.error('[FORM] Create text - ERROR:', error);
        toast.error('Erreur lors de l\'ajout', {
          description: error.message || 'Impossible d\'ajouter le texte',
        });
        return;
      }

      console.log('[FORM] Create text - SUCCESS:', text);

      toast.success('Texte ajouté', {
        description: 'Le texte a été ajouté avec succès',
      });

      // Reset form
      reset();
      setSelectedTagIds([]);

      onSuccess();
    } catch (error: any) {
      console.error('[FORM] Unexpected error:', error);
      toast.error('Erreur', {
        description: error?.message || 'Une erreur inattendue s\'est produite',
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
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                {...register('title')}
                disabled={isSubmitting}
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? 'title-error' : undefined}
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p id="title-error" className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Sous-titre</Label>
              <Input
                id="subtitle"
                {...register('subtitle')}
                disabled={isSubmitting}
                aria-invalid={!!errors.subtitle}
                aria-describedby={errors.subtitle ? 'subtitle-error' : undefined}
                className={errors.subtitle ? 'border-red-500' : ''}
              />
              {errors.subtitle && (
                <p id="subtitle-error" className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.subtitle.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="author">Auteur</Label>
              <Input
                id="author"
                {...register('author')}
                disabled={isSubmitting}
                aria-invalid={!!errors.author}
                aria-describedby={errors.author ? 'author-error' : undefined}
                className={errors.author ? 'border-red-500' : ''}
              />
              {errors.author && (
                <p id="author-error" className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.author.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date de publication</Label>
              <Input
                id="date"
                type="date"
                {...register('published_date')}
                disabled={isSubmitting}
                aria-invalid={!!errors.published_date}
                aria-describedby={errors.published_date ? 'date-error' : undefined}
                className={errors.published_date ? 'border-red-500' : ''}
              />
              {errors.published_date && (
                <p id="date-error" className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.published_date.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select
                value={watch('category_id') || 'none'}
                onValueChange={(value) => setValue('category_id', value === 'none' ? null : value)}
                disabled={isSubmitting}
              >
                <SelectTrigger
                  id="category"
                  aria-invalid={!!errors.category_id}
                  aria-describedby={errors.category_id ? 'category-error' : undefined}
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
                <p id="category-error" className="text-sm text-red-600 flex items-center gap-1">
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
              id="published"
              checked={isPublished}
              onCheckedChange={(checked) => setValue('is_published', checked)}
              disabled={isSubmitting}
            />
            <Label htmlFor="published">
              Publier ce texte (visible publiquement)
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Extrait / Résumé</Label>
            <Textarea
              id="excerpt"
              {...register('excerpt')}
              disabled={isSubmitting}
              rows={3}
              aria-invalid={!!errors.excerpt}
              aria-describedby={errors.excerpt ? 'excerpt-error' : undefined}
              className={errors.excerpt ? 'border-red-500' : ''}
            />
            {errors.excerpt && (
              <p id="excerpt-error" className="text-sm text-red-600 flex items-center gap-1">
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
              <Label htmlFor="content">Contenu (Markdown) *</Label>
              <Textarea
                id="content"
                {...register('content')}
                disabled={isSubmitting}
                rows={15}
                className={`font-mono text-sm ${errors.content ? 'border-red-500' : ''}`}
                aria-invalid={!!errors.content}
                aria-describedby={errors.content ? 'content-error' : undefined}
              />
              {errors.content && (
                <p id="content-error" className="text-sm text-red-600 flex items-center gap-1">
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

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Ajout en cours...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Ajouter le texte
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
