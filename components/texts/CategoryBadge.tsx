'use client';

import { Category } from '@/lib/supabaseClient';
import { Badge } from '@/components/ui/badge';

interface CategoryBadgeProps {
  category: Category;
  className?: string;
  onClick?: () => void;
}

export function CategoryBadge({ category, className = '', onClick }: CategoryBadgeProps) {
  const style = {
    backgroundColor: `hsl(${category.color})`,
    borderColor: `hsl(${category.color})`,
  };

  return (
    <Badge
      variant="outline"
      className={`cursor-pointer hover:opacity-80 transition-opacity ${className}`}
      style={style}
      onClick={onClick}
    >
      {category.name}
    </Badge>
  );
}
