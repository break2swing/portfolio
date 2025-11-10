'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { VideoWithTags, Tag } from '@/lib/supabaseClient';
import { videoService } from '@/services/videoService';
import { videoTagService } from '@/services/videoTagService';
import { VideoGrid } from '@/components/videos/VideoGrid';
import { TagBadge } from '@/components/texts/TagBadge';
import { SearchSuggestions } from '@/components/texts/SearchSuggestions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, X, Search } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { searchInCollection, SearchResult } from '@/lib/search';
import { saveSearchQuery } from '@/lib/searchHistory';

export default function VideosPage() {
  const [allVideos, setAllVideos] = useState<VideoWithTags[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<VideoWithTags[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [tagsAvailable, setTagsAvailable] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

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

      // Charger uniquement les tags utilisés dans les vidéos
      const { tags: tagsData, error: tagsError } = await videoTagService.getAllTagsUsedInVideos();
      if (!tagsError) {
        setTags(tagsData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Recherche fuzzy avec highlighting
  const searchResultsMemo = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return [];
    }

    const videosToSearch = allVideos.filter((video) => {
      // Appliquer les filtres de tags avant la recherche
      if (selectedTagIds.length > 0) {
        if (!selectedTagIds.every((tagId) => video.tags?.some((tag) => tag.id === tagId))) {
          return false;
        }
      }
      return true;
    });

    return searchInCollection(
      videosToSearch,
      debouncedSearchQuery,
      [
        { field: 'title', weight: 3 },
        { field: 'description', weight: 2 },
      ],
      {
        fuzzy: true,
        threshold: 0.7,
        highlight: true,
        sortByRelevance: true,
        maxResults: 8,
      }
    );
  }, [allVideos, debouncedSearchQuery, selectedTagIds]);

  // Mettre à jour les résultats de recherche pour les suggestions
  useEffect(() => {
    setSearchResults(searchResultsMemo);
    setShowSuggestions(searchQuery.trim().length > 0 && searchResultsMemo.length > 0);
  }, [searchResultsMemo, searchQuery]);

  const applyFilters = useMemo(() => {
    let result = [...allVideos];

    // Filter by tags (AND logic: video must have ALL selected tags)
    if (selectedTagIds.length > 0) {
      result = result.filter((video) =>
        selectedTagIds.every((tagId) =>
          video.tags?.some((tag) => tag.id === tagId)
        )
      );
    }

    // Filter by search query using fuzzy search
    if (debouncedSearchQuery.trim()) {
      const searchResults = searchInCollection(
        result,
        debouncedSearchQuery,
        [
          { field: 'title', weight: 3 },
          { field: 'description', weight: 2 },
        ],
        {
          fuzzy: true,
          threshold: 0.7,
          sortByRelevance: true,
        }
      );
      result = searchResults.map((r) => r.item);
    }

    return result;
  }, [allVideos, selectedTagIds, debouncedSearchQuery]);

  useEffect(() => {
    setFilteredVideos(applyFilters);
  }, [applyFilters]);

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const clearFilters = () => {
    setSelectedTagIds([]);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleSearchSelect = (result: SearchResult) => {
    const video = result.item as VideoWithTags;
    // Optionnel: ouvrir la vidéo ou naviguer vers elle
    setShowSuggestions(false);
    if (searchQuery.trim()) {
      saveSearchQuery(searchQuery);
    }
  };

  const handleHistorySelect = (query: string) => {
    setSearchQuery(query);
    setShowSuggestions(false);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      handleSearchSelect(searchResults[0]);
    }
  };

  const hasActiveFilters = selectedTagIds.length > 0 || searchQuery.trim();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Vidéos</h1>
        <p className="text-muted-foreground mt-2">
          Découvrez mes créations vidéo
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
        <Input
          ref={searchInputRef}
          placeholder="Rechercher une vidéo..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSuggestions(e.target.value.trim().length > 0);
          }}
          onFocus={() => {
            if (searchQuery.trim() || searchResults.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onKeyDown={handleSearchKeyDown}
          className="pl-10"
        />
        {showSuggestions && (
          <SearchSuggestions
            query={searchQuery}
            results={searchResults}
            onSelect={handleSearchSelect}
            onClose={() => setShowSuggestions(false)}
            contentType="videos"
            onHistorySelect={handleHistorySelect}
          />
        )}
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
          <p className="text-sm text-muted-foreground">
            {filteredVideos.length} {filteredVideos.length > 1 ? 'vidéos' : 'vidéo'}
            {hasActiveFilters && ` sur ${allVideos.length}`}
          </p>

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
