'use client';

import { memo } from 'react';
import { Text } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { highlightText } from '@/lib/search';
import { BookmarkButton } from '@/components/BookmarkButton';

interface TextCardProps {
  text: Text;
  onClick?: () => void;
  highlightQuery?: string;
}

export const TextCard = memo(function TextCard({ text, onClick, highlightQuery }: TextCardProps) {
  const publishedDate = text.published_date
    ? format(new Date(text.published_date), 'dd MMMM yyyy', { locale: fr })
    : null;

  const highlightedTitle = highlightQuery ? highlightText(text.title, highlightQuery) : text.title;
  const highlightedSubtitle = highlightQuery && text.subtitle ? highlightText(text.subtitle, highlightQuery) : text.subtitle;
  const highlightedExcerpt = highlightQuery && text.excerpt ? highlightText(text.excerpt, highlightQuery) : text.excerpt;

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow relative group"
      onClick={onClick}
    >
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <BookmarkButton
          type="text"
          itemId={text.id}
          itemTitle={text.title}
        />
      </div>
      
      <CardHeader>
        <CardTitle
          className="line-clamp-2 pr-8"
          dangerouslySetInnerHTML={highlightQuery ? { __html: highlightedTitle } : undefined}
        >
          {!highlightQuery && text.title}
        </CardTitle>
        {text.subtitle && (
          <CardDescription
            className="text-base line-clamp-1"
            dangerouslySetInnerHTML={highlightQuery ? { __html: highlightedSubtitle } : undefined}
          >
            {!highlightQuery && text.subtitle}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {text.excerpt && (
          <p
            className="text-muted-foreground line-clamp-3"
            dangerouslySetInnerHTML={highlightQuery ? { __html: highlightedExcerpt } : undefined}
          >
            {!highlightQuery && text.excerpt}
          </p>
        )}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {text.author && (
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{text.author}</span>
            </div>
          )}
          {publishedDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{publishedDate}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
