'use client';

import { useState, useEffect } from 'react';
import { Repository } from '@/lib/supabaseClient';
import { repositoryService } from '@/services/repositoryService';
import { RepositoryCard } from './RepositoryCard';
import { AdvancedFilters } from '@/components/AdvancedFilters';
import { useFilters } from '@/hooks/useFilters';
import { Loader2, Code } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface RepositoryListProps {
  repositories: Repository[];
  loading?: boolean;
}

/**
 * Liste des dépôts avec filtres et recherche
 */
export function RepositoryList({ repositories, loading }: RepositoryListProps) {
  const {
    filters,
    updateFilter,
    resetFilters,
    filteredItems: filteredRepositories,
    availableTags,
    hasActiveFilters,
    resultCount,
    totalCount,
  } = useFilters({
    items: repositories,
    searchFields: ['name', 'description', 'language'],
    dateField: 'created_at',
    tagsField: undefined, // Pas de tags pour les dépôts pour l'instant
    titleField: 'name',
  });

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (repositories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="p-6 rounded-full bg-muted">
          <Code className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold">Aucun dépôt disponible</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Les dépôts de code apparaîtront ici une fois ajoutés
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

      {/* Repository Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRepositories.map((repository) => (
          <RepositoryCard
            key={repository.id}
            repository={repository}
          />
        ))}
      </div>

      {filteredRepositories.length === 0 && hasActiveFilters && (
        <div className="text-center py-8 text-muted-foreground">
          Aucun dépôt ne correspond aux filtres sélectionnés
        </div>
      )}
    </div>
  );
}

