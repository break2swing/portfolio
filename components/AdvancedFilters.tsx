'use client';

import { useState } from 'react';
import { X, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { SortOption, FilterOptions } from '@/hooks/useFilters';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AdvancedFiltersProps {
  filters: FilterOptions;
  availableTags: string[];
  onFilterChange: <K extends keyof FilterOptions>(
    key: K,
    value: FilterOptions[K]
  ) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  resultCount: number;
  totalCount: number;
  showTags?: boolean;
  showDateRange?: boolean;
  className?: string;
}

/**
 * Composant de filtres avancés réutilisable
 * 
 * Fonctionnalités :
 * - Recherche textuelle
 * - Filtrage par tags avec multi-sélection
 * - Filtrage par plage de dates
 * - Tri par date ou titre
 * - Indicateur de résultats
 * - Réinitialisation des filtres
 */
export function AdvancedFilters({
  filters,
  availableTags,
  onFilterChange,
  onReset,
  hasActiveFilters,
  resultCount,
  totalCount,
  showTags = true,
  showDateRange = true,
  className,
}: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag];
    onFilterChange('tags', newTags);
  };

  const handleRemoveTag = (tag: string) => {
    onFilterChange(
      'tags',
      filters.tags.filter((t) => t !== tag)
    );
  };

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'date-desc', label: 'Plus récent' },
    { value: 'date-asc', label: 'Plus ancien' },
    { value: 'title-asc', label: 'Titre (A-Z)' },
    { value: 'title-desc', label: 'Titre (Z-A)' },
  ];

  return (
    <Card className={cn('mb-6', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Filtres</CardTitle>
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {filters.tags.length +
                  (filters.search ? 1 : 0) +
                  (filters.dateFrom ? 1 : 0) +
                  (filters.dateTo ? 1 : 0)}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {resultCount} / {totalCount}
            </span>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="h-8"
              >
                <X className="h-4 w-4 mr-1" />
                Réinitialiser
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Barre de recherche toujours visible */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              type="search"
              placeholder="Rechercher..."
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className="w-full"
            />
          </div>
          <Select
            value={filters.sortBy}
            onValueChange={(value) => onFilterChange('sortBy', value as SortOption)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tags sélectionnés */}
        {showTags && filters.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {filters.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:text-destructive"
                  aria-label={`Retirer le tag ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Filtres avancés (pliables) */}
        {isExpanded && (
          <>
            <Separator />

            {/* Filtrage par tags */}
            {showTags && availableTags.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={filters.tags.includes(tag) ? 'default' : 'outline'}
                      className="cursor-pointer transition-colors hover:bg-primary/80"
                      onClick={() => handleTagToggle(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Filtrage par date */}
            {showDateRange && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Date de début</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !filters.dateFrom && 'text-muted-foreground'
                        )}
                      >
                        {filters.dateFrom ? (
                          format(filters.dateFrom, 'PPP', { locale: fr })
                        ) : (
                          <span>Choisir une date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateFrom || undefined}
                        onSelect={(date) => onFilterChange('dateFrom', date || null)}
                        initialFocus
                        locale={fr}
                      />
                      {filters.dateFrom && (
                        <div className="p-3 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onFilterChange('dateFrom', null)}
                            className="w-full"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Effacer
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Date de fin</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !filters.dateTo && 'text-muted-foreground'
                        )}
                      >
                        {filters.dateTo ? (
                          format(filters.dateTo, 'PPP', { locale: fr })
                        ) : (
                          <span>Choisir une date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateTo || undefined}
                        onSelect={(date) => onFilterChange('dateTo', date || null)}
                        initialFocus
                        locale={fr}
                      />
                      {filters.dateTo && (
                        <div className="p-3 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onFilterChange('dateTo', null)}
                            className="w-full"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Effacer
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
