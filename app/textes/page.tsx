'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { TextWithMetadata, Category, Tag } from '@/lib/supabaseClient';
import { textService } from '@/services/textService';
import { categoryService } from '@/services/categoryService';
import { tagService } from '@/services/tagService';
import { TextCard } from '@/components/texts/TextCard';
import { VirtualizedTextList } from '@/components/texts/VirtualizedTextList';
import { CategoryBadge } from '@/components/texts/CategoryBadge';
import { TagBadge } from '@/components/texts/TagBadge';
import { SearchSuggestions } from '@/components/texts/SearchSuggestions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, FileText, Search, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/useDebounce';
import { searchInCollection, SearchResult } from '@/lib/search';
import { saveSearchQuery } from '@/lib/searchHistory';

// Lazy load TextDetailModal
const TextDetailModal = dynamic(() => import('@/components/texts/TextDetailModal').then(mod => ({ default: mod.TextDetailModal })), {
  loading: () => <Skeleton className="h-[90vh] w-full" />,
  ssr: false,
});

export default function TextesPage() {
  const [allTexts, setAllTexts] = useState<TextWithMetadata[]>([]);
  const [filteredTexts, setFilteredTexts] = useState<TextWithMetadata[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedText, setSelectedText] = useState<TextWithMetadata | null>(null);

  // Filters
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Recherche fuzzy avec highlighting
  const searchResultsMemo = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return [];
    }

    const textsToSearch = allTexts.filter((text) => {
      // Appliquer les filtres de catégorie et tags avant la recherche
      if (selectedCategoryId && text.category_id !== selectedCategoryId) {
        return false;
      }
      if (selectedTagIds.length > 0) {
        if (!selectedTagIds.every((tagId) => text.tags?.some((tag) => tag.id === tagId))) {
          return false;
        }
      }
      return true;
    });

    return searchInCollection(
      textsToSearch,
      debouncedSearchQuery,
      [
        { field: 'title', weight: 3 },
        { field: 'subtitle', weight: 2 },
        { field: 'excerpt', weight: 2 },
        { field: 'content', weight: 1 },
      ],
      {
        fuzzy: true,
        threshold: 0.7,
        highlight: true,
        sortByRelevance: true,
        maxResults: 8,
      }
    );
  }, [allTexts, debouncedSearchQuery, selectedCategoryId, selectedTagIds]);

  // Mettre à jour les résultats de recherche pour les suggestions
  useEffect(() => {
    setSearchResults(searchResultsMemo);
    setShowSuggestions(searchQuery.trim().length > 0 && searchResultsMemo.length > 0);
  }, [searchResultsMemo, searchQuery]);

  const applyFilters = useMemo(() => {
    let result = [...allTexts];

    // Filter by category
    if (selectedCategoryId) {
      result = result.filter((text) => text.category_id === selectedCategoryId);
    }

    // Filter by tags (AND logic: text must have ALL selected tags)
    if (selectedTagIds.length > 0) {
      result = result.filter((text) =>
        selectedTagIds.every((tagId) =>
          text.tags?.some((tag) => tag.id === tagId)
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
          { field: 'subtitle', weight: 2 },
          { field: 'excerpt', weight: 2 },
          { field: 'content', weight: 1 },
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
  }, [allTexts, selectedCategoryId, selectedTagIds, debouncedSearchQuery]);

  useEffect(() => {
    setFilteredTexts(applyFilters);
  }, [applyFilters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ texts: textsData }, { categories: catsData }, { tags: tagsData }] = await Promise.all([
        textService.getPublishedTexts(),
        categoryService.getAllCategories(),
        tagService.getAllTagsUsedInTexts(),
      ]);

      setAllTexts(textsData || []);
      setFilteredTexts(textsData || []);
      setCategories(catsData || []);
      setTags(tagsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryId(selectedCategoryId === categoryId ? null : categoryId);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const clearFilters = () => {
    setSelectedCategoryId(null);
    setSelectedTagIds([]);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleSearchSelect = (result: SearchResult) => {
    const text = result.item as TextWithMetadata;
    setSelectedText(text);
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

  const hasActiveFilters = selectedCategoryId || selectedTagIds.length > 0 || searchQuery.trim();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Chargement des textes...</p>
        </div>
      </div>
    );
  }

  if (allTexts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="p-6 rounded-full bg-muted">
          <FileText className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-bold">Textes</h1>
        <p className="text-xl text-muted-foreground text-center max-w-md">
          Aucun texte disponible
        </p>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Les textes apparaîtront ici une fois publiés
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Textes</h1>
        <p className="text-muted-foreground">Mes écrits et articles</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
        <Input
          ref={searchInputRef}
          placeholder="Rechercher un texte..."
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
            contentType="texts"
            onHistorySelect={handleHistorySelect}
          />
        )}
      </div>

      {/* Category Filters */}
      {categories.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Catégories</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <CategoryBadge
                key={category.id}
                category={category}
                onClick={() => toggleCategory(category.id)}
                className={
                  selectedCategoryId === category.id
                    ? 'ring-2 ring-foreground ring-offset-2'
                    : 'opacity-60 hover:opacity-100'
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Tag Filters */}
      {tags.length > 0 && (
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
        {filteredTexts.length} {filteredTexts.length > 1 ? 'textes' : 'texte'}
        {hasActiveFilters && ` sur ${allTexts.length}`}
      </p>

      {/* Texts Grid */}
      {filteredTexts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Aucun texte ne correspond à vos critères de recherche
          </p>
        </div>
      ) : filteredTexts.length > 50 ? (
        <VirtualizedTextList
          texts={filteredTexts}
          onTextClick={setSelectedText}
        />
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTexts.map((text) => (
            <TextCard
              key={text.id}
              text={text}
              onClick={() => setSelectedText(text)}
              highlightQuery={debouncedSearchQuery.trim() || undefined}
            />
          ))}
        </div>
      )}

      <TextDetailModal
        text={selectedText}
        open={selectedText !== null}
        onClose={() => setSelectedText(null)}
      />
    </div>
  );
}
