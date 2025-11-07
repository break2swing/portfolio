'use client';

import { Tag } from '@/lib/supabaseClient';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface TagBadgeProps {
  tag: Tag;
  className?: string;
  onClick?: () => void;
  onRemove?: () => void;
  variant?: 'default' | 'outline' | 'secondary';
}

export function TagBadge({
  tag,
  className = '',
  onClick,
  onRemove,
  variant = 'secondary',
}: TagBadgeProps) {
  const style = variant === 'outline' ? {
    borderColor: tag.color,
    color: tag.color,
  } : {
    backgroundColor: tag.color,
    color: '#ffffff',
  };

  return (
    <Badge
      variant={variant}
      className={`cursor-pointer hover:opacity-80 transition-opacity ${className} ${onRemove ? 'pr-1' : ''}`}
      style={style}
      onClick={onClick}
    >
      <span>{tag.name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:bg-white/20 rounded-full p-0.5"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  );
}
