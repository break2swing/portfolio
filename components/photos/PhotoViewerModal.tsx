'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Photo } from '@/lib/supabaseClient';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  Loader2,
  RotateCw,
  RefreshCw,
  Maximize,
  Minimize,
  Move
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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

type FitMode = 'contain' | 'cover' | 'fill' | 'stretch' | 'center' | 'thumbnail';

export function PhotoViewerModal({ photos, initialIndex, open, onClose }: PhotoViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(0.9);
  const [downloading, setDownloading] = useState(false);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [fitMode, setFitMode] = useState<FitMode>('thumbnail');
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentPhoto = photos[currentIndex];

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoom(0.9);
    setRotation(0);
    setFitMode('thumbnail');
    setPanX(0);
    setPanY(0);
  }, [initialIndex, open]);

  const resetTransformations = useCallback(() => {
    setZoom(0.9);
    setRotation(0);
    setFitMode('thumbnail');
    setPanX(0);
    setPanY(0);
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
    resetTransformations();
  }, [photos.length, resetTransformations]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
    resetTransformations();
  }, [photos.length, resetTransformations]);

  const goToFirst = useCallback(() => {
    setCurrentIndex(0);
    resetTransformations();
  }, [resetTransformations]);

  const goToLast = useCallback(() => {
    setCurrentIndex(photos.length - 1);
    resetTransformations();
  }, [photos.length, resetTransformations]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.1, 0.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    resetTransformations();
  };

  const handleFitModeChange = (mode: FitMode) => {
    setFitMode(mode);
    // Reset pan when changing fit mode
    setPanX(0);
    setPanY(0);
  };

  const cycleFitMode = () => {
    const modes: FitMode[] = ['contain', 'cover', 'fill', 'stretch', 'center', 'thumbnail'];
    const currentIndex = modes.indexOf(fitMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    handleFitModeChange(modes[nextIndex]);
  };

  const getTransformStyle = () => {
    return `scale(${zoom}) rotate(${rotation}deg) translate(${panX}px, ${panY}px)`;
  };

  // Handle mouse wheel zoom
  useEffect(() => {
    if (!open || !containerRef.current) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((prev) => Math.max(0.5, Math.min(3, prev + delta)));
    };

    const container = containerRef.current;
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [open]);

  // Handle drag for panning when zoomed
  useEffect(() => {
    if (!open || !imageContainerRef.current || zoom <= 1) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (zoom > 1 && (e.target === imageContainerRef.current || imageContainerRef.current?.contains(e.target as Node))) {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && zoom > 1) {
        e.preventDefault();
        setPanX(e.clientX - dragStart.x);
        setPanY(e.clientY - dragStart.y);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const container = imageContainerRef.current;
    if (container) {
      container.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      if (container) {
        container.removeEventListener('mousedown', handleMouseDown);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [open, zoom, isDragging, dragStart, panX, panY]);

  // Handle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      const element = containerRef.current;
      if (element.requestFullscreen) {
        element.requestFullscreen().catch(() => {
          // Fullscreen not supported or denied
        });
      } else if ((element as any).webkitRequestFullscreen) {
        (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        (element as any).msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreenNow = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFullscreenNow);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

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
          if (isFullscreen) {
            toggleFullscreen();
          } else {
            onClose();
          }
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case 'r':
        case 'R':
          handleRotate();
          break;
        case '0':
          handleReset();
          break;
        case 'Home':
          if (e.shiftKey) {
            goToFirst();
          } else {
            handleReset();
          }
          break;
        case 'End':
          goToLast();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, goToPrevious, goToNext, onClose, handleReset, handleRotate, isFullscreen, toggleFullscreen, goToFirst, goToLast]);

  if (!currentPhoto) return null;

  const fitModeLabels: Record<FitMode, string> = {
    contain: 'Ajuster',
    cover: 'Remplir',
    fill: 'Étendre',
    stretch: 'Étirer',
    center: 'Centrer',
    thumbnail: 'Vignette',
  };

  const getObjectFitValue = (mode: FitMode): 'contain' | 'cover' | 'fill' | 'none' => {
    if (mode === 'center') return 'none';
    if (mode === 'stretch') return 'fill';
    if (mode === 'thumbnail') return 'contain';
    return mode;
  };

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl w-full h-[90vh] p-0 gap-0">
          <DialogTitle className="sr-only">
            {currentPhoto ? `Visionneuse de photos - ${currentPhoto.title}` : 'Visionneuse de photos'}
          </DialogTitle>
          <div ref={containerRef} className="relative w-full h-full flex flex-col">
            <div className="absolute top-4 right-4 z-50 flex gap-2 flex-wrap">
              {/* Zoom Out */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleZoomOut}
                    disabled={zoom <= 0.5}
                    className="bg-black/50 hover:bg-black/70 text-white border-0"
                    aria-label="Zoom arrière"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Zoom arrière (-)</p>
                </TooltipContent>
              </Tooltip>

              {/* Zoom In */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleZoomIn}
                    disabled={zoom >= 3}
                    className="bg-black/50 hover:bg-black/70 text-white border-0"
                    aria-label="Zoom avant"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Zoom avant (+)</p>
                </TooltipContent>
              </Tooltip>

              {/* Zoom indicator */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-black/50 text-white px-3 py-2 rounded-md text-sm flex items-center">
                    {Math.round(zoom * 100)}%
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Niveau de zoom</p>
                </TooltipContent>
              </Tooltip>

              {/* Fit Mode Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={cycleFitMode}
                    className={cn(
                      "bg-black/50 hover:bg-black/70 text-white border-0",
                      fitMode !== 'thumbnail' && "ring-2 ring-white/50"
                    )}
                    aria-label="Mode d'affichage"
                  >
                    <Move className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mode: {fitModeLabels[fitMode]} - Cliquer pour changer</p>
                </TooltipContent>
              </Tooltip>

              {/* Rotate */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleRotate}
                    className="bg-black/50 hover:bg-black/70 text-white border-0"
                    aria-label="Rotation"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Rotation 90° (R)</p>
                </TooltipContent>
              </Tooltip>

              {/* Reset */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleReset}
                    className="bg-black/50 hover:bg-black/70 text-white border-0"
                    aria-label="Réinitialiser"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Réinitialiser (0)</p>
                </TooltipContent>
              </Tooltip>

              {/* Fullscreen */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={toggleFullscreen}
                    className="bg-black/50 hover:bg-black/70 text-white border-0"
                    aria-label="Plein écran"
                  >
                    {isFullscreen ? (
                      <Minimize className="h-4 w-4" />
                    ) : (
                      <Maximize className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isFullscreen ? 'Quitter plein écran' : 'Plein écran'}</p>
                </TooltipContent>
              </Tooltip>

              {/* Download */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleDownload}
                    disabled={downloading}
                    className="bg-black/50 hover:bg-black/70 text-white border-0"
                    aria-label="Télécharger"
                  >
                    {downloading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Télécharger</p>
                </TooltipContent>
              </Tooltip>

              {/* Share */}
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

              {/* Close */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={onClose}
                    className="bg-black/50 hover:bg-black/70 text-white border-0"
                    aria-label="Fermer"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Fermer (Échap)</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <div 
              className="flex-1 flex items-center justify-center bg-black/95 overflow-auto p-4"
              style={{ cursor: zoom > 1 && isDragging ? 'grabbing' : zoom > 1 ? 'grab' : 'default' }}
            >
              <div
                ref={imageContainerRef}
                className={cn(
                  "relative transition-transform duration-200",
                  fitMode === 'center' && "max-w-none max-h-none"
                )}
                style={{ 
                  transform: getTransformStyle(),
                  transformOrigin: 'center center',
                }}
              >
                <div
                  className={cn(
                    fitMode === 'contain' && "max-w-full max-h-[70vh]",
                    fitMode === 'cover' && "w-full h-[70vh]",
                    fitMode === 'fill' && "w-full h-[70vh]",
                    fitMode === 'stretch' && "w-full h-[70vh]",
                    fitMode === 'center' && "w-auto h-auto inline-block",
                    fitMode === 'thumbnail' && "max-w-md max-h-[50vh] rounded-xl shadow-2xl"
                  )}
                >
                  <OptimizedImage
                    src={currentPhoto.image_url}
                    alt={currentPhoto.title}
                    className={cn(
                      fitMode === 'center' && "[&>div]:!w-auto [&>div]:!h-auto [&>div]:!overflow-visible [&>div>img]:!w-auto [&>div>img]:!h-auto",
                      fitMode === 'thumbnail' && "[&>div]:rounded-xl [&>div]:overflow-hidden"
                    )}
                    objectFit={getObjectFitValue(fitMode)}
                    priority={true}
                  />
                </div>
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
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
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
                <div className="flex flex-col items-end gap-1 text-sm text-muted-foreground">
                  {rotation !== 0 && (
                    <p>Rotation: {rotation}°</p>
                  )}
                  <p>Mode: {fitModeLabels[fitMode]}</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
