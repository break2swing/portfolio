'use client';

import { Text } from '@/lib/supabaseClient';
import dynamic from 'next/dynamic';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { ShareButton } from '@/components/ShareButton';

// Lazy load MarkdownRenderer
const MarkdownRenderer = dynamic(() => import('./MarkdownRenderer').then(mod => ({ default: mod.MarkdownRenderer })), {
  loading: () => <Skeleton className="h-64 w-full" />,
  ssr: false,
});

interface TextDetailModalProps {
  text: Text | null;
  open: boolean;
  onClose: () => void;
}

export function TextDetailModal({ text, open, onClose }: TextDetailModalProps) {
  if (!text) return null;

  const publishedDate = text.published_date
    ? format(new Date(text.published_date), 'dd MMMM yyyy', { locale: fr })
    : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl">{text.title}</DialogTitle>
              {text.subtitle && (
                <DialogDescription className="text-lg">
                  {text.subtitle}
                </DialogDescription>
              )}
            </div>
            <ShareButton
              url={`${typeof window !== 'undefined' ? window.location.origin : ''}/textes#text-${text.id}`}
              title={text.title}
              description={text.excerpt || text.subtitle || text.title}
              type="text"
              variant="ghost"
              size="icon"
            />
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
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
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
          <MarkdownRenderer content={text.content} />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
