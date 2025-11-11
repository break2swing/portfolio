import { supabaseClient, Playlist, PlaylistTrack, MusicTrack, PlaylistWithTracks } from '@/lib/supabaseClient';
import { cache } from '@/lib/cache';
import { serviceLogger } from '@/lib/logger';

const logger = serviceLogger.child('playlist-service');

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const playlistService = {
  /**
   * Crée une nouvelle playlist
   * @param name - Nom de la playlist
   * @param description - Description optionnelle
   * @param isPublic - Visibilité publique (défaut: false)
   */
  async createPlaylist(
    name: string,
    description?: string | null,
    isPublic: boolean = false
  ) {
    try {
      logger.info('Creating playlist', { name, isPublic });

      // Récupérer l'utilisateur connecté
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

      if (authError || !user) {
        logger.error('User not authenticated', authError);
        return {
          playlist: null,
          error: {
            message: 'Vous devez être connecté pour créer une playlist',
            code: 'NOT_AUTHENTICATED',
          } as any,
        };
      }

      // Récupérer le display_order maximum
      const { data: maxOrderData } = await supabaseClient
        .from('playlists')
        .select('display_order')
        .eq('user_id', user.id)
        .order('display_order', { ascending: false })
        .limit(1)
        .maybeSingle();

      const displayOrder = (maxOrderData?.display_order ?? -1) + 1;

      const { data, error } = await supabaseClient
        .from('playlists')
        .insert({
          name,
          description: description || null,
          user_id: user.id,
          is_public: isPublic,
          display_order: displayOrder,
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create playlist', error);
        return { playlist: null, error };
      }

      // Invalider le cache
      cache.invalidatePattern('playlists:');

      logger.debug('Playlist created successfully', { id: data.id });
      return { playlist: data as Playlist, error: null };
    } catch (error) {
      logger.error('Unexpected error creating playlist', error as Error);
      return {
        playlist: null,
        error: error as Error,
      };
    }
  },

  /**
   * Récupère toutes les playlists de l'utilisateur connecté
   */
  async getUserPlaylists() {
    try {
      const cacheKey = 'playlists:user';

      // Vérifier le cache
      const cached = cache.get<Playlist[]>(cacheKey);
      if (cached) {
        logger.debug('Playlists loaded from cache');
        return { playlists: cached, error: null };
      }

      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

      if (authError || !user) {
        logger.error('User not authenticated', authError);
        return {
          playlists: null,
          error: {
            message: 'Vous devez être connecté pour voir vos playlists',
            code: 'NOT_AUTHENTICATED',
          } as any,
        };
      }

      logger.info('Fetching user playlists');

      const { data, error } = await supabaseClient
        .from('playlists')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order', { ascending: true });

      if (error) {
        logger.error('Failed to fetch playlists', error);
        return { playlists: null, error };
      }

      // Mettre en cache
      cache.set(cacheKey, data, { ttl: CACHE_TTL });
      logger.debug('Playlists cached', { count: data.length });

      return { playlists: data as Playlist[], error: null };
    } catch (error) {
      logger.error('Unexpected error fetching playlists', error as Error);
      return {
        playlists: null,
        error: error as Error,
      };
    }
  },

  /**
   * Récupère les morceaux d'une playlist avec leurs détails complets
   * @param playlistId - ID de la playlist
   */
  async getPlaylistTracks(playlistId: string) {
    try {
      const cacheKey = `playlists:${playlistId}:tracks`;

      // Vérifier le cache
      const cached = cache.get<MusicTrack[]>(cacheKey);
      if (cached) {
        logger.debug('Playlist tracks loaded from cache');
        return { tracks: cached, error: null };
      }

      logger.info('Fetching playlist tracks', { playlistId });

      const { data, error } = await supabaseClient
        .from('playlist_tracks')
        .select(`
          *,
          track:music_tracks(*)
        `)
        .eq('playlist_id', playlistId)
        .order('display_order', { ascending: true });

      if (error) {
        logger.error('Failed to fetch playlist tracks', error);
        return { tracks: null, error };
      }

      // Extraire les tracks et les mapper correctement
      const tracks = data
        .map((pt: any) => pt.track)
        .filter(Boolean) as MusicTrack[];

      // Mettre en cache
      cache.set(cacheKey, tracks, { ttl: CACHE_TTL });
      logger.debug('Playlist tracks cached', { count: tracks.length });

      return { tracks, error: null };
    } catch (error) {
      logger.error('Unexpected error fetching playlist tracks', error as Error);
      return {
        tracks: null,
        error: error as Error,
      };
    }
  },

  /**
   * Ajoute un morceau à une playlist
   * @param playlistId - ID de la playlist
   * @param trackId - ID du morceau
   */
  async addTrackToPlaylist(playlistId: string, trackId: string) {
    try {
      logger.info('Adding track to playlist', { playlistId, trackId });

      // Récupérer le display_order maximum pour cette playlist
      const { data: maxOrderData } = await supabaseClient
        .from('playlist_tracks')
        .select('display_order')
        .eq('playlist_id', playlistId)
        .order('display_order', { ascending: false })
        .limit(1)
        .maybeSingle();

      const displayOrder = (maxOrderData?.display_order ?? -1) + 1;

      const { data, error } = await supabaseClient
        .from('playlist_tracks')
        .insert({
          playlist_id: playlistId,
          track_id: trackId,
          display_order: displayOrder,
        })
        .select()
        .single();

      if (error) {
        // Vérifier si c'est une erreur de doublon
        if (error.code === '23505') {
          logger.warn('Track already in playlist', { playlistId, trackId });
          return {
            playlistTrack: null,
            error: {
              message: 'Ce morceau est déjà dans la playlist',
              code: 'DUPLICATE_TRACK',
            } as any,
          };
        }
        logger.error('Failed to add track to playlist', error);
        return { playlistTrack: null, error };
      }

      // Invalider le cache
      cache.invalidatePattern(`playlists:${playlistId}:`);
      cache.invalidatePattern('playlists:');

      logger.debug('Track added to playlist successfully');
      return { playlistTrack: data as PlaylistTrack, error: null };
    } catch (error) {
      logger.error('Unexpected error adding track to playlist', error as Error);
      return {
        playlistTrack: null,
        error: error as Error,
      };
    }
  },

  /**
   * Retire un morceau d'une playlist
   * @param playlistId - ID de la playlist
   * @param trackId - ID du morceau
   */
  async removeTrackFromPlaylist(playlistId: string, trackId: string) {
    try {
      logger.info('Removing track from playlist', { playlistId, trackId });

      const { error } = await supabaseClient
        .from('playlist_tracks')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('track_id', trackId);

      if (error) {
        logger.error('Failed to remove track from playlist', error);
        return { error };
      }

      // Invalider le cache
      cache.invalidatePattern(`playlists:${playlistId}:`);
      cache.invalidatePattern('playlists:');

      logger.debug('Track removed from playlist successfully');
      return { error: null };
    } catch (error) {
      logger.error('Unexpected error removing track from playlist', error as Error);
      return {
        error: error as Error,
      };
    }
  },

  /**
   * Met à jour l'ordre des morceaux dans une playlist
   * @param playlistId - ID de la playlist
   * @param trackOrders - Tableau d'objets { trackId, order }
   */
  async updatePlaylistOrder(
    playlistId: string,
    trackOrders: { trackId: string; order: number }[]
  ) {
    try {
      logger.info('Updating playlist order', { playlistId, trackCount: trackOrders.length });

      // Mettre à jour chaque track individuellement
      const updates = trackOrders.map(({ trackId, order }) =>
        supabaseClient
          .from('playlist_tracks')
          .update({ display_order: order })
          .eq('playlist_id', playlistId)
          .eq('track_id', trackId)
      );

      const results = await Promise.all(updates);
      const errors = results.filter((r) => r.error).map((r) => r.error);

      if (errors.length > 0) {
        logger.error('Failed to update playlist order', errors[0]);
        return { error: errors[0] };
      }

      // Invalider le cache
      cache.invalidatePattern(`playlists:${playlistId}:`);
      cache.invalidatePattern('playlists:');

      logger.debug('Playlist order updated successfully');
      return { error: null };
    } catch (error) {
      logger.error('Unexpected error updating playlist order', error as Error);
      return {
        error: error as Error,
      };
    }
  },

  /**
   * Met à jour les métadonnées d'une playlist
   * @param playlistId - ID de la playlist
   * @param updates - Champs à mettre à jour
   */
  async updatePlaylist(playlistId: string, updates: Partial<Playlist>) {
    try {
      logger.info('Updating playlist', { playlistId });

      const { data, error } = await supabaseClient
        .from('playlists')
        .update(updates)
        .eq('id', playlistId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update playlist', error);
        return { playlist: null, error };
      }

      // Invalider le cache
      cache.invalidatePattern('playlists:');
      cache.invalidatePattern(`playlists:${playlistId}:`);

      logger.debug('Playlist updated successfully');
      return { playlist: data as Playlist, error: null };
    } catch (error) {
      logger.error('Unexpected error updating playlist', error as Error);
      return {
        playlist: null,
        error: error as Error,
      };
    }
  },

  /**
   * Supprime une playlist
   * @param playlistId - ID de la playlist
   */
  async deletePlaylist(playlistId: string) {
    try {
      logger.info('Deleting playlist', { playlistId });

      const { error } = await supabaseClient
        .from('playlists')
        .delete()
        .eq('id', playlistId);

      if (error) {
        logger.error('Failed to delete playlist', error);
        return { error };
      }

      // Invalider le cache
      cache.invalidatePattern('playlists:');
      cache.invalidatePattern(`playlists:${playlistId}:`);

      logger.debug('Playlist deleted successfully');
      return { error: null };
    } catch (error) {
      logger.error('Unexpected error deleting playlist', error as Error);
      return {
        error: error as Error,
      };
    }
  },

  /**
   * Récupère une playlist avec ses morceaux
   * @param playlistId - ID de la playlist
   */
  async getPlaylistWithTracks(playlistId: string) {
    try {
      const cacheKey = `playlists:${playlistId}:full`;

      // Vérifier le cache
      const cached = cache.get<PlaylistWithTracks>(cacheKey);
      if (cached) {
        logger.debug('Playlist with tracks loaded from cache');
        return { playlist: cached, error: null };
      }

      logger.info('Fetching playlist with tracks', { playlistId });

      // Récupérer la playlist
      const { data: playlistData, error: playlistError } = await supabaseClient
        .from('playlists')
        .select('*')
        .eq('id', playlistId)
        .single();

      if (playlistError || !playlistData) {
        logger.error('Failed to fetch playlist', playlistError);
        return { playlist: null, error: playlistError };
      }

      // Récupérer les tracks
      const { tracks, error: tracksError } = await this.getPlaylistTracks(playlistId);

      if (tracksError) {
        logger.error('Failed to fetch playlist tracks', tracksError);
        return { playlist: null, error: tracksError };
      }

      const playlistWithTracks: PlaylistWithTracks = {
        ...playlistData,
        tracks: tracks || [],
      };

      // Mettre en cache
      cache.set(cacheKey, playlistWithTracks, { ttl: CACHE_TTL });

      return { playlist: playlistWithTracks, error: null };
    } catch (error) {
      logger.error('Unexpected error fetching playlist with tracks', error as Error);
      return {
        playlist: null,
        error: error as Error,
      };
    }
  },
};

