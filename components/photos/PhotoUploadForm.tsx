'use client';

import { useState, useRef, useEffect, DragEvent } from 'react';
import { Tag } from '@/lib/supabaseClient';
import { photoService } from '@/services/photoService';
import { storageService } from '@/services/storageService';
import { tagService } from '@/services/tagService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { TagBadge } from '@/components/texts/TagBadge';
import { validateFileByCategory, validateFileSize } from '@/lib/fileValidation';

interface PhotoUploadFormProps {
  onSuccess: () => void;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function PhotoUploadForm({ onSuccess }: PhotoUploadFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    setLoadingTags(true);
    try {
      const { tags: tgs } = await tagService.getAllTags();
      setTags(tgs || []);
    } catch (error) {
      console.error('Error loading tags:', error);
    } finally {
      setLoadingTags(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const validateFile = async (file: File): Promise<string | null> => {
    // Validation de la taille
    const sizeValidation = validateFileSize(file, MAX_FILE_SIZE);
    if (!sizeValidation.valid) {
      return sizeValidation.error || null;
    }

    // Validation du type MIME et de la signature
    const categoryValidation = await validateFileByCategory(file, 'images');
    if (!categoryValidation.valid) {
      return categoryValidation.error || null;
    }

    return null;
  };

  const handleFileSelect = async (selectedFile: File) => {
    const error = await validateFile(selectedFile);
    if (error) {
      toast.error('Fichier invalide', { description: error });
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !title.trim()) {
      toast.error('Champs requis', {
        description: 'Veuillez renseigner un titre et sélectionner une photo',
      });
      return;
    }

    setUploading(true);

    try {
      const { maxOrder } = await photoService.getMaxDisplayOrder();
      const nextOrder = maxOrder + 1;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await storageService.uploadPhoto(file, fileName);

      if (uploadError) {
        throw uploadError;
      }

      const publicUrl = storageService.getPublicUrl(fileName);

      // Générer le LQIP pour la photo
      const blurDataUrl = await storageService.generateLQIPForPhoto(file);

      const { error: insertError } = await photoService.createPhotoWithTags({
        title: title.trim(),
        description: description.trim() || null,
        image_url: publicUrl,
        blur_data_url: blurDataUrl,
        display_order: nextOrder,
      }, selectedTagIds);

      if (insertError) {
        await storageService.deletePhoto(fileName);
        throw insertError;
      }

      toast.success('Photo ajoutée', {
        description: 'La photo a été ajoutée à la galerie',
      });

      setTitle('');
      setDescription('');
      setSelectedTagIds([]);
      clearFile();
      onSuccess();
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Erreur', {
        description: 'Impossible d\'ajouter la photo',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Titre *</Label>
        <Input
          id="title"
          placeholder="Titre de la photo"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={uploading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Description de la photo (optionnel)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={uploading}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Photo *</Label>
        {!preview ? (
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50',
              uploading && 'opacity-50 cursor-not-allowed'
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">
              Glissez-déposez une photo ici
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              ou cliquez pour sélectionner
            </p>
            <p className="text-xs text-muted-foreground">
              JPEG, PNG, WebP, GIF - Maximum 5MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              onChange={handleFileInputChange}
              disabled={uploading}
              className="hidden"
            />
          </div>
        ) : (
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <img
                  src={preview}
                  alt="Aperçu"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={clearFile}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2 truncate">
                {file?.name}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {!loadingTags && tags.length > 0 && (
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
      )}

      <Button type="submit" className="w-full" disabled={uploading || !file || !title.trim()}>
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Ajout en cours...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Ajouter la photo
          </>
        )}
      </Button>
    </form>
  );
}
