'use client';

import { Text } from '@/lib/supabaseClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';

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
          <DialogTitle className="text-2xl">{text.title}</DialogTitle>
          {text.subtitle && (
            <DialogDescription className="text-lg">
              {text.subtitle}
            </DialogDescription>
          )}
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
