'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { PhotoWithTags, Tag } from '@/lib/supabaseClient';
import { photoService } from '@/services/photoService';
import { photoTagService } from '@/services/photoTagService';
import { PhotoGrid } from '@/components/photos/PhotoGrid';
import { VirtualizedPhotoGrid } from '@/components/photos/VirtualizedPhotoGrid';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useFilters } from '@/hooks/useFilters';

// Lazy load AdvancedFilters
const AdvancedFilters = dynamic(() => import('@/components/AdvancedFilters').then(mod => ({ default: mod.AdvancedFilters })), {
  loading: () => (
    <div className="w-full h-24 rounded-lg border border-border bg-card/50 animate-pulse" />
  ),
  ssr: false,
});

// Lazy load PhotoViewerModal
const PhotoViewerModal = dynamic(() => import('@/components/photos/PhotoViewerModal').then(mod => ({ default: mod.PhotoViewerModal })), {
  loading: () => <Skeleton className="h-[90vh] w-full" />,
  ssr: false,
});

export default function PhotosPage() {
  const [allPhotos, setAllPhotos] = useState<PhotoWithTags[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [tagsAvailable, setTagsAvailable] = useState(true);

  // Utiliser le hook useFilters
  const {
    filters,
    updateFilter,
    resetFilters,
    filteredItems: filteredPhotos,
    availableTags,
    hasActiveFilters,
    resultCount,
    totalCount,
  } = useFilters({
    items: allPhotos,
    searchFields: ['title', 'description'],
    dateField: 'created_at',
    tagsField: 'tags',
    titleField: 'title',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Charger les photos avec tags
      const { photos: photosData, error: photosError } = await photoService.getAllPhotosWithTags();
      
      if (photosError) {
        // Si erreur liée à la table photo_tags, charger sans tags
        if (photosError.code === 'PGRST205' || photosError.message?.includes('Could not find the table')) {
          console.warn('[PHOTOS PAGE] Table photo_tags does not exist - loading photos without tags');
          setTagsAvailable(false);
          const { photos: photosWithoutTags, error: simpleError } = await photoService.getAllPhotos();
          if (simpleError) throw simpleError;
          setAllPhotos((photosWithoutTags || []).map(p => ({ ...p, tags: [] })));
        } else {
          throw photosError;
        }
      } else {
        setAllPhotos(photosData || []);
        setTagsAvailable(true);
      }

      // Charger uniquement les tags utilisés dans les photos
      const { tags: tagsData, error: tagsError } = await photoTagService.getAllTagsUsedInPhotos();
      if (!tagsError) {
        setTags(tagsData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Chargement de la galerie...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Galerie Photos</h1>
        <p className="text-muted-foreground mt-2">
          Découvrez ma collection de photographies
        </p>
      </div>

      {/* AdvancedFilters Component */}
      <AdvancedFilters
        filters={filters}
        availableTags={availableTags}
        onFilterChange={updateFilter}
        onReset={resetFilters}
        hasActiveFilters={hasActiveFilters}
        resultCount={resultCount}
        totalCount={totalCount}
        showTags={tagsAvailable}
        showDateRange={false}
      />

      {/* Photos Grid */}
      {filteredPhotos.length === 0 && hasActiveFilters ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Aucune photo ne correspond aux critères sélectionnés
          </p>
        </div>
      ) : filteredPhotos.length > 50 ? (
        <VirtualizedPhotoGrid
          photos={filteredPhotos}
          onPhotoClick={(index) => {
            const photo = filteredPhotos[index];
            const originalIndex = allPhotos.findIndex(p => p.id === photo.id);
            setSelectedPhotoIndex(originalIndex >= 0 ? originalIndex : null);
          }}
        />
      ) : (
        <PhotoGrid photos={filteredPhotos} onPhotoClick={(index) => {
          const photo = filteredPhotos[index];
          const originalIndex = allPhotos.findIndex(p => p.id === photo.id);
          setSelectedPhotoIndex(originalIndex >= 0 ? originalIndex : null);
        }} />
      )}

      {selectedPhotoIndex !== null && (
        <PhotoViewerModal
          photos={allPhotos}
          initialIndex={selectedPhotoIndex}
          open={selectedPhotoIndex !== null}
          onClose={() => setSelectedPhotoIndex(null)}
        />
      )}
    </div>
  );
}
