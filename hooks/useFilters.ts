'use client';

import { useState, useMemo, useCallback } from 'react';

export type SortOption = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc';

export interface FilterOptions {
  search: string;
  tags: string[];
  dateFrom: Date | null;
  dateTo: Date | null;
  sortBy: SortOption;
}

interface UseFiltersOptions<T> {
  items: T[];
  searchFields: (keyof T)[];
  dateField?: keyof T;
  tagsField?: keyof T;
  titleField?: keyof T;
}

/**
 * Hook personnalisé pour gérer le filtrage et le tri d'items
 * 
 * @param items - Liste des items à filtrer
 * @param searchFields - Champs utilisés pour la recherche textuelle
 * @param dateField - Champ utilisé pour le filtrage par date
 * @param tagsField - Champ contenant les tags
 * @param titleField - Champ utilisé pour le tri par titre
 */
export function useFilters<T extends Record<string, any>>({
  items,
  searchFields,
  dateField,
  tagsField,
  titleField,
}: UseFiltersOptions<T>) {
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    tags: [],
    dateFrom: null,
    dateTo: null,
    sortBy: 'date-desc',
  });

  const updateFilter = useCallback(
    <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      tags: [],
      dateFrom: null,
      dateTo: null,
      sortBy: 'date-desc',
    });
  }, []);

  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    // Filtrage par recherche textuelle
    if (filters.search.trim()) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter((item) =>
        searchFields.some((field) => {
          const value = item[field];
          return value && String(value).toLowerCase().includes(searchLower);
        })
      );
    }

    // Filtrage par tags
    if (filters.tags.length > 0 && tagsField) {
      result = result.filter((item) => {
        const itemTags = item[tagsField];
        if (!Array.isArray(itemTags)) return false;
        
        return filters.tags.every((filterTag) =>
          itemTags.some((itemTag: any) => {
            if (typeof itemTag === 'object' && itemTag !== null) {
              return itemTag.tag?.name === filterTag || itemTag.name === filterTag;
            }
            return itemTag === filterTag;
          })
        );
      });
    }

    // Filtrage par date
    if (dateField && (filters.dateFrom || filters.dateTo)) {
      result = result.filter((item) => {
        const itemDate = item[dateField];
        if (!itemDate) return false;
        
        const date = new Date(itemDate);
        
        if (filters.dateFrom && date < filters.dateFrom) return false;
        if (filters.dateTo && date > filters.dateTo) return false;
        
        return true;
      });
    }

    // Tri
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'date-desc':
          if (!dateField) return 0;
          return new Date(b[dateField]).getTime() - new Date(a[dateField]).getTime();
        
        case 'date-asc':
          if (!dateField) return 0;
          return new Date(a[dateField]).getTime() - new Date(b[dateField]).getTime();
        
        case 'title-asc':
          if (!titleField) return 0;
          return String(a[titleField] || '').localeCompare(String(b[titleField] || ''));
        
        case 'title-desc':
          if (!titleField) return 0;
          return String(b[titleField] || '').localeCompare(String(a[titleField] || ''));
        
        default:
          return 0;
      }
    });

    return result;
  }, [items, filters, searchFields, dateField, tagsField, titleField]);

  const availableTags = useMemo(() => {
    if (!tagsField) return [];
    
    const tagsSet = new Set<string>();
    items.forEach((item) => {
      const itemTags = item[tagsField];
      if (Array.isArray(itemTags)) {
        itemTags.forEach((tag: any) => {
          if (typeof tag === 'object' && tag !== null) {
            const tagName = tag.tag?.name || tag.name;
            if (tagName) tagsSet.add(tagName);
          } else if (typeof tag === 'string') {
            tagsSet.add(tag);
          }
        });
      }
    });
    
    return Array.from(tagsSet).sort();
  }, [items, tagsField]);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search.trim() !== '' ||
      filters.tags.length > 0 ||
      filters.dateFrom !== null ||
      filters.dateTo !== null
    );
  }, [filters]);

  return {
    filters,
    updateFilter,
    resetFilters,
    filteredItems: filteredAndSortedItems,
    availableTags,
    hasActiveFilters,
    resultCount: filteredAndSortedItems.length,
    totalCount: items.length,
  };
}
