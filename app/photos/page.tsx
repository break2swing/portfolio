'use client';

import { useState, useEffect } from 'react';
import { Photo } from '@/lib/supabaseClient';
import { photoService } from '@/services/photoService';
import { PhotoGrid } from '@/components/photos/PhotoGrid';
import { PhotoViewerModal } from '@/components/photos/PhotoViewerModal';
import { Loader2 } from 'lucide-react';

export default function PhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const { photos: data, error } = await photoService.getAllPhotos();

      if (error) throw error;

      setPhotos(data || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
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

      <PhotoGrid photos={photos} onPhotoClick={setSelectedPhotoIndex} />

      {selectedPhotoIndex !== null && (
        <PhotoViewerModal
          photos={photos}
          initialIndex={selectedPhotoIndex}
          open={selectedPhotoIndex !== null}
          onClose={() => setSelectedPhotoIndex(null)}
        />
      )}
    </div>
  );
}
