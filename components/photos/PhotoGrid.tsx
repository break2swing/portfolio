'use client';

import { memo } from 'react';
import { Photo } from '@/lib/supabaseClient';
import { PhotoCard } from './PhotoCard';
import { Image } from 'lucide-react';

interface PhotoGridProps {
  photos: Photo[];
  onPhotoClick: (index: number) => void;
}

export const PhotoGrid = memo(function PhotoGrid({ photos, onPhotoClick }: PhotoGridProps) {
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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {photos.map((photo, index) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          onClick={() => onPhotoClick(index)}
        />
      ))}
    </div>
  );
});
