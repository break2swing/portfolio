'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cache } from '@/lib/cache';

interface RefreshButtonProps {
  onRefresh?: () => void | Promise<void>;
  cachePattern?: string;
  label?: string;
}

/**
 * Composant bouton de rafraîchissement pour invalider le cache et recharger les données
 */
export function RefreshButton({ onRefresh, cachePattern, label = 'Rafraîchir' }: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      // Invalider le cache si un pattern est fourni
      if (cachePattern) {
        cache.invalidatePattern(cachePattern);
      } else {
        // Sinon, vider tout le cache
        cache.clear();
      }
      
      // Appeler la fonction de refresh si fournie
      if (onRefresh) {
        await onRefresh();
      }
      
      toast.success('Données rafraîchies', {
        description: 'Le cache a été invalidé et les données ont été rechargées',
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Erreur', {
        description: 'Impossible de rafraîchir les données',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={isRefreshing}
      aria-label={label}
    >
      {isRefreshing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Rafraîchissement...
        </>
      ) : (
        <>
          <RotateCcw className="mr-2 h-4 w-4" />
          {label}
        </>
      )}
    </Button>
  );
}

