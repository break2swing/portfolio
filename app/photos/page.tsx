'use client';

import { useState, useEffect } from 'react';
import { PhotoWithTags, Tag } from '@/lib/supabaseClient';
import { photoService } from '@/services/photoService';
import { photoTagService } from '@/services/photoTagService';
import { PhotoGrid } from '@/components/photos/PhotoGrid';
import { PhotoViewerModal } from '@/components/photos/PhotoViewerModal';
import { TagBadge } from '@/components/texts/TagBadge';
import { Button } from '@/components/ui/button';
import { Loader2, X } from 'lucide-react';

export default function PhotosPage() {
  const [allPhotos, setAllPhotos] = useState<PhotoWithTags[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<PhotoWithTags[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [tagsAvailable, setTagsAvailable] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPhotos, selectedTagIds]);

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

  const applyFilters = () => {
    let result = [...allPhotos];

    // Filter by tags (AND logic: photo must have ALL selected tags)
    if (selectedTagIds.length > 0) {
      result = result.filter((photo) =>
        selectedTagIds.every((tagId) =>
          photo.tags?.some((tag) => tag.id === tagId)
        )
      );
    }

    setFilteredPhotos(result);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const clearFilters = () => {
    setSelectedTagIds([]);
  };

  const hasActiveFilters = selectedTagIds.length > 0;

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

      {/* Tag Filters */}
      {tagsAvailable && tags.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Tags</h3>
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

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button variant="outline" size="sm" onClick={clearFilters}>
          <X className="mr-2 h-4 w-4" />
          Effacer les filtres
        </Button>
      )}

      {/* Results Count */}
      {hasActiveFilters && (
        <p className="text-sm text-muted-foreground">
          {filteredPhotos.length} {filteredPhotos.length > 1 ? 'photos' : 'photo'}
          {` sur ${allPhotos.length}`}
        </p>
      )}

      {/* Photos Grid */}
      {filteredPhotos.length === 0 && hasActiveFilters ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Aucune photo ne correspond aux tags sélectionnés
          </p>
        </div>
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
