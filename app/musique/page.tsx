'use client';

import { useState, useEffect } from 'react';
import { MusicTrack } from '@/lib/supabaseClient';
import { musicService } from '@/services/musicService';
import { AudioPlayer } from '@/components/music/AudioPlayer';
import { TrackList } from '@/components/music/TrackList';
import { Loader2, Music as MusicIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function MusiquePage() {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    setLoading(true);
    try {
      const { tracks: data, error } = await musicService.getAllTracks();

      if (error) throw error;

      setTracks(data || []);
    } catch (error) {
      console.error('Error fetching tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Chargement de la bibliothèque...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Musique</h1>
        <p className="text-muted-foreground">
          Découvrez mes créations musicales
        </p>
      </div>

      <Tabs defaultValue="player" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="player">Lecteur Audio</TabsTrigger>
          <TabsTrigger value="soundcloud">SoundCloud</TabsTrigger>
        </TabsList>

        <TabsContent value="player" className="space-y-6 mt-6">
          {tracks.length > 0 ? (
            <>
              <AudioPlayer tracks={tracks} initialTrackIndex={currentTrackIndex} />

              <div>
                <h2 className="text-xl font-semibold mb-4">Liste de lecture</h2>
                <TrackList
                  tracks={tracks}
                  currentTrackId={tracks[currentTrackIndex]?.id}
                  onTrackSelect={setCurrentTrackIndex}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MusicIcon className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun morceau disponible</h3>
              <p className="text-sm text-muted-foreground">
                Les morceaux apparaîtront ici une fois ajoutés à la bibliothèque
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="soundcloud" className="space-y-6 mt-6">
          <h2 className="text-2xl font-semibold">Morceaux SoundCloud</h2>

          <div className="space-y-6">
            <div className="w-full">
              <iframe
                width="100%"
                height="166"
                scrolling="no"
                frameBorder="no"
                allow="autoplay"
                src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A2205120907&color=%23217cc6&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true"
              ></iframe>
              <div
                style={{
                  fontSize: '10px',
                  color: '#cccccc',
                  lineBreak: 'anywhere',
                  wordBreak: 'normal',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  fontFamily:
                    'Interstate,Lucida Grande,Lucida Sans Unicode,Lucida Sans,Garuda,Verdana,Tahoma,sans-serif',
                  fontWeight: 100,
                }}
              >
                <a
                  href="https://soundcloud.com/dkill35"
                  title="DKill"
                  target="_blank"
                  style={{ color: '#cccccc', textDecoration: 'none' }}
                >
                  DKill
                </a>{' '}
                ·{' '}
                <a
                  href="https://soundcloud.com/dkill35/au-fond-de-mon-coeur"
                  title="Au Fond D'Mon Coeur (Prod : DKill)"
                  target="_blank"
                  style={{ color: '#cccccc', textDecoration: 'none' }}
                >
                  Au Fond D&apos;Mon Coeur (Prod : DKill)
                </a>
              </div>
            </div>

            <div className="w-full">
              <iframe
                width="100%"
                height="166"
                scrolling="no"
                frameBorder="no"
                allow="autoplay"
                src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A2204540815&color=%2345503c&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true"
              ></iframe>
              <div
                style={{
                  fontSize: '10px',
                  color: '#cccccc',
                  lineBreak: 'anywhere',
                  wordBreak: 'normal',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  fontFamily:
                    'Interstate,Lucida Grande,Lucida Sans Unicode,Lucida Sans,Garuda,Verdana,Tahoma,sans-serif',
                  fontWeight: 100,
                }}
              >
                <a
                  href="https://soundcloud.com/dkill35"
                  title="DKill"
                  target="_blank"
                  style={{ color: '#cccccc', textDecoration: 'none' }}
                >
                  DKill
                </a>{' '}
                ·{' '}
                <a
                  href="https://soundcloud.com/dkill35/dkill-grand-bleu"
                  title="Grand Bleu (Prod Rubz)"
                  target="_blank"
                  style={{ color: '#cccccc', textDecoration: 'none' }}
                >
                  Grand Bleu (Prod Rubz)
                </a>
              </div>
            </div>

            <div className="w-full">
              <iframe
                width="100%"
                height="166"
                scrolling="no"
                frameBorder="no"
                allow="autoplay"
                src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A2114203944&color=%2345503c&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true"
              ></iframe>
              <div
                style={{
                  fontSize: '10px',
                  color: '#cccccc',
                  lineBreak: 'anywhere',
                  wordBreak: 'normal',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  fontFamily:
                    'Interstate,Lucida Grande,Lucida Sans Unicode,Lucida Sans,Garuda,Verdana,Tahoma,sans-serif',
                  fontWeight: 100,
                }}
              >
                <a
                  href="https://soundcloud.com/dkill35"
                  title="DKill"
                  target="_blank"
                  style={{ color: '#cccccc', textDecoration: 'none' }}
                >
                  DKill
                </a>{' '}
                ·{' '}
                <a
                  href="https://soundcloud.com/dkill35/maplume"
                  title="Ma Plume (Prod Enigma)"
                  target="_blank"
                  style={{ color: '#cccccc', textDecoration: 'none' }}
                >
                  Ma Plume (Prod Enigma)
                </a>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
