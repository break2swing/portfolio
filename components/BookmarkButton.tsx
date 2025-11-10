'use client';

import { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BookmarkType } from '@/lib/bookmarks';
import { useBookmarks } from '@/hooks/useBookmarks';
import { toast } from 'sonner';

interface BookmarkButtonProps {
  type: BookmarkType;
  itemId: string;
  itemTitle?: string;
  className?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

/**
 * Bouton pour ajouter/retirer un élément des favoris
 * 
 * Fonctionnalités :
 * - Toggle favoris avec animation
 * - Feedback visuel (remplissage icône)
 * - Toast notification
 * - Optimistic UI
 */
export function BookmarkButton({
  type,
  itemId,
  itemTitle,
  className,
  variant = 'ghost',
  size = 'icon',
  showLabel = false,
}: BookmarkButtonProps) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [isAnimating, setIsAnimating] = useState(false);
  const bookmarked = isBookmarked(type, itemId);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    const newState = toggleBookmark(type, itemId);

    if (newState) {
      toast.success('Ajouté aux favoris', {
        description: itemTitle ? `${itemTitle}` : undefined,
        duration: 2000,
      });
    } else {
      toast.info('Retiré des favoris', {
        description: itemTitle ? `${itemTitle}` : undefined,
        duration: 2000,
      });
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      className={cn(
        'transition-all duration-300',
        isAnimating && 'scale-110',
        className
      )}
      aria-label={bookmarked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      aria-pressed={bookmarked}
    >
      <Bookmark
        className={cn(
          'h-4 w-4 transition-all duration-300',
          bookmarked && 'fill-current text-yellow-500',
          isAnimating && 'rotate-12'
        )}
      />
      {showLabel && (
        <span className="ml-2">
          {bookmarked ? 'Retiré' : 'Favoris'}
        </span>
      )}
    </Button>
  );
}
