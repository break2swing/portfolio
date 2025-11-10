'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Bookmark, FileText, Image, Video as VideoIcon, Music, Trash2, Loader2 } from 'lucide-react';
import { useBookmarks } from '@/hooks/useBookmarks';
import { textService } from '@/services/textService';
import { photoService } from '@/services/photoService';
import { videoService } from '@/services/videoService';
import { musicService } from '@/services/musicService';
import { TextCard } from '@/components/texts/TextCard';
import { PhotoCard } from '@/components/photos/PhotoCard';
import { VideoCard } from '@/components/videos/VideoCard';
import { TextWithMetadata, Photo, Video, MusicTrack } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { serviceLogger } from '@/lib/logger';

const logger = serviceLogger.child('favoris-page');

export default function FavorisPage() {
  const { getBookmarkedIds, counts, clearByType, clearAll } = useBookmarks();
  const [activeTab, setActiveTab] = useState('texts');
  const [loading, setLoading] = useState(true);

  const [bookmarkedTexts, setBookmarkedTexts] = useState<TextWithMetadata[]>([]);
  const [bookmarkedPhotos, setBookmarkedPhotos] = useState<Photo[]>([]);
  const [bookmarkedVideos, setBookmarkedVideos] = useState<Video[]>([]);
  const [bookmarkedMusic, setBookmarkedMusic] = useState<MusicTrack[]>([]);

  const [selectedText, setSelectedText] = useState<TextWithMetadata | null>(null);

  useEffect(() => {
    loadBookmarkedContent();
  }, []);

  const loadBookmarkedContent = async () => {
    setLoading(true);
    logger.info('Loading bookmarked content');

    try {
      const textIds = getBookmarkedIds('text');
      const photoIds = getBookmarkedIds('photo');
      const videoIds = getBookmarkedIds('video');
      const musicIds = getBookmarkedIds('music');

      const [textsData, photosData, videosData, musicData] = await Promise.all([
        textService.getAllTexts(),
        photoService.getAllPhotos(),
        videoService.getAllVideos(),
        musicService.getAllTracks(),
      ]);

      if (textsData.texts) {
        setBookmarkedTexts(textsData.texts.filter(t => textIds.includes(t.id)));
      }

      if (photosData.photos) {
        setBookmarkedPhotos(photosData.photos.filter(p => photoIds.includes(p.id)));
      }

      if (videosData.videos) {
        setBookmarkedVideos(videosData.videos.filter(v => videoIds.includes(v.id)));
      }

      if (musicData.tracks) {
        setBookmarkedMusic(musicData.tracks.filter(m => musicIds.includes(m.id)));
      }

      logger.debug('Bookmarked content loaded', {
        texts: textIds.length,
        photos: photoIds.length,
        videos: videoIds.length,
        music: musicIds.length,
      });
    } catch (error) {
      logger.error('Failed to load bookmarked content', error as Error);
      toast.error('Erreur', {
        description: 'Impossible de charger les favoris',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearByType = (type: 'text' | 'photo' | 'video' | 'music') => {
    clearByType(type);
    loadBookmarkedContent();
    toast.success('Favoris supprimés', {
      description: `Tous les favoris ${type === 'text' ? 'textes' : type === 'photo' ? 'photos' : type === 'video' ? 'vidéos' : 'musique'} ont été supprimés`,
    });
  };

  const handleClearAll = () => {
    clearAll();
    loadBookmarkedContent();
    toast.success('Tous les favoris supprimés');
  };

  const totalCount = counts.text + counts.photo + counts.video + counts.music;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Chargement des favoris...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Bookmark className="h-8 w-8" />
            Mes Favoris
          </h1>
          <p className="text-muted-foreground">
            {totalCount} {totalCount > 1 ? 'éléments enregistrés' : 'élément enregistré'}
          </p>
        </div>

        {totalCount > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Tout effacer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer tous les favoris ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action supprimera tous vos favoris de tous les types. Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAll}>
                  Supprimer tout
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {totalCount === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] space-y-4">
          <div className="p-6 rounded-full bg-muted">
            <Bookmark className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold">Aucun favori</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Vous n'avez pas encore ajouté de favoris. Cliquez sur l'icône ⭐ sur vos contenus préférés pour les retrouver ici.
          </p>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="texts" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Textes</span>
              <span className="text-xs">({counts.text})</span>
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              <span className="hidden sm:inline">Photos</span>
              <span className="text-xs">({counts.photo})</span>
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <VideoIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Vidéos</span>
              <span className="text-xs">({counts.video})</span>
            </TabsTrigger>
            <TabsTrigger value="music" className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              <span className="hidden sm:inline">Musique</span>
              <span className="text-xs">({counts.music})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="texts" className="space-y-4">
            {bookmarkedTexts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aucun texte en favori</p>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    {bookmarkedTexts.length} {bookmarkedTexts.length > 1 ? 'textes' : 'texte'}
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Effacer
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer les favoris textes ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action supprimera tous vos textes favoris.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleClearByType('text')}>
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {bookmarkedTexts.map((text) => (
                    <TextCard
                      key={text.id}
                      text={text}
                      onClick={() => setSelectedText(text)}
                    />
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="photos" className="space-y-4">
            {bookmarkedPhotos.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aucune photo en favori</p>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    {bookmarkedPhotos.length} {bookmarkedPhotos.length > 1 ? 'photos' : 'photo'}
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Effacer
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer les favoris photos ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action supprimera toutes vos photos favorites.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleClearByType('photo')}>
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {bookmarkedPhotos.map((photo, index) => (
                    <PhotoCard
                      key={photo.id}
                      photo={photo}
                      onClick={() => {}}
                    />
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="videos" className="space-y-4">
            {bookmarkedVideos.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aucune vidéo en favori</p>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    {bookmarkedVideos.length} {bookmarkedVideos.length > 1 ? 'vidéos' : 'vidéo'}
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Effacer
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer les favoris vidéos ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action supprimera toutes vos vidéos favorites.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleClearByType('video')}>
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {bookmarkedVideos.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      onClick={() => {}}
                    />
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="music" className="space-y-4">
            {bookmarkedMusic.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aucune musique en favori</p>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    {bookmarkedMusic.length} {bookmarkedMusic.length > 1 ? 'pistes' : 'piste'}
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Effacer
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer les favoris musique ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action supprimera toutes vos pistes musicales favorites.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleClearByType('music')}>
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <div className="space-y-2">
                  {bookmarkedMusic.map((track) => (
                    <div key={track.id} className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <Music className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium">{track.title}</p>
                        <p className="text-sm text-muted-foreground">{track.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
