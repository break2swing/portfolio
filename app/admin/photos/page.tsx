'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { supabase, Photo } from '@/lib/supabase';
import { PhotoUploadForm } from '@/components/photos/PhotoUploadForm';
import { PhotoList } from '@/components/photos/PhotoList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, Upload, Settings } from 'lucide-react';

function AdminPhotosContent() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;

      setPhotos(data || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Administration des Photos</h1>
        <p className="text-muted-foreground mt-2">
          Gérez votre galerie de photos
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              <CardTitle>Ajouter une photo</CardTitle>
            </div>
            <CardDescription>
              Téléversez une nouvelle photo dans la galerie
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PhotoUploadForm onSuccess={fetchPhotos} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <CardTitle>Gérer les photos</CardTitle>
            </div>
            <CardDescription>
              Réorganisez et supprimez vos photos. Glissez-déposez pour changer l'ordre.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Chargement...</p>
                </div>
              </div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto pr-2">
                <PhotoList photos={photos} onUpdate={fetchPhotos} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Statistiques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{photos.length}</p>
              <p className="text-sm text-muted-foreground">
                {photos.length === 0
                  ? 'Aucune photo'
                  : photos.length === 1
                  ? 'Photo dans la galerie'
                  : 'Photos dans la galerie'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminPhotosPage() {
  return (
    <ProtectedRoute>
      <AdminPhotosContent />
    </ProtectedRoute>
  );
}
