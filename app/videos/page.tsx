'use client';

import { useState, useEffect } from 'react';
import { VideoWithTags, Tag } from '@/lib/supabaseClient';
import { videoService } from '@/services/videoService';
import { tagService } from '@/services/tagService';
import { VideoGrid } from '@/components/videos/VideoGrid';
import { TagBadge } from '@/components/texts/TagBadge';
import { Button } from '@/components/ui/button';
import { Loader2, X } from 'lucide-react';

export default function VideosPage() {
  const [allVideos, setAllVideos] = useState<VideoWithTags[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<VideoWithTags[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [tagsAvailable, setTagsAvailable] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allVideos, selectedTagIds]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Charger les vidéos avec tags
      const { videos: videosData, error: videosError } = await videoService.getAllVideosWithTags();
      
      if (videosError) {
        // Si erreur liée à la table video_tags, charger sans tags
        if (videosError.code === 'PGRST205' || videosError.message?.includes('Could not find the table')) {
          console.warn('[VIDEOS PAGE] Table video_tags does not exist - loading videos without tags');
          setTagsAvailable(false);
          const { videos: videosWithoutTags, error: simpleError } = await videoService.getAllVideos();
          if (simpleError) throw simpleError;
          setAllVideos((videosWithoutTags || []).map(v => ({ ...v, tags: [] })));
        } else {
          throw videosError;
        }
      } else {
        setAllVideos(videosData || []);
        setTagsAvailable(true);
      }

      // Charger les tags disponibles
      const { tags: tagsData, error: tagsError } = await tagService.getAllTags();
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
    let result = [...allVideos];

    // Filter by tags (AND logic: video must have ALL selected tags)
    if (selectedTagIds.length > 0) {
      result = result.filter((video) =>
        selectedTagIds.every((tagId) =>
          video.tags?.some((tag) => tag.id === tagId)
        )
      );
    }

    setFilteredVideos(result);
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Vidéos</h1>
        <p className="text-muted-foreground mt-2">
          Découvrez mes créations vidéo
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Chargement des vidéos...</p>
          </div>
        </div>
      ) : (
        <>
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
              {filteredVideos.length} {filteredVideos.length > 1 ? 'vidéos' : 'vidéo'}
              {` sur ${allVideos.length}`}
            </p>
          )}

          {/* Videos Grid */}
          {filteredVideos.length === 0 && hasActiveFilters ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Aucune vidéo ne correspond aux tags sélectionnés
              </p>
            </div>
          ) : (
            <VideoGrid videos={filteredVideos} />
          )}
        </>
      )}
    </div>
  );
}
