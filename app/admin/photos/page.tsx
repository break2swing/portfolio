'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Photo } from '@/lib/supabaseClient';
import { photoService } from '@/services/photoService';
import { PhotoUploadForm } from '@/components/photos/PhotoUploadForm';
import { PhotoList } from '@/components/photos/PhotoList';
import { TagManager } from '@/components/texts/TagManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Loader2, Upload, Settings, Tags } from 'lucide-react';

function AdminPhotosContent() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Administration des Photos</h1>
        <p className="text-muted-foreground">Gérez votre galerie de photos et les tags</p>
      </div>

      <Tabs defaultValue="photos" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto">
          <TabsTrigger value="photos" className="gap-2">
            <Upload className="h-4 w-4" />
            Photos
          </TabsTrigger>
          <TabsTrigger value="tags" className="gap-2">
            <Tags className="h-4 w-4" />
            Tags
          </TabsTrigger>
        </TabsList>

        {/* Photos Tab */}
        <TabsContent value="photos" className="space-y-6">
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
                  Réorganisez et supprimez vos photos. Glissez-déposez pour changer l&apos;ordre.
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
        </TabsContent>

        {/* Tags Tab */}
        <TabsContent value="tags">
          <TagManager />
        </TabsContent>
      </Tabs>
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
