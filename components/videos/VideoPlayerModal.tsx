'use client';

import { Video } from '@/lib/supabaseClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface VideoPlayerModalProps {
  video: Video | null;
  open: boolean;
  onClose: () => void;
}

export function VideoPlayerModal({ video, open, onClose }: VideoPlayerModalProps) {
  if (!video) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{video.title}</DialogTitle>
          {video.description && (
            <DialogDescription>{video.description}</DialogDescription>
          )}
        </DialogHeader>
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <video
            src={video.video_url}
            controls
            autoPlay
            className="w-full h-full"
          >
            Votre navigateur ne supporte pas la lecture de vidéos.
          </video>
        </div>
      </DialogContent>
    </Dialog>
  );
}
