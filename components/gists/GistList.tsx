'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Gist, GistWithFiles } from '@/lib/supabaseClient';
import { gistService } from '@/services/gistService';
import { GistCard } from './GistCard';
import { useFilters } from '@/hooks/useFilters';
import { Loader2, FileCode } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load AdvancedFilters
const AdvancedFilters = dynamic(() => import('@/components/AdvancedFilters').then(mod => ({ default: mod.AdvancedFilters })), {
  loading: () => (
    <div className="w-full h-24 rounded-lg border border-border bg-card/50 animate-pulse" />
  ),
  ssr: false,
});

interface GistListProps {
  gists: Gist[];
  loading?: boolean;
}

/**
 * Liste des Gists avec filtres et recherche
 */
export function GistList({ gists, loading }: GistListProps) {
  const [gistsWithMetadata, setGistsWithMetadata] = useState<
    Array<Gist & { fileCount: number; languages: string[] }>
  >([]);
  const [loadingMetadata, setLoadingMetadata] = useState(true);

  useEffect(() => {
    const loadMetadata = async () => {
      setLoadingMetadata(true);
      const metadata = await Promise.all(
        gists.map(async (gist) => {
          const { gist: fullGist } = await gistService.getGistById(gist.id);
          if (fullGist) {
            const languages = Array.from(
              new Set(
                fullGist.files
                  .map((f) => f.language)
                  .filter((l): l is string => l !== null)
              )
            );
            return {
              ...gist,
              fileCount: fullGist.files.length,
              languages,
            };
          }
          return {
            ...gist,
            fileCount: 0,
            languages: [],
          };
        })
      );
      setGistsWithMetadata(metadata);
      setLoadingMetadata(false);
    };

    if (gists.length > 0) {
      loadMetadata();
    } else {
      setLoadingMetadata(false);
    }
  }, [gists]);

  const {
    filters,
    updateFilter,
    resetFilters,
    filteredItems: filteredGists,
    availableTags,
    hasActiveFilters,
    resultCount,
    totalCount,
  } = useFilters({
    items: gistsWithMetadata,
    searchFields: ['title', 'description'],
    dateField: 'created_at',
    tagsField: undefined,
    titleField: 'title',
  });

  if (loading || loadingMetadata) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (gists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="p-6 rounded-full bg-muted">
          <FileCode className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold">Aucun Gist disponible</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Les Gists apparaîtront ici une fois créés
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AdvancedFilters Component */}
      <AdvancedFilters
        filters={filters}
        availableTags={availableTags}
        onFilterChange={updateFilter}
        onReset={resetFilters}
        hasActiveFilters={hasActiveFilters}
        resultCount={resultCount}
        totalCount={totalCount}
        showTags={false}
        showDateRange={true}
      />

      {/* Gist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGists.map((gist) => {
          const metadata = gistsWithMetadata.find((g) => g.id === gist.id);
          return (
            <GistCard
              key={gist.id}
              gist={gist}
              fileCount={metadata?.fileCount || 0}
              languages={metadata?.languages || []}
            />
          );
        })}
      </div>
    </div>
  );
}

