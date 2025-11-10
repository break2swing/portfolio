'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { SearchResult } from '@/lib/search';
import { getSearchHistory } from '@/lib/searchHistory';
import { cn } from '@/lib/utils';
import { Search, Clock, FileText, Image, Music, Video } from 'lucide-react';
import { useClickOutside } from '@/hooks/useClickOutside';

export interface SearchSuggestionsProps {
  query: string;
  results: SearchResult[];
  onSelect: (result: SearchResult) => void;
  onClose: () => void;
  isLoading?: boolean;
  contentType?: 'texts' | 'photos' | 'music' | 'videos';
  onHistorySelect?: (query: string) => void;
}

const CONTENT_TYPE_ICONS = {
  texts: FileText,
  photos: Image,
  music: Music,
  videos: Video,
};

export function SearchSuggestions({
  query,
  results,
  onSelect,
  onClose,
  isLoading = false,
  contentType,
  onHistorySelect,
}: SearchSuggestionsProps) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showHistory, setShowHistory] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const history = getSearchHistory();

  // Afficher l'historique si la requête est vide ou commence par la requête
  useEffect(() => {
    setShowHistory(query.trim() === '' && history.length > 0);
  }, [query, history.length]);

  // Réinitialiser la sélection quand la requête change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [query, results]);

  // Fermer au clic extérieur
  useClickOutside(containerRef, () => {
    if (query.trim() === '') {
      onClose();
    }
  });

  // Navigation clavier
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLDivElement>) => {
    const items = showHistory ? history : results;
    const maxIndex = items.length - 1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < maxIndex ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > -1 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          if (showHistory && onHistorySelect) {
            onHistorySelect(history[selectedIndex]);
          } else {
            onSelect(results[selectedIndex]);
          }
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  // Scroll vers l'élément sélectionné
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  }, [selectedIndex]);

  if (!showHistory && (!query.trim() || (results.length === 0 && !isLoading))) {
    return null;
  }

  const ContentIcon = contentType ? CONTENT_TYPE_ICONS[contentType] : Search;

  return (
    <div
      ref={containerRef}
      className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-[400px] overflow-hidden"
      role="combobox"
      aria-expanded="true"
      aria-haspopup="listbox"
    >
      {isLoading && (
        <div className="p-4 text-center text-sm text-muted-foreground">
          Recherche en cours...
        </div>
      )}

      {showHistory && history.length > 0 && (
        <div>
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground border-b">
            Recherches récentes
          </div>
          <ul
            ref={listRef}
            role="listbox"
            className="max-h-[300px] overflow-y-auto"
            onKeyDown={handleKeyDown}
          >
            {history.map((historyItem, index) => (
              <li
                key={index}
                role="option"
                aria-selected={selectedIndex === index}
                className={cn(
                  'px-3 py-2 cursor-pointer hover:bg-accent flex items-center gap-2',
                  selectedIndex === index && 'bg-accent'
                )}
                onClick={() => onHistorySelect?.(historyItem)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="flex-1 truncate">{historyItem}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!showHistory && results.length > 0 && (
        <ul
          ref={listRef}
          role="listbox"
          className="max-h-[300px] overflow-y-auto"
          onKeyDown={handleKeyDown}
        >
          {results.slice(0, 8).map((result, index) => {
            const item = result.item;
            const title = item.title || item.name || 'Sans titre';
            const subtitle = item.subtitle || item.description || item.artist || '';
            const highlightedTitle = result.highlightedFields?.title || result.highlightedFields?.name || title;
            const highlightedSubtitle = result.highlightedFields?.subtitle || result.highlightedFields?.description || result.highlightedFields?.artist || subtitle;

            return (
              <li
                key={item.id || index}
                role="option"
                aria-selected={selectedIndex === index}
                className={cn(
                  'px-3 py-2 cursor-pointer hover:bg-accent flex items-start gap-3',
                  selectedIndex === index && 'bg-accent'
                )}
                onClick={() => onSelect(result)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <ContentIcon className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div
                    className="font-medium truncate"
                    dangerouslySetInnerHTML={{ __html: highlightedTitle }}
                  />
                  {highlightedSubtitle && (
                    <div
                      className="text-sm text-muted-foreground truncate mt-0.5"
                      dangerouslySetInnerHTML={{ __html: highlightedSubtitle }}
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!showHistory && !isLoading && results.length === 0 && query.trim() && (
        <div className="p-4 text-center text-sm text-muted-foreground">
          Aucun résultat trouvé
        </div>
      )}
    </div>
  );
}

