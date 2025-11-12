'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { TextWithMetadata, Category, Tag } from '@/lib/supabaseClient';
import { textService } from '@/services/textService';
import { categoryService } from '@/services/categoryService';
import { tagService } from '@/services/tagService';
import { CategoryBadge } from '@/components/texts/CategoryBadge';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useFilters } from '@/hooks/useFilters';

// Lazy load AdvancedFilters
const AdvancedFilters = dynamic(() => import('@/components/AdvancedFilters').then(mod => ({ default: mod.AdvancedFilters })), {
  loading: () => (
    <div className="w-full h-24 rounded-lg border border-border bg-card/50 animate-pulse" />
  ),
  ssr: false,
});

// Lazy load TextDetailModal
const TextDetailModal = dynamic(() => import('@/components/texts/TextDetailModal').then(mod => ({ default: mod.TextDetailModal })), {
  loading: () => <Skeleton className="h-[90vh] w-full" />,
  ssr: false,
});

// Lazy load VirtualizedTextList (uses @tanstack/react-virtual which can cause webpack issues)
const VirtualizedTextList = dynamic(() => import('@/components/texts/VirtualizedTextList').then(mod => ({ default: mod.VirtualizedTextList })), {
  loading: () => (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Chargement de la liste...</p>
      </div>
    </div>
  ),
  ssr: false,
});

// Lazy load TextCard (uses date-fns/locale which can cause webpack issues)
const TextCard = dynamic(() => import('@/components/texts/TextCard').then(mod => ({ default: mod.TextCard })), {
  ssr: false,
});

export default function TextesPage() {
  const [allTexts, setAllTexts] = useState<TextWithMetadata[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedText, setSelectedText] = useState<TextWithMetadata | null>(null);

  // Filters avec le hook useFilters
  const {
    filters,
    updateFilter,
    resetFilters,
    filteredItems: filteredTexts,
    availableTags,
    hasActiveFilters,
    resultCount,
    totalCount,
  } = useFilters({
    items: allTexts,
    searchFields: ['title', 'subtitle', 'excerpt', 'content'],
    dateField: 'published_date',
    tagsField: 'tags',
    titleField: 'title',
  });

  // Legacy filters pour compatibilité avec l'interface existante
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const applyFilters = useMemo(() => {
    let result = filteredTexts;

    // Filter by category (additional filter not in useFilters)
    if (selectedCategoryId) {
      result = result.filter((text) => text.category_id === selectedCategoryId);
    }

    return result;
  }, [filteredTexts, selectedCategoryId]);

  const finalFilteredTexts = applyFilters;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ texts: textsData }, { categories: catsData }, { tags: tagsData }] = await Promise.all([
        textService.getPublishedTexts(),
        categoryService.getAllCategories(),
        tagService.getAllTagsUsedInTexts(),
      ]);

      setAllTexts(textsData || []);
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

  const clearFilters = () => {
    setSelectedCategoryId(null);
    resetFilters();
  };

  const hasActiveLegacyFilters = selectedCategoryId || hasActiveFilters;

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

      {/* AdvancedFilters Component */}
      <AdvancedFilters
        filters={filters}
        availableTags={availableTags}
        onFilterChange={updateFilter}
        onReset={resetFilters}
        hasActiveFilters={hasActiveFilters}
        resultCount={resultCount}
        totalCount={totalCount}
        showTags={true}
        showDateRange={true}
      />

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

      {/* Clear All Filters Button */}
      {hasActiveLegacyFilters && (
        <Button variant="outline" size="sm" onClick={clearFilters}>
          <X className="mr-2 h-4 w-4" />
          Effacer tous les filtres
        </Button>
      )}

      {/* Texts Grid */}
      {finalFilteredTexts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Aucun texte ne correspond à vos critères de recherche
          </p>
        </div>
      ) : finalFilteredTexts.length > 50 ? (
        <VirtualizedTextList
          texts={finalFilteredTexts}
          onTextClick={setSelectedText}
        />
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {finalFilteredTexts.map((text) => (
            <TextCard
              key={text.id}
              text={text}
              onClick={() => setSelectedText(text)}
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
