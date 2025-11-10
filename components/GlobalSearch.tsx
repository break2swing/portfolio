'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { FileText, Image, Video, Music, AppWindow, Clock } from 'lucide-react';
import { searchAllContent, GlobalSearchItem } from '@/lib/search';
import { textService } from '@/services/textService';
import { photoService } from '@/services/photoService';
import { videoService } from '@/services/videoService';
import { musicService } from '@/services/musicService';
import { useDebounce } from '@/hooks/useDebounce';
import { serviceLogger } from '@/lib/logger';
import { saveSearchQuery, getSearchHistory } from '@/lib/searchHistory';

const logger = serviceLogger.child('global-search');

const iconMap = {
  FileText,
  Image,
  Video,
  Music,
  AppWindow,
};

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Record<string, GlobalSearchItem[]>>({});
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (open) {
      setSearchHistory(getSearchHistory());
    }
  }, [open]);

  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setResults({});
        return;
      }

      setLoading(true);
      logger.info('Performing global search', { query: debouncedQuery });

      try {
        const [textsData, photosData, videosData, musicData] = await Promise.all([
          textService.getAllTexts(),
          photoService.getAllPhotos(),
          videoService.getAllVideos(),
          musicService.getAllTracks(),
        ]);

        const searchResults = searchAllContent(
          debouncedQuery,
          {
            texts: textsData.texts || [],
            photos: photosData.photos || [],
            videos: videosData.videos || [],
            music: musicData.tracks || [],
          },
          {
            fuzzy: true,
            threshold: 0.7,
            sortByRelevance: true,
          }
        );

        setResults(searchResults);
        logger.debug('Search completed', {
          totalResults: Object.values(searchResults).flat().length,
        });
      } catch (error) {
        logger.error('Search failed', error as Error);
        setResults({});
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  const handleSelect = (url: string) => {
    if (query.trim()) {
      saveSearchQuery(query);
    }
    onOpenChange(false);
    setQuery('');
    router.push(url);
  };

  const handleHistorySelect = (historyQuery: string) => {
    setQuery(historyQuery);
  };

  const totalResults = Object.values(results).flat().length;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Rechercher dans tout le site... (⌘K)"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {loading ? 'Recherche en cours...' : 'Aucun résultat trouvé'}
        </CommandEmpty>

        {!query && searchHistory.length > 0 && (
          <>
            <CommandGroup heading="Recherches récentes">
              {searchHistory.map((historyItem, index) => (
                <CommandItem
                  key={index}
                  onSelect={() => handleHistorySelect(historyItem)}
                  className="flex items-center gap-2"
                >
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{historyItem}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {results.texts && results.texts.length > 0 && (
          <CommandGroup heading="Textes">
            {results.texts.map((item) => {
              const Icon = iconMap[item.icon as keyof typeof iconMap] || FileText;
              return (
                <CommandItem
                  key={item.id}
                  onSelect={() => handleSelect(item.url)}
                  className="flex items-start gap-3 py-3"
                >
                  <Icon className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium line-clamp-1">{item.title}</div>
                    {item.description && (
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {item.description}
                      </div>
                    )}
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {results.photos && results.photos.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Photos">
              {results.photos.map((item) => {
                const Icon = iconMap[item.icon as keyof typeof iconMap] || Image;
                return (
                  <CommandItem
                    key={item.id}
                    onSelect={() => handleSelect(item.url)}
                    className="flex items-start gap-3 py-3"
                  >
                    <Icon className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium line-clamp-1">{item.title}</div>
                      {item.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}

        {results.videos && results.videos.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Vidéos">
              {results.videos.map((item) => {
                const Icon = iconMap[item.icon as keyof typeof iconMap] || Video;
                return (
                  <CommandItem
                    key={item.id}
                    onSelect={() => handleSelect(item.url)}
                    className="flex items-start gap-3 py-3"
                  >
                    <Icon className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium line-clamp-1">{item.title}</div>
                      {item.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}

        {results.music && results.music.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Musique">
              {results.music.map((item) => {
                const Icon = iconMap[item.icon as keyof typeof iconMap] || Music;
                return (
                  <CommandItem
                    key={item.id}
                    onSelect={() => handleSelect(item.url)}
                    className="flex items-start gap-3 py-3"
                  >
                    <Icon className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium line-clamp-1">{item.title}</div>
                      {item.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {item.description}
                        </div>
                      )}
                      {item.excerpt && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {item.excerpt}
                        </div>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}

        {results.applications && results.applications.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Applications">
              {results.applications.map((item) => {
                const Icon = iconMap[item.icon as keyof typeof iconMap] || AppWindow;
                return (
                  <CommandItem
                    key={item.id}
                    onSelect={() => handleSelect(item.url)}
                    className="flex items-start gap-3 py-3"
                  >
                    <Icon className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium line-clamp-1">{item.title}</div>
                      {item.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
