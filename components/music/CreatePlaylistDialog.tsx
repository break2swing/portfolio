'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { playlistService } from '@/services/playlistService';
import { createPlaylistSchema, type CreatePlaylistFormData } from '@/lib/validators';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface CreatePlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (playlistId?: string) => void;
}

export function CreatePlaylistDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreatePlaylistDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreatePlaylistFormData>({
    resolver: zodResolver(createPlaylistSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      description: null,
      is_public: false,
    },
  });

  const handleSubmit = async (data: CreatePlaylistFormData) => {
    setIsSubmitting(true);

    try {
      const { playlist, error } = await playlistService.createPlaylist(
        data.name,
        data.description || null,
        data.is_public
      );

      if (error) {
        throw error;
      }

      toast.success('Playlist créée', {
        description: `La playlist "${data.name}" a été créée avec succès`,
      });

      form.reset();
      onOpenChange(false);
      onSuccess?.(playlist?.id);
    } catch (error: any) {
      console.error('Error creating playlist:', error);
      toast.error('Erreur', {
        description:
          error?.message || 'Impossible de créer la playlist. Veuillez réessayer.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer une playlist</DialogTitle>
          <DialogDescription>
            Créez une nouvelle playlist pour organiser vos morceaux favoris.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de la playlist</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ma playlist"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Le nom de votre playlist (requis, max 100 caractères)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Description de la playlist..."
                      {...field}
                      value={field.value || ''}
                      disabled={isSubmitting}
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    Une description pour votre playlist (max 500 caractères)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_public"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Rendre la playlist publique</FormLabel>
                    <FormDescription>
                      Les playlists publiques peuvent être partagées et vues par tous
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Créer la playlist
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

