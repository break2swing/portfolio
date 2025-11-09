'use client';

import { useState, useEffect } from 'react';
import { MusicTrack, Tag } from '@/lib/supabaseClient';
import { musicService } from '@/services/musicService';
import { musicTagService } from '@/services/musicTagService';
import { tagService } from '@/services/tagService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface TrackEditDialogProps {
  track: MusicTrack | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TrackEditDialog({
  track,
  open,
  onOpenChange,
  onSuccess,
}: TrackEditDialogProps) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (open && track) {
      loadData();
    }
  }, [open, track]);

  const loadData = async () => {
    if (!track) return;

    setLoadingData(true);
    try {
      // Charger tous les tags disponibles
      const { tags: tgs } = await tagService.getAllTags();
      setAllTags(tgs || []);

      // Charger les tags du morceau (optionnel - peut échouer si la table n'existe pas)
      const { tags: trackTags, error: tagsLoadError } = await musicTagService.getTagsForMusicTrack(track.id);
      
      if (tagsLoadError) {
        // Si l'erreur est que la table n'existe pas, on continue avec une liste vide
        if (tagsLoadError.code === 'PGRST205' || tagsLoadError.message?.includes('Could not find the table')) {
          console.warn('[TRACK EDIT] Table music_tags does not exist - using empty tag list');
        } else {
          console.warn('[TRACK EDIT] Could not load tags:', tagsLoadError);
        }
        setSelectedTagIds([]);
      } else {
        const tagIds = trackTags?.map(t => t.id) || [];
        setSelectedTagIds(tagIds);
      }

      // Initialiser les champs du formulaire
      setTitle(track.title);
      setArtist(track.artist || '');
      setAlbum(track.album || '');
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
    if (!track) return;

    setLoading(true);

    try {
      console.log('[TRACK EDIT] Starting update for track:', track.id);
      console.log('[TRACK EDIT] Update data:', {
        title: title.trim(),
        artist: artist.trim() || null,
        album: album.trim() || null,
      });

      // Mettre à jour les informations du morceau
      const { error: updateError } = await musicService.updateTrack(track.id, {
        title: title.trim(),
        artist: artist.trim() || null,
        album: album.trim() || null,
      });

      if (updateError) {
        console.error('[TRACK EDIT] Update error:', updateError);
        console.error('[TRACK EDIT] Error details:', JSON.stringify(updateError, null, 2));
        throw updateError;
      }

      console.log('[TRACK EDIT] Track updated successfully');

      // Mettre à jour les tags (optionnel - ne pas faire échouer si la table n'existe pas)
      console.log('[TRACK EDIT] Updating tags:', selectedTagIds);
      const { error: tagsError } = await musicTagService.setTagsForMusicTrack(
        track.id,
        selectedTagIds
      );

      if (tagsError) {
        console.error('[TRACK EDIT] Tags error:', tagsError);
        console.error('[TRACK EDIT] Tags error details:', JSON.stringify(tagsError, null, 2));
        
        // Si l'erreur est que la table n'existe pas, on continue quand même
        if (tagsError.code === 'PGRST205' || tagsError.message?.includes('Could not find the table')) {
          console.warn('[TRACK EDIT] Table music_tags does not exist - skipping tag update');
          toast.warning('Tags non mis à jour', {
            description: 'La table des tags n\'existe pas encore. Le morceau a été modifié mais les tags n\'ont pas pu être mis à jour.',
          });
        } else {
          // Pour les autres erreurs, on affiche un avertissement mais on continue
          console.warn('[TRACK EDIT] Tag update failed but continuing:', tagsError);
          toast.warning('Tags non mis à jour', {
            description: 'Le morceau a été modifié mais les tags n\'ont pas pu être mis à jour.',
          });
        }
      } else {
        console.log('[TRACK EDIT] Tags updated successfully');
      }

      toast.success('Morceau modifié', {
        description: 'Les modifications ont été enregistrées',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('[TRACK EDIT] Error updating track:', error);
      console.error('[TRACK EDIT] Error type:', typeof error);
      console.error('[TRACK EDIT] Error constructor:', error?.constructor?.name);
      console.error('[TRACK EDIT] Full error object:', JSON.stringify(error, null, 2));

      let errorMessage = 'Impossible de modifier le morceau';
      let errorDetails = '';

      if (error?.message) {
        errorMessage = error.message;
      }

      if (error?.code) {
        errorDetails = `Code: ${error.code}`;
      }

      if (error?.statusCode) {
        errorDetails += errorDetails ? ` | Status: ${error.statusCode}` : `Status: ${error.statusCode}`;
      }

      if (error?.hint) {
        errorDetails += errorDetails ? ` | ${error.hint}` : error.hint;
      }

      if (error?.details) {
        errorDetails += errorDetails ? ` | Détails: ${JSON.stringify(error.details)}` : `Détails: ${JSON.stringify(error.details)}`;
      }

      toast.error('Erreur', {
        description: errorDetails ? `${errorMessage}\n${errorDetails}` : errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!track) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le morceau</DialogTitle>
          <DialogDescription>
            Modifiez les informations et les tags du morceau
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
              <Label htmlFor="edit-artist">Artiste</Label>
              <Input
                id="edit-artist"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-album">Album</Label>
              <Input
                id="edit-album"
                value={album}
                onChange={(e) => setAlbum(e.target.value)}
                disabled={loading}
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
