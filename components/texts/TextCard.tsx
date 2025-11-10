'use client';

import { memo } from 'react';
import { Text } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TextCardProps {
  text: Text;
  onClick?: () => void;
}

export const TextCard = memo(function TextCard({ text, onClick }: TextCardProps) {
  const publishedDate = text.published_date
    ? format(new Date(text.published_date), 'dd MMMM yyyy', { locale: fr })
    : null;

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <CardHeader>
        <CardTitle className="line-clamp-2">{text.title}</CardTitle>
        {text.subtitle && (
          <CardDescription className="text-base line-clamp-1">
            {text.subtitle}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {text.excerpt && (
          <p className="text-muted-foreground line-clamp-3">
            {text.excerpt}
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
