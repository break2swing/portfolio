'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { playlistService } from '@/services/playlistService';
import { Playlist, MusicTrack } from '@/lib/supabaseClient';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Loader2, ListPlus, Plus, Music } from 'lucide-react';
import { toast } from 'sonner';
import { CreatePlaylistDialog } from './CreatePlaylistDialog';

interface AddToPlaylistMenuProps {
  track: MusicTrack;
  onSuccess?: () => void;
}

export function AddToPlaylistMenu({ track, onSuccess }: AddToPlaylistMenuProps) {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newlyCreatedPlaylistId, setNewlyCreatedPlaylistId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadPlaylists();
    }
  }, [user]);

  // Ajouter automatiquement le morceau à la nouvelle playlist après création
  useEffect(() => {
    if (newlyCreatedPlaylistId) {
      handleAddToPlaylist(newlyCreatedPlaylistId);
      setNewlyCreatedPlaylistId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newlyCreatedPlaylistId]);

  const loadPlaylists = async () => {
    setLoading(true);
    try {
      const { playlists: playlistsData, error } = await playlistService.getUserPlaylists();

      if (error) {
        throw error;
      }

      setPlaylists(playlistsData || []);
    } catch (error: any) {
      console.error('Error loading playlists:', error);
      toast.error('Erreur', {
        description: 'Impossible de charger les playlists',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    setIsAdding(playlistId);

    try {
      const { error } = await playlistService.addTrackToPlaylist(playlistId, track.id);

      if (error) {
        // Vérifier si c'est une erreur de doublon
        if (error.code === '23505' || error.code === 'DUPLICATE_TRACK') {
          const playlist = playlists.find((p) => p.id === playlistId);
          toast.info('Morceau déjà présent', {
            description: `Ce morceau est déjà dans la playlist "${playlist?.name || 'cette playlist'}"`,
          });
        } else {
          throw error;
        }
        return;
      }

      const playlist = playlists.find((p) => p.id === playlistId);
      toast.success('Morceau ajouté', {
        description: `Le morceau a été ajouté à la playlist "${playlist?.name || 'la playlist'}"`,
      });

      onSuccess?.();
    } catch (error: any) {
      console.error('Error adding track to playlist:', error);
      toast.error('Erreur', {
        description: error?.message || 'Impossible d\'ajouter le morceau à la playlist',
      });
    } finally {
      setIsAdding(null);
    }
  };

  const handleCreatePlaylistSuccess = async (createdPlaylistId?: string) => {
    // Rafraîchir la liste des playlists d'abord
    await loadPlaylists();

    // Si une playlist a été créée, ajouter le morceau automatiquement
    if (createdPlaylistId) {
      // Attendre un peu pour que la liste soit mise à jour
      setTimeout(() => {
        setNewlyCreatedPlaylistId(createdPlaylistId);
      }, 100);
    }
  };

  // Ne pas afficher le menu si l'utilisateur n'est pas authentifié
  if (!user) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Ajouter ${track.title} à une playlist`}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <ListPlus className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ajouter à une playlist</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Ajouter à une playlist</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {loading ? (
            <DropdownMenuItem disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Chargement...</span>
            </DropdownMenuItem>
          ) : playlists.length === 0 ? (
            <>
              <DropdownMenuItem disabled className="text-muted-foreground">
                <Music className="mr-2 h-4 w-4" />
                <span>Aucune playlist</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCreateDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                <span>Créer une nouvelle playlist</span>
              </DropdownMenuItem>
            </>
          ) : (
            <>
              {playlists.map((playlist) => (
                <DropdownMenuItem
                  key={playlist.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToPlaylist(playlist.id);
                  }}
                  disabled={isAdding === playlist.id}
                >
                  {isAdding === playlist.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Music className="mr-2 h-4 w-4" />
                  )}
                  <span className="truncate">{playlist.name}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCreateDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                <span>Créer une nouvelle playlist</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <CreatePlaylistDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreatePlaylistSuccess}
      />
    </>
  );
}

