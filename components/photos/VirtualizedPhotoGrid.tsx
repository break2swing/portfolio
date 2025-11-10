'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Photo } from '@/lib/supabaseClient';
import { PhotoCard } from './PhotoCard';
import { Image } from 'lucide-react';

interface VirtualizedPhotoGridProps {
  photos: Photo[];
  onPhotoClick: (index: number) => void;
}

export function VirtualizedPhotoGrid({ photos, onPhotoClick }: VirtualizedPhotoGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [windowWidth, setWindowWidth] = useState<number>(0);

  // Détecter la largeur de la fenêtre pour le responsive
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    setWindowWidth(window.innerWidth);
    
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Configuration pour une grille responsive
  const columnCount = useMemo(() => {
    if (windowWidth === 0) return 4; // Valeur par défaut avant le premier rendu
    if (windowWidth < 640) return 2; // sm
    if (windowWidth < 1024) return 3; // lg
    return 4; // xl
  }, [windowWidth]);

  const rowCount = Math.ceil(photos.length / columnCount);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 300, // Hauteur estimée d'une ligne (card + gap)
    overscan: 2, // Nombre de lignes à rendre en dehors du viewport
  });

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
        <div className="p-6 rounded-full bg-muted">
          <Image className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold">Aucune photo pour le moment</h2>
        <p className="text-muted-foreground text-center max-w-md">
          La galerie sera bientôt remplie de belles photos
        </p>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="h-[calc(100vh-300px)] overflow-auto"
      role="grid"
      aria-label="Galerie de photos"
      aria-rowcount={rowCount}
      aria-colcount={columnCount}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * columnCount;
          const endIndex = Math.min(startIndex + columnCount, photos.length);
          const rowPhotos = photos.slice(startIndex, endIndex);

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              role="row"
              aria-rowindex={virtualRow.index + 1}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 px-1">
                {rowPhotos.map((photo, colIndex) => {
                  const globalIndex = startIndex + colIndex;
                  return (
                    <div
                      key={photo.id}
                      role="gridcell"
                      aria-colindex={colIndex + 1}
                    >
                      <PhotoCard
                        photo={photo}
                        onClick={() => onPhotoClick(globalIndex)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

