'use client';

import { useState, useEffect, useCallback } from 'react';
import { Photo } from '@/lib/supabaseClient';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { OptimizedImage } from '@/components/OptimizedImage';
import { ShareButton } from '@/components/ShareButton';

interface PhotoViewerModalProps {
  photos: Photo[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
}

export function PhotoViewerModal({ photos, initialIndex, open, onClose }: PhotoViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [downloading, setDownloading] = useState(false);

  const currentPhoto = photos[currentIndex];

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoom(1);
  }, [initialIndex, open]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
    setZoom(1);
  }, [photos.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
    setZoom(1);
  }, [photos.length]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.5, 0.5));
  };

  const handleDownload = async () => {
    if (!currentPhoto) return;

    setDownloading(true);
    try {
      const response = await fetch(currentPhoto.image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentPhoto.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Téléchargement démarré', {
        description: 'La photo va être téléchargée',
      });
    } catch (error) {
      toast.error('Erreur', {
        description: 'Impossible de télécharger la photo',
      });
    } finally {
      setDownloading(false);
    }
  };


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      switch (e.key) {
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case 'Escape':
          onClose();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, goToPrevious, goToNext, onClose]);

  if (!currentPhoto) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-full h-[90vh] p-0 gap-0">
        <div className="relative w-full h-full flex flex-col">
          <div className="absolute top-4 right-4 z-50 flex gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="bg-black/50 hover:bg-black/70 text-white border-0"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className="bg-black/50 hover:bg-black/70 text-white border-0"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={handleDownload}
              disabled={downloading}
              className="bg-black/50 hover:bg-black/70 text-white border-0"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
            {currentPhoto && (
              <ShareButton
                url={`${typeof window !== 'undefined' ? window.location.origin : ''}/photos#photo-${currentPhoto.id}`}
                title={currentPhoto.title}
                description={currentPhoto.description || currentPhoto.title}
                imageUrl={currentPhoto.image_url}
                type="photo"
                variant="secondary"
                size="icon"
                className="bg-black/50 hover:bg-black/70 text-white border-0"
              />
            )}
            <Button
              variant="secondary"
              size="icon"
              onClick={onClose}
              className="bg-black/50 hover:bg-black/70 text-white border-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 flex items-center justify-center bg-black/95 overflow-auto p-4">
            <div
              className="relative transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
            >
              <OptimizedImage
                src={currentPhoto.image_url}
                alt={currentPhoto.title}
                className="max-w-full max-h-[70vh]"
                objectFit="contain"
                priority={true}
              />
            </div>
          </div>

          {photos.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                onClick={goToPrevious}
                className={cn(
                  'absolute left-4 top-1/2 -translate-y-1/2',
                  'bg-black/50 hover:bg-black/70 text-white border-0',
                  'h-12 w-12'
                )}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={goToNext}
                className={cn(
                  'absolute right-4 top-1/2 -translate-y-1/2',
                  'bg-black/50 hover:bg-black/70 text-white border-0',
                  'h-12 w-12'
                )}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          <div className="bg-background border-t p-6">
            <h2 className="text-2xl font-bold">{currentPhoto.title}</h2>
            {currentPhoto.description && (
              <p className="text-muted-foreground mt-2">{currentPhoto.description}</p>
            )}
            {photos.length > 1 && (
              <p className="text-sm text-muted-foreground mt-3">
                Photo {currentIndex + 1} sur {photos.length}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
