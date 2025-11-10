'use client';

import { memo } from 'react';
import { Photo } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/OptimizedImage';
import { BookmarkButton } from '@/components/BookmarkButton';

interface PhotoCardProps {
  photo: Photo;
  onClick: () => void;
}

export const PhotoCard = memo(function PhotoCard({ photo, onClick }: PhotoCardProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg cursor-pointer',
        'transition-all duration-300 hover:shadow-lg hover:scale-[1.02]'
      )}
      onClick={onClick}
    >
      <OptimizedImage
        src={photo.image_url}
        alt={photo.title}
        className="aspect-square"
        objectFit="cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        blurDataURL={photo.blur_data_url || undefined}
      />
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-300',
          'flex flex-col justify-between p-4'
        )}
      >
        <div className="flex justify-end">
          <BookmarkButton
            type="photo"
            itemId={photo.id}
            itemTitle={photo.title}
            variant="ghost"
            size="icon"
            className="bg-black/40 hover:bg-black/60 text-white"
          />
        </div>
        <div className="text-white">
          <h3 className="font-semibold text-lg leading-tight">{photo.title}</h3>
          {photo.description && (
            <p className="text-sm text-white/90 mt-1 line-clamp-2">
              {photo.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});
