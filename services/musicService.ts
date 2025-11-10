import { supabaseClient, MusicTrack, MusicTrackWithTags } from '@/lib/supabaseClient';
import { musicTagService } from './musicTagService';
import { cache } from '@/lib/cache';
import { validateMediaUrl } from '@/lib/urlValidation';
import { checkRateLimit } from '@/lib/rateLimiter';

export const musicService = {
  async getAllTracks() {
    const { data, error } = await supabaseClient
      .from('music_tracks')
      .select('*')
      .order('display_order', { ascending: true });

    return { tracks: data as MusicTrack[] | null, error };
  },

  async getAllTracksWithTags() {
    const CACHE_KEY = 'music:all-with-tags';
    const TTL = 5 * 60 * 1000; // 5 minutes

    // Vérifier le cache
    const cached = cache.get<{ tracks: MusicTrackWithTags[]; error: null }>(CACHE_KEY);
    if (cached) {
      return cached;
    }

    const { data, error } = await supabaseClient
      .from('music_tracks')
      .select(`
        *,
        music_tags(tag:tags(*))
      `)
      .order('display_order', { ascending: true });

    if (error) return { tracks: null, error };

    const tracks = data.map((track: any) => ({
      ...track,
      tags: track.music_tags?.map((mt: any) => mt.tag).filter(Boolean) || [],
    }));

    tracks.forEach((track: any) => delete track.music_tags);

    const result = { tracks: tracks as MusicTrackWithTags[], error: null };

    // Mettre en cache
    cache.set(CACHE_KEY, result, { ttl: TTL, storage: 'session' });

    return result;
  },

  async getTrackById(id: string) {
    const { data, error } = await supabaseClient
      .from('music_tracks')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    return { track: data as MusicTrack | null, error };
  },

  async getMaxDisplayOrder() {
    const { data, error } = await supabaseClient
      .from('music_tracks')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    return { maxOrder: data?.display_order ?? -1, error };
  },

  async createTrack(track: {
    title: string;
    artist: string | null;
    album: string | null;
    audio_url: string;
    cover_image_url: string | null;
    duration: number | null;
    display_order: number;
  }) {
    // Vérifier le rate limit
    try {
      checkRateLimit('create');
    } catch (error) {
      return {
        track: null,
        error: {
          message: error instanceof Error ? error.message : 'Rate limit atteint',
          code: 'RATE_LIMIT_EXCEEDED',
        } as any,
      };
    }

    console.log('[MUSIC SERVICE] Create track - Starting');
    console.log('[MUSIC SERVICE] Track data:', JSON.stringify(track, null, 2));

    try {
      // Récupérer l'utilisateur connecté
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

      if (authError) {
        console.error('[MUSIC SERVICE] Auth error:', authError);
        return {
          track: null,
          error: {
            message: 'Erreur d\'authentification',
            code: 'AUTH_ERROR',
            details: authError
          } as any
        };
      }

      if (!user) {
        console.error('[MUSIC SERVICE] No user found - user must be authenticated');
        return {
          track: null,
          error: {
            message: 'Vous devez être connecté pour ajouter un morceau',
            code: 'NOT_AUTHENTICATED',
            hint: 'Connectez-vous depuis la page /login'
          } as any
        };
      }

      console.log('[MUSIC SERVICE] User authenticated:', user.id);

      // Ajouter le user_id au track
      const trackWithUser = {
        ...track,
        user_id: user.id
      };

      // Valider les URLs
      const audioUrlValidation = validateMediaUrl(trackWithUser.audio_url, 'audio_url');
      if (!audioUrlValidation.valid) {
        return {
          track: null,
          error: {
            message: audioUrlValidation.error || 'URL audio invalide',
            code: 'INVALID_URL',
          } as any,
        };
      }

      if (trackWithUser.cover_image_url) {
        const coverUrlValidation = validateMediaUrl(trackWithUser.cover_image_url, 'cover_image_url');
        if (!coverUrlValidation.valid) {
          return {
            track: null,
            error: {
              message: coverUrlValidation.error || 'URL de couverture invalide',
              code: 'INVALID_URL',
            } as any,
          };
        }
      }

      console.log('[MUSIC SERVICE] Inserting track with user_id:', trackWithUser);

      const { data, error } = await supabaseClient
        .from('music_tracks')
        .insert(trackWithUser)
        .select()
        .single();

      if (error) {
        console.error('[MUSIC SERVICE] Insert track - ERROR:', error);
        console.error('[MUSIC SERVICE] Error code:', error.code);
        console.error('[MUSIC SERVICE] Error message:', error.message);
        console.error('[MUSIC SERVICE] Error details:', JSON.stringify(error, null, 2));
        return { track: null, error };
      }

      console.log('[MUSIC SERVICE] Insert track - SUCCESS:', data);

      // Invalider le cache des morceaux
      cache.invalidatePattern('music:');

      return { track: data as MusicTrack | null, error: null };
    } catch (err) {
      console.error('[MUSIC SERVICE] Unexpected error:', err);
      return {
        track: null,
        error: {
          message: err instanceof Error ? err.message : 'Unknown error',
          details: err
        } as any
      };
    }
  },

  async updateTrack(id: string, updates: Partial<MusicTrack>) {
    // Vérifier le rate limit
    try {
      checkRateLimit('update');
    } catch (error) {
      return {
        track: null,
        error: {
          message: error instanceof Error ? error.message : 'Rate limit atteint',
          code: 'RATE_LIMIT_EXCEEDED',
        } as any,
      };
    }

    // Valider les URLs si elles sont mises à jour
    if (updates.audio_url) {
      const urlValidation = validateMediaUrl(updates.audio_url, 'audio_url');
      if (!urlValidation.valid) {
        return {
          track: null,
          error: {
            message: urlValidation.error || 'URL audio invalide',
            code: 'INVALID_URL',
          } as any,
        };
      }
    }

    if (updates.cover_image_url) {
      const urlValidation = validateMediaUrl(updates.cover_image_url, 'cover_image_url');
      if (!urlValidation.valid) {
        return {
          track: null,
          error: {
            message: urlValidation.error || 'URL de couverture invalide',
            code: 'INVALID_URL',
          } as any,
        };
      }
    }

    const { data, error } = await supabaseClient
      .from('music_tracks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (!error) {
      // Invalider le cache des morceaux
      cache.invalidatePattern('music:');
    }

    return { track: data as MusicTrack | null, error };
  },

  async deleteTrack(id: string) {
    const { error } = await supabaseClient
      .from('music_tracks')
      .delete()
      .eq('id', id);

    if (!error) {
      // Invalider le cache des morceaux
      cache.invalidatePattern('music:');
    }

    return { error };
  },

  async updateDisplayOrder(id: string, display_order: number) {
    const { error } = await supabaseClient
      .from('music_tracks')
      .update({ display_order })
      .eq('id', id);

    return { error };
  },

  async createTrackWithTags(
    trackData: {
      title: string;
      artist: string | null;
      album: string | null;
      audio_url: string;
      cover_image_url: string | null;
      duration: number | null;
      display_order: number;
    },
    tagIds: string[] = []
  ) {
    const { track, error } = await this.createTrack(trackData);

    if (error || !track) {
      return { track: null, error };
    }

    // Ajouter les tags
    if (tagIds.length > 0) {
      const { error: tagsError } = await musicTagService.setTagsForMusicTrack(track.id, tagIds);
      if (tagsError) {
        console.error('[MUSIC SERVICE] Error setting tags:', tagsError);
      }
    }

    return { track, error: null };
  },
};
