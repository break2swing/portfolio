'use client';

import { useState, useRef, useEffect, DragEvent } from 'react';
import { Tag } from '@/lib/supabaseClient';
import { videoService } from '@/services/videoService';
import { storageService } from '@/services/storageService';
import { tagService } from '@/services/tagService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Loader2, Video } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { TagBadge } from '@/components/texts/TagBadge';
import { validateFileByCategory, validateFileSize } from '@/lib/fileValidation';

interface VideoUploadFormProps {
  onSuccess: () => void;
}

const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

export function VideoUploadForm({ onSuccess }: VideoUploadFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

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

  const validateVideoFile = async (file: File): Promise<string | null> => {
    // Validation de la taille
    const sizeValidation = validateFileSize(file, MAX_VIDEO_SIZE);
    if (!sizeValidation.valid) {
      return sizeValidation.error || null;
    }

    // Validation du type MIME et de la signature
    const categoryValidation = await validateFileByCategory(file, 'videos');
    if (!categoryValidation.valid) {
      return categoryValidation.error || null;
    }

    return null;
  };

  const validateImageFile = async (file: File): Promise<string | null> => {
    // Validation de la taille
    const sizeValidation = validateFileSize(file, MAX_IMAGE_SIZE);
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

  const handleVideoSelect = async (selectedFile: File) => {
    const error = await validateVideoFile(selectedFile);
    if (error) {
      toast.error('Fichier vidéo invalide', { description: error });
      return;
    }
    setVideoFile(selectedFile);
    if (!title) {
      const fileName = selectedFile.name.replace(/\.[^/.]+$/, '');
      setTitle(fileName);
    }
  };

  const handleThumbnailSelect = async (selectedFile: File) => {
    const error = await validateImageFile(selectedFile);
    if (error) {
      toast.error('Image invalide', { description: error });
      return;
    }

    setThumbnailFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
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
      if (droppedFile.type.startsWith('video/')) {
        await handleVideoSelect(droppedFile);
      } else if (droppedFile.type.startsWith('image/')) {
        await handleThumbnailSelect(droppedFile);
      }
    }
  };

  const clearVideoFile = () => {
    setVideoFile(null);
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  const clearThumbnailFile = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = '';
    }
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(Math.floor(video.duration));
      };
      video.onerror = () => {
        resolve(0);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!videoFile || !title.trim()) {
      toast.error('Champs requis', {
        description: 'Veuillez renseigner un titre et sélectionner un fichier vidéo',
      });
      return;
    }

    setUploading(true);
    console.log('[FORM] Starting upload process');

    try {
      console.log('[FORM] Step 1: Getting max display order');
      const { maxOrder } = await videoService.getMaxDisplayOrder();
      const nextOrder = maxOrder + 1;
      console.log('[FORM] Next order:', nextOrder);

      const videoExt = videoFile.name.split('.').pop();
      const videoFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${videoExt}`;
      console.log('[FORM] Step 2: Uploading video file:', videoFileName);

      const { error: uploadVideoError } = await storageService.uploadVideo(videoFile, videoFileName);

      if (uploadVideoError) {
        console.error('[FORM] Video upload failed:', uploadVideoError);
        throw uploadVideoError;
      }

      console.log('[FORM] Step 3: Getting video public URL');
      const videoPublicUrl = storageService.getVideoPublicUrl(videoFileName);
      console.log('[FORM] Video URL:', videoPublicUrl);

      let thumbnailPublicUrl: string | null = null;
      let thumbnailFileName: string | null = null;

      if (thumbnailFile) {
        console.log('[FORM] Step 4: Uploading thumbnail image');
        const thumbnailExt = thumbnailFile.name.split('.').pop();
        thumbnailFileName = `thumb-${Date.now()}-${Math.random().toString(36).substring(7)}.${thumbnailExt}`;

        const { error: uploadThumbnailError } = await storageService.uploadPhoto(thumbnailFile, thumbnailFileName);

        if (uploadThumbnailError) {
          console.error('[FORM] Thumbnail upload failed:', uploadThumbnailError);
          await storageService.deleteVideo(videoFileName);
          throw uploadThumbnailError;
        }

        thumbnailPublicUrl = storageService.getPublicUrl(thumbnailFileName);
        console.log('[FORM] Thumbnail URL:', thumbnailPublicUrl);
      } else {
        console.log('[FORM] Step 4: No thumbnail image to upload');
      }

      console.log('[FORM] Step 5: Getting video duration');
      const duration = await getVideoDuration(videoFile);
      console.log('[FORM] Duration:', duration);

      console.log('[FORM] Step 6: Creating video in database with tags');
      const { error: insertError } = await videoService.createVideoWithTags({
        title: title.trim(),
        description: description.trim() || null,
        video_url: videoPublicUrl,
        thumbnail_url: thumbnailPublicUrl,
        duration: duration > 0 ? duration : null,
        display_order: nextOrder,
      }, selectedTagIds);

      if (insertError) {
        console.error('[FORM] Database insert failed:', insertError);
        console.error('[FORM] Error type:', typeof insertError);
        console.error('[FORM] Error keys:', Object.keys(insertError));

        const errorMessage = insertError.message || 'Erreur inconnue';
        const errorCode = (insertError as any).code || 'NO_CODE';
        const errorDetails = (insertError as any).details || 'Pas de détails';
        const errorHint = (insertError as any).hint || 'Pas d\'indice';

        console.error('[FORM] Error message:', errorMessage);
        console.error('[FORM] Error code:', errorCode);
        console.error('[FORM] Error details:', errorDetails);
        console.error('[FORM] Error hint:', errorHint);

        await storageService.deleteVideo(videoFileName);
        if (thumbnailFileName) {
          await storageService.deletePhoto(thumbnailFileName);
        }

        toast.error('Erreur lors de l\'insertion en base', {
          description: `${errorCode}: ${errorMessage}\n${errorHint}\n${errorDetails}`,
        });
        return;
      }

      console.log('[FORM] Upload complete - SUCCESS');
      toast.success('Vidéo ajoutée', {
        description: 'La vidéo a été ajoutée à la bibliothèque',
      });

      setTitle('');
      setDescription('');
      setSelectedTagIds([]);
      clearVideoFile();
      clearThumbnailFile();
      onSuccess();
    } catch (error: any) {
      console.error('[FORM] Upload failed - CATCH block:', error);
      console.error('[FORM] Error type:', typeof error);
      console.error('[FORM] Error constructor:', error?.constructor?.name);

      let errorMessage = 'Impossible d\'ajouter la vidéo';
      let errorDetails = '';

      if (error?.message) {
        errorMessage = error.message;
      }

      if (error?.code) {
        errorDetails = `Code: ${error.code}`;
      }

      if (error?.statusCode) {
        errorDetails += ` | Status: ${error.statusCode}`;
      }

      if (error?.hint) {
        errorDetails += ` | ${error.hint}`;
      }

      console.error('[FORM] Final error message:', errorMessage);
      console.error('[FORM] Final error details:', errorDetails);

      toast.error('Erreur', {
        description: errorDetails ? `${errorMessage}\n${errorDetails}` : errorMessage,
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
          placeholder="Titre de la vidéo"
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
          placeholder="Description de la vidéo"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={uploading}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Fichier vidéo *</Label>
        {!videoFile ? (
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50',
              uploading && 'opacity-50 cursor-not-allowed'
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !uploading && videoInputRef.current?.click()}
          >
            <Video className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">
              Glissez-déposez un fichier vidéo ici
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              ou cliquez pour sélectionner
            </p>
            <p className="text-xs text-muted-foreground">
              MP4, WebM, MOV - Maximum 100MB
            </p>
            <input
              ref={videoInputRef}
              type="file"
              accept={ACCEPTED_VIDEO_TYPES.join(',')}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleVideoSelect(file);
              }}
              disabled={uploading}
              className="hidden"
            />
          </div>
        ) : (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Video className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{videoFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={clearVideoFile}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-2">
        <Label>Miniature (optionnel)</Label>
        {!thumbnailPreview ? (
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer',
              'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50',
              uploading && 'opacity-50 cursor-not-allowed'
            )}
            onClick={() => !uploading && thumbnailInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              JPEG, PNG, WebP - Maximum 2MB
            </p>
            <input
              ref={thumbnailInputRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleThumbnailSelect(file);
              }}
              disabled={uploading}
              className="hidden"
            />
          </div>
        ) : (
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <img
                  src={thumbnailPreview}
                  alt="Aperçu"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={clearThumbnailFile}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
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

      <Button type="submit" className="w-full" disabled={uploading || !videoFile || !title.trim()}>
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Ajout en cours...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Ajouter la vidéo
          </>
        )}
      </Button>
    </form>
  );
}
