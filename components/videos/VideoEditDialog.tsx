'use client';

import { useState, useEffect } from 'react';
import { Video, Tag } from '@/lib/supabaseClient';
import { videoService } from '@/services/videoService';
import { videoTagService } from '@/services/videoTagService';
import { tagService } from '@/services/tagService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { TagBadge } from '@/components/texts/TagBadge';

interface VideoEditDialogProps {
  video: Video | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function VideoEditDialog({
  video,
  open,
  onOpenChange,
  onSuccess,
}: VideoEditDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (open && video) {
      loadData();
    }
  }, [open, video]);

  const loadData = async () => {
    if (!video) return;

    setLoadingData(true);
    try {
      // Charger tous les tags disponibles
      const { tags: tgs } = await tagService.getAllTags();
      setAllTags(tgs || []);

      // Charger les tags de la vidéo
      const { tags: videoTags } = await videoTagService.getTagsForVideo(video.id);
      const tagIds = videoTags?.map(t => t.id) || [];
      setSelectedTagIds(tagIds);

      // Initialiser les champs du formulaire
      setTitle(video.title);
      setDescription(video.description || '');
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur', {
        description: 'Impossible de charger les données',
      });
    } finally {
      setLoadingData(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!video) return;

    setLoading(true);

    try {
      // Mettre à jour les informations de la vidéo
      const { error: updateError } = await videoService.updateVideo(video.id, {
        title: title.trim(),
        description: description.trim() || null,
      });

      if (updateError) throw updateError;

      // Mettre à jour les tags
      const { error: tagsError } = await videoTagService.setTagsForVideo(
        video.id,
        selectedTagIds
      );

      if (tagsError) throw tagsError;

      toast.success('Vidéo modifiée', {
        description: 'Les modifications ont été enregistrées',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating video:', error);
      toast.error('Erreur', {
        description: 'Impossible de modifier la vidéo',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!video) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier la vidéo</DialogTitle>
          <DialogDescription>
            Modifiez les informations et les tags de la vidéo
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Titre *</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                rows={3}
              />
            </div>

            {allTags.length > 0 && (
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <TagBadge
                      key={tag.id}
                      tag={tag}
                      variant={selectedTagIds.includes(tag.id) ? 'default' : 'outline'}
                      onClick={() => toggleTag(tag.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading || !title.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
