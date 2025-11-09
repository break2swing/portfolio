'use client';

import { useState, useEffect } from 'react';
import { MusicTrackWithTags, Tag } from '@/lib/supabaseClient';
import { musicService } from '@/services/musicService';
import { musicTagService } from '@/services/musicTagService';
import { AudioPlayer } from '@/components/music/AudioPlayer';
import { TrackList } from '@/components/music/TrackList';
import { TagBadge } from '@/components/texts/TagBadge';
import { Button } from '@/components/ui/button';
import { Loader2, Music as MusicIcon, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function MusiquePage() {
  const [allTracks, setAllTracks] = useState<MusicTrackWithTags[]>([]);
  const [filteredTracks, setFilteredTracks] = useState<MusicTrackWithTags[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [tagsAvailable, setTagsAvailable] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allTracks, selectedTagIds]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Charger les morceaux avec tags
      const { tracks: tracksData, error: tracksError } = await musicService.getAllTracksWithTags();
      
      if (tracksError) {
        // Si erreur liée à la table music_tags, charger sans tags
        if (tracksError.code === 'PGRST205' || tracksError.message?.includes('Could not find the table')) {
          console.warn('[MUSIC PAGE] Table music_tags does not exist - loading tracks without tags');
          setTagsAvailable(false);
          const { tracks: tracksWithoutTags, error: simpleError } = await musicService.getAllTracks();
          if (simpleError) throw simpleError;
          setAllTracks((tracksWithoutTags || []).map(t => ({ ...t, tags: [] })));
        } else {
          throw tracksError;
        }
      } else {
        setAllTracks(tracksData || []);
        setTagsAvailable(true);
      }

      // Charger uniquement les tags utilisés dans les morceaux de musique
      const { tags: tagsData, error: tagsError } = await musicTagService.getAllTagsUsedInMusicTracks();
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
    let result = [...allTracks];

    // Filter by tags (AND logic: track must have ALL selected tags)
    if (selectedTagIds.length > 0) {
      result = result.filter((track) =>
        selectedTagIds.every((tagId) =>
          track.tags?.some((tag) => tag.id === tagId)
        )
      );
    }

    setFilteredTracks(result);
    
    // Réinitialiser l'index si le morceau actuel n'est plus dans les résultats filtrés
    if (currentTrackIndex >= result.length && result.length > 0) {
      setCurrentTrackIndex(0);
    } else if (result.length === 0) {
      setCurrentTrackIndex(0);
    }
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
          {filteredTracks.length} {filteredTracks.length > 1 ? 'morceaux' : 'morceau'}
          {` sur ${allTracks.length}`}
        </p>
      )}

      <Tabs defaultValue="player" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="player">Lecteur Audio</TabsTrigger>
          <TabsTrigger value="soundcloud">SoundCloud</TabsTrigger>
        </TabsList>

        <TabsContent value="player" className="space-y-6 mt-6">
          {filteredTracks.length > 0 ? (
            <>
              <AudioPlayer tracks={filteredTracks} initialTrackIndex={currentTrackIndex} />

              <div>
                <h2 className="text-xl font-semibold mb-4">Liste de lecture</h2>
                <TrackList
                  tracks={filteredTracks}
                  currentTrackId={filteredTracks[currentTrackIndex]?.id}
                  onTrackSelect={setCurrentTrackIndex}
                />
              </div>
            </>
          ) : hasActiveFilters ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MusicIcon className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun morceau ne correspond aux tags sélectionnés</h3>
              <p className="text-sm text-muted-foreground">
                Essayez de sélectionner d&apos;autres tags ou effacez les filtres
              </p>
            </div>
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
