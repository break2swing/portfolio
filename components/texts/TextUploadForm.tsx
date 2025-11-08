'use client';

import { useState, useEffect } from 'react';
import { Category, Tag } from '@/lib/supabaseClient';
import { textService } from '@/services/textService';
import { categoryService } from '@/services/categoryService';
import { tagService } from '@/services/tagService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { MarkdownRenderer } from './MarkdownRenderer';
import { TagBadge } from './TagBadge';

interface TextUploadFormProps {
  onSuccess: () => void;
}

export function TextUploadForm({ onSuccess }: TextUploadFormProps) {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [author, setAuthor] = useState('');
  const [publishedDate, setPublishedDate] = useState('');
  const [categoryId, setCategoryId] = useState<string>('none');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isPublished, setIsPublished] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

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
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error('Champs requis', {
        description: 'Veuillez renseigner un titre et du contenu',
      });
      return;
    }

    setLoading(true);

    try {
      const { maxOrder, error: maxError } = await textService.getMaxDisplayOrder();

      if (maxError) {
        console.error('[FORM] Error getting max order:', maxError);
        toast.error('Erreur', {
          description: 'Impossible de récupérer l&apos;ordre d&apos;affichage',
        });
        return;
      }

      const newText = {
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        content: content.trim(),
        excerpt: excerpt.trim() || null,
        author: author.trim() || null,
        published_date: publishedDate || null,
        category_id: categoryId === 'none' ? null : categoryId,
        is_published: isPublished,
        display_order: (maxOrder ?? -1) + 1,
      };

      console.log('[FORM] Creating text with data:', newText);

      const { text, error } = await textService.createTextWithTags(newText, selectedTagIds);

      if (error) {
        console.error('[FORM] Create text - ERROR:', error);
        toast.error('Erreur lors de l&apos;ajout', {
          description: error.message || 'Impossible d&apos;ajouter le texte',
        });
        return;
      }

      console.log('[FORM] Create text - SUCCESS:', text);

      toast.success('Texte ajouté', {
        description: 'Le texte a été ajouté avec succès',
      });

      // Reset form
      setTitle('');
      setSubtitle('');
      setContent('');
      setExcerpt('');
      setAuthor('');
      setPublishedDate('');
      setCategoryId('none');
      setSelectedTagIds([]);
      setIsPublished(false);

      onSuccess();
    } catch (error: any) {
      console.error('[FORM] Unexpected error:', error);
      toast.error('Erreur', {
        description: error?.message || 'Une erreur inattendue s&apos;est produite',
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
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Sous-titre</Label>
              <Input
                id="subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="author">Auteur</Label>
              <Input
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date de publication</Label>
              <Input
                id="date"
                type="date"
                value={publishedDate}
                onChange={(e) => setPublishedDate(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select value={categoryId} onValueChange={setCategoryId} disabled={loading}>
                <SelectTrigger id="category">
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
              onCheckedChange={setIsPublished}
              disabled={loading}
            />
            <Label htmlFor="published">
              Publier ce texte (visible publiquement)
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Extrait / Résumé</Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              disabled={loading}
              rows={3}
            />
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
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={loading}
                rows={15}
                className="font-mono text-sm"
                required
              />
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

          <Button type="submit" disabled={loading || !title.trim() || !content.trim()} className="w-full">
            {loading ? (
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
