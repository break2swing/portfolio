'use client';

import { useState, useEffect } from 'react';
import { Playlist } from '@/lib/supabaseClient';
import { playlistService } from '@/services/playlistService';
import { useAuth } from '@/contexts/AuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Music, Edit2, Trash2, Play, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { CreatePlaylistDialog } from './CreatePlaylistDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PlaylistManagerProps {
  onSelectPlaylist?: (playlistId: string | null) => void;
  activePlaylistId?: string | null;
}

export function PlaylistManager({
  onSelectPlaylist,
  activePlaylistId,
}: PlaylistManagerProps) {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<Playlist | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      loadPlaylists();
    } else {
      setPlaylists([]);
      setLoading(false);
    }
  }, [user]);

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

  const handleCreateSuccess = () => {
    loadPlaylists();
  };

  const handleSelectPlaylist = (playlistId: string) => {
    onSelectPlaylist?.(playlistId);
  };

  const handleClearSelection = () => {
    onSelectPlaylist?.(null);
  };

  const handleDeleteClick = (playlist: Playlist) => {
    setPlaylistToDelete(playlist);
  };

  const handleDeleteConfirm = async () => {
    if (!playlistToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await playlistService.deletePlaylist(playlistToDelete.id);

      if (error) {
        throw error;
      }

      toast.success('Playlist supprimée', {
        description: `La playlist "${playlistToDelete.name}" a été supprimée`,
      });

      // Si la playlist supprimée était active, la désélectionner
      if (playlistToDelete.id === activePlaylistId) {
        handleClearSelection();
      }

      setPlaylistToDelete(null);
      loadPlaylists();
    } catch (error: any) {
      console.error('Error deleting playlist:', error);
      toast.error('Erreur', {
        description: error?.message || 'Impossible de supprimer la playlist',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSharePlaylist = (playlist: Playlist) => {
    if (!playlist.is_public) {
      toast.info('Playlist privée', {
        description: 'Rendez la playlist publique pour la partager',
      });
      return;
    }

    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/musique?playlist=${playlist.id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Lien copié', {
        description: 'Le lien de la playlist a été copié dans le presse-papiers',
      });
    });
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Connectez-vous pour créer et gérer vos playlists
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
          <p className="text-muted-foreground mt-4">Chargement des playlists...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Mes Playlists</h2>
            <p className="text-muted-foreground">
              {playlists.length === 0
                ? 'Aucune playlist'
                : `${playlists.length} playlist${playlists.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Créer une playlist
          </Button>
        </div>

        {playlists.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                Vous n'avez pas encore de playlist
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Créer votre première playlist
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {playlists.map((playlist) => {
              const isActive = playlist.id === activePlaylistId;
              return (
                <Card
                  key={playlist.id}
                  className={`cursor-pointer transition-all hover:bg-accent/50 ${
                    isActive ? 'bg-accent border-primary shadow-sm' : ''
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="truncate">{playlist.name}</CardTitle>
                        {playlist.description && (
                          <CardDescription className="mt-1 line-clamp-2">
                            {playlist.description}
                          </CardDescription>
                        )}
                      </div>
                      {playlist.is_public && (
                        <Share2 className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={isActive ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSelectPlaylist(playlist.id)}
                        className="flex-1"
                      >
                        <Play className="mr-2 h-4 w-4" />
                        {isActive ? 'Active' : 'Charger'}
                      </Button>
                      {playlist.is_public && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSharePlaylist(playlist)}
                          title="Partager la playlist"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(playlist)}
                        title="Supprimer la playlist"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {activePlaylistId && (
          <div className="mt-4">
            <Button variant="outline" onClick={handleClearSelection}>
              Revenir à la liste complète
            </Button>
          </div>
        )}
      </div>

      <CreatePlaylistDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      <AlertDialog
        open={!!playlistToDelete}
        onOpenChange={(open) => !open && setPlaylistToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la playlist ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la playlist "{playlistToDelete?.name}" ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

