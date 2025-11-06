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

    try {
      const { maxOrder } = await musicService.getMaxDisplayOrder();
      const nextOrder = maxOrder + 1;

      const audioExt = audioFile.name.split('.').pop();
      const audioFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${audioExt}`;

      const { error: uploadAudioError } = await storageService.uploadAudio(audioFile, audioFileName);

      if (uploadAudioError) {
        throw uploadAudioError;
      }

      const audioPublicUrl = storageService.getAudioPublicUrl(audioFileName);

      let coverPublicUrl: string | null = null;
      let coverFileName: string | null = null;

      if (coverFile) {
        const coverExt = coverFile.name.split('.').pop();
        coverFileName = `cover-${Date.now()}-${Math.random().toString(36).substring(7)}.${coverExt}`;

        const { error: uploadCoverError } = await storageService.uploadPhoto(coverFile, coverFileName);

        if (uploadCoverError) {
          await storageService.deleteAudio(audioFileName);
          throw uploadCoverError;
        }

        coverPublicUrl = storageService.getPublicUrl(coverFileName);
      }

      const duration = await getAudioDuration(audioFile);

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
        await storageService.deleteAudio(audioFileName);
        if (coverFileName) {
          await storageService.deletePhoto(coverFileName);
        }
        throw insertError;
      }

      toast.success('Morceau ajouté', {
        description: 'Le morceau a été ajouté à la bibliothèque',
      });

      setTitle('');
      setArtist('');
      setAlbum('');
      clearAudioFile();
      clearCoverFile();
      onSuccess();
    } catch (error) {
      console.error('Error uploading track:', error);
      toast.error('Erreur', {
        description: 'Impossible d\'ajouter le morceau',
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
