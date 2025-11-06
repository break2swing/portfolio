'use client';

import { useState, useRef, DragEvent } from 'react';
import { musicService } from '@/services/musicService';
import { storageService } from '@/services/storageService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Loader2, Music } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MusicUploadFormProps {
  onSuccess: () => void;
}

const ACCEPTED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AUDIO_SIZE = 10 * 1024 * 1024;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

export function MusicUploadForm({ onSuccess }: MusicUploadFormProps) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const validateAudioFile = (file: File): string | null => {
    if (!ACCEPTED_AUDIO_TYPES.includes(file.type)) {
      return 'Type de fichier non accepté. Utilisez MP3, WAV ou OGG.';
    }
    if (file.size > MAX_AUDIO_SIZE) {
      return 'Le fichier est trop volumineux. Maximum 10MB.';
    }
    return null;
  };

  const validateImageFile = (file: File): string | null => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return 'Type d\'image non accepté. Utilisez JPEG, PNG ou WebP.';
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return 'L\'image est trop volumineuse. Maximum 2MB.';
    }
    return null;
  };

  const handleAudioSelect = (selectedFile: File) => {
    const error = validateAudioFile(selectedFile);
    if (error) {
      toast.error('Fichier audio invalide', { description: error });
      return;
    }
    setAudioFile(selectedFile);
    if (!title) {
      const fileName = selectedFile.name.replace(/\.[^/.]+$/, '');
      setTitle(fileName);
    }
  };

  const handleCoverSelect = (selectedFile: File) => {
    const error = validateImageFile(selectedFile);
    if (error) {
      toast.error('Image invalide', { description: error });
      return;
    }

    setCoverFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverPreview(reader.result as string);
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
      if (droppedFile.type.startsWith('audio/')) {
        handleAudioSelect(droppedFile);
      } else if (droppedFile.type.startsWith('image/')) {
        handleCoverSelect(droppedFile);
      }
    }
  };

  const clearAudioFile = () => {
    setAudioFile(null);
    if (audioInputRef.current) {
      audioInputRef.current.value = '';
    }
  };

  const clearCoverFile = () => {
    setCoverFile(null);
    setCoverPreview(null);
    if (coverInputRef.current) {
      coverInputRef.current.value = '';
    }
  };

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => {
        window.URL.revokeObjectURL(audio.src);
        resolve(Math.floor(audio.duration));
      };
      audio.onerror = () => {
        resolve(0);
      };
      audio.src = URL.createObjectURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!audioFile || !title.trim()) {
      toast.error('Champs requis', {
        description: 'Veuillez renseigner un titre et sélectionner un fichier audio',
      });
      return;
    }

    setUploading(true);
    console.log('[FORM] Starting upload process');

    try {
      console.log('[FORM] Step 1: Getting max display order');
      const { maxOrder } = await musicService.getMaxDisplayOrder();
      const nextOrder = maxOrder + 1;
      console.log('[FORM] Next order:', nextOrder);

      const audioExt = audioFile.name.split('.').pop();
      const audioFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${audioExt}`;
      console.log('[FORM] Step 2: Uploading audio file:', audioFileName);

      const { error: uploadAudioError } = await storageService.uploadAudio(audioFile, audioFileName);

      if (uploadAudioError) {
        console.error('[FORM] Audio upload failed:', uploadAudioError);
        throw uploadAudioError;
      }

      console.log('[FORM] Step 3: Getting audio public URL');
      const audioPublicUrl = storageService.getAudioPublicUrl(audioFileName);
      console.log('[FORM] Audio URL:', audioPublicUrl);

      let coverPublicUrl: string | null = null;
      let coverFileName: string | null = null;

      if (coverFile) {
        console.log('[FORM] Step 4: Uploading cover image');
        const coverExt = coverFile.name.split('.').pop();
        coverFileName = `cover-${Date.now()}-${Math.random().toString(36).substring(7)}.${coverExt}`;

        const { error: uploadCoverError } = await storageService.uploadPhoto(coverFile, coverFileName);

        if (uploadCoverError) {
          console.error('[FORM] Cover upload failed:', uploadCoverError);
          await storageService.deleteAudio(audioFileName);
          throw uploadCoverError;
        }

        coverPublicUrl = storageService.getPublicUrl(coverFileName);
        console.log('[FORM] Cover URL:', coverPublicUrl);
      } else {
        console.log('[FORM] Step 4: No cover image to upload');
      }

      console.log('[FORM] Step 5: Getting audio duration');
      const duration = await getAudioDuration(audioFile);
      console.log('[FORM] Duration:', duration);

      console.log('[FORM] Step 6: Creating track in database');
      const { error: insertError } = await musicService.createTrack({
        title: title.trim(),
        artist: artist.trim() || null,
        album: album.trim() || null,
        audio_url: audioPublicUrl,
        cover_image_url: coverPublicUrl,
        duration: duration > 0 ? duration : null,
        display_order: nextOrder,
      });

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

        await storageService.deleteAudio(audioFileName);
        if (coverFileName) {
          await storageService.deletePhoto(coverFileName);
        }

        toast.error('Erreur lors de l\'insertion en base', {
          description: `${errorCode}: ${errorMessage}\n${errorHint}\n${errorDetails}`,
        });
        return;
      }

      console.log('[FORM] Upload complete - SUCCESS');
      toast.success('Morceau ajouté', {
        description: 'Le morceau a été ajouté à la bibliothèque',
      });

      setTitle('');
      setArtist('');
      setAlbum('');
      clearAudioFile();
      clearCoverFile();
      onSuccess();
    } catch (error: any) {
      console.error('[FORM] Upload failed - CATCH block:', error);
      console.error('[FORM] Error type:', typeof error);
      console.error('[FORM] Error constructor:', error?.constructor?.name);

      let errorMessage = 'Impossible d\'ajouter le morceau';
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
          placeholder="Titre du morceau"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={uploading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="artist">Artiste</Label>
        <Input
          id="artist"
          placeholder="Nom de l'artiste"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          disabled={uploading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="album">Album</Label>
        <Input
          id="album"
          placeholder="Nom de l'album"
          value={album}
          onChange={(e) => setAlbum(e.target.value)}
          disabled={uploading}
        />
      </div>

      <div className="space-y-2">
        <Label>Fichier audio *</Label>
        {!audioFile ? (
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
            onClick={() => !uploading && audioInputRef.current?.click()}
          >
            <Music className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">
              Glissez-déposez un fichier audio ici
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              ou cliquez pour sélectionner
            </p>
            <p className="text-xs text-muted-foreground">
              MP3, WAV, OGG - Maximum 10MB
            </p>
            <input
              ref={audioInputRef}
              type="file"
              accept={ACCEPTED_AUDIO_TYPES.join(',')}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAudioSelect(file);
              }}
              disabled={uploading}
              className="hidden"
            />
          </div>
        ) : (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Music className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{audioFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={clearAudioFile}
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
        <Label>Image de couverture (optionnel)</Label>
        {!coverPreview ? (
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer',
              'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50',
              uploading && 'opacity-50 cursor-not-allowed'
            )}
            onClick={() => !uploading && coverInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              JPEG, PNG, WebP - Maximum 2MB
            </p>
            <input
              ref={coverInputRef}
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleCoverSelect(file);
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
                  src={coverPreview}
                  alt="Aperçu"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={clearCoverFile}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={uploading || !audioFile || !title.trim()}>
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Ajout en cours...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Ajouter le morceau
          </>
        )}
      </Button>
    </form>
  );
}
