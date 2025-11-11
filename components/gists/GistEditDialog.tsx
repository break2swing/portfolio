'use client';

import { useState, useEffect } from 'react';
import { Gist, GistWithFiles } from '@/lib/supabaseClient';
import { gistService } from '@/services/gistService';
import { GistForm } from './GistForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface GistEditDialogProps {
  gist: Gist;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function GistEditDialog({ gist, open, onOpenChange, onSuccess }: GistEditDialogProps) {
  const [gistData, setGistData] = useState<GistWithFiles | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && gist) {
      loadGistData();
    } else {
      setGistData(null);
      setLoading(true);
    }
  }, [open, gist]);

  const loadGistData = async () => {
    setLoading(true);
    try {
      const { gist: fullGist, error } = await gistService.getGistById(gist.id);

      if (error) {
        throw error;
      }

      if (!fullGist) {
        throw new Error('Gist non trouvé');
      }

      setGistData(fullGist);
    } catch (error: any) {
      console.error('Error loading gist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Éditer le Gist</DialogTitle>
          <DialogDescription>
            Modifiez les informations et fichiers du Gist
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Chargement...</p>
            </div>
          </div>
        ) : gistData ? (
          <GistForm
            initialData={{
              id: gistData.id,
              title: gistData.title,
              description: gistData.description,
              is_public: gistData.is_public,
              files: gistData.files.map((f) => ({
                id: f.id,
                filename: f.filename,
                content: f.content,
                language: f.language,
              })),
            }}
            onSuccess={handleSuccess}
            onCancel={() => onOpenChange(false)}
          />
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>Erreur lors du chargement du Gist</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

