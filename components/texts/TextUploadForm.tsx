'use client';

import { useState } from 'react';
import { textService } from '@/services/textService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Card, CardContent } from '@/components/ui/card';

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
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error('Champs requis', {
        description: 'Veuillez renseigner un titre et du contenu',
      });
      return;
    }

    setUploading(true);

    try {
      const { maxOrder } = await textService.getMaxDisplayOrder();
      const nextOrder = maxOrder + 1;

      const { error: insertError } = await textService.createText({
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        content: content.trim(),
        excerpt: excerpt.trim() || null,
        author: author.trim() || null,
        published_date: publishedDate || null,
        display_order: nextOrder,
      });

      if (insertError) {
        console.error('[FORM] Database insert failed:', insertError);
        toast.error('Erreur lors de l\'ajout', {
          description: insertError.message || 'Impossible d\'ajouter le texte',
        });
        return;
      }

      toast.success('Texte ajouté', {
        description: 'Le texte a été ajouté avec succès',
      });

      // Réinitialiser le formulaire
      setTitle('');
      setSubtitle('');
      setContent('');
      setExcerpt('');
      setAuthor('');
      setPublishedDate('');
      onSuccess();
    } catch (error: any) {
      console.error('[FORM] Upload failed:', error);
      toast.error('Erreur', {
        description: error?.message || 'Impossible d\'ajouter le texte',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Titre *</Label>
          <Input
            id="title"
            placeholder="Titre du texte"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={uploading}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subtitle">Sous-titre</Label>
          <Input
            id="subtitle"
            placeholder="Sous-titre (optionnel)"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            disabled={uploading}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="author">Auteur</Label>
          <Input
            id="author"
            placeholder="Nom de l&apos;auteur (optionnel)"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            disabled={uploading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="published_date">Date de publication</Label>
          <Input
            id="published_date"
            type="date"
            value={publishedDate}
            onChange={(e) => setPublishedDate(e.target.value)}
            disabled={uploading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="excerpt">Extrait / Résumé</Label>
        <Textarea
          id="excerpt"
          placeholder="Résumé court du texte (optionnel)"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          disabled={uploading}
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
            placeholder="Rédigez votre texte en Markdown..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={uploading}
            rows={15}
            className="font-mono text-sm"
            required
          />
          <p className="text-xs text-muted-foreground">
            Supports Markdown : **gras**, *italique*, # Titres, - listes, [liens](url), etc.
          </p>
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

      <Button type="submit" className="w-full" disabled={uploading || !title.trim() || !content.trim()}>
        {uploading ? (
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
  );
}
