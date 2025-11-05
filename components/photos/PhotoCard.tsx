'use client';

import { Photo } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface PhotoCardProps {
  photo: Photo;
  onClick: () => void;
}

export function PhotoCard({ photo, onClick }: PhotoCardProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg cursor-pointer',
        'aspect-square bg-muted',
        'transition-all duration-300 hover:shadow-lg hover:scale-[1.02]'
      )}
      onClick={onClick}
    >
      <img
        src={photo.image_url}
        alt={photo.title}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-300',
          'flex items-end p-4'
        )}
      >
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
}
