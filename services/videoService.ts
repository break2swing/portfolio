import { supabaseClient, Video, VideoWithTags } from '@/lib/supabaseClient';
import { videoTagService } from './videoTagService';
import { validateMediaUrl } from '@/lib/urlValidation';
import { checkRateLimit } from '@/lib/rateLimiter';

export const videoService = {
  async getAllVideos() {
    const { data, error } = await supabaseClient
      .from('videos')
      .select('*')
      .order('display_order', { ascending: true });

    return { videos: data as Video[] | null, error };
  },

  async getAllVideosWithTags() {
    const { data, error } = await supabaseClient
      .from('videos')
      .select(`
        *,
        video_tags(tag:tags(*))
      `)
      .order('display_order', { ascending: true });

    if (error) return { videos: null, error };

    const videos = data.map((video: any) => ({
      ...video,
      tags: video.video_tags?.map((vt: any) => vt.tag).filter(Boolean) || [],
    }));

    videos.forEach((video: any) => delete video.video_tags);

    return { videos: videos as VideoWithTags[], error: null };
  },

  async getVideoById(id: string) {
    const { data, error } = await supabaseClient
      .from('videos')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    return { video: data as Video | null, error };
  },

  async getMaxDisplayOrder() {
    const { data, error } = await supabaseClient
      .from('videos')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    return { maxOrder: data?.display_order ?? -1, error };
  },

  async createVideo(video: {
    title: string;
    description: string | null;
    video_url: string;
    thumbnail_url: string | null;
    duration: number | null;
    display_order: number;
  }) {
    // Vérifier le rate limit
    try {
      checkRateLimit('create');
    } catch (error) {
      return {
        video: null,
        error: {
          message: error instanceof Error ? error.message : 'Rate limit atteint',
          code: 'RATE_LIMIT_EXCEEDED',
        } as any,
      };
    }

    console.log('[VIDEO SERVICE] Create video - Starting');
    console.log('[VIDEO SERVICE] Video data:', JSON.stringify(video, null, 2));

    try {
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

      if (authError) {
        console.error('[VIDEO SERVICE] Auth error:', authError);
        return {
          video: null,
          error: {
            message: 'Erreur d\'authentification',
            code: 'AUTH_ERROR',
            details: authError
          } as any
        };
      }

      if (!user) {
        console.error('[VIDEO SERVICE] No user found - user must be authenticated');
        return {
          video: null,
          error: {
            message: 'Vous devez être connecté pour ajouter une vidéo',
            code: 'NOT_AUTHENTICATED',
            hint: 'Connectez-vous depuis la page /login'
          } as any
        };
      }

      console.log('[VIDEO SERVICE] User authenticated:', user.id);

      const videoWithUser = {
        ...video,
        user_id: user.id
      };

      // Valider les URLs
      const videoUrlValidation = validateMediaUrl(videoWithUser.video_url, 'video_url');
      if (!videoUrlValidation.valid) {
        return {
          video: null,
          error: {
            message: videoUrlValidation.error || 'URL vidéo invalide',
            code: 'INVALID_URL',
          } as any,
        };
      }

      if (videoWithUser.thumbnail_url) {
        const thumbnailUrlValidation = validateMediaUrl(videoWithUser.thumbnail_url, 'thumbnail_url');
        if (!thumbnailUrlValidation.valid) {
          return {
            video: null,
            error: {
              message: thumbnailUrlValidation.error || 'URL de miniature invalide',
              code: 'INVALID_URL',
            } as any,
          };
        }
      }

      console.log('[VIDEO SERVICE] Inserting video with user_id:', videoWithUser);

      const { data, error } = await supabaseClient
        .from('videos')
        .insert(videoWithUser)
        .select()
        .single();

      if (error) {
        console.error('[VIDEO SERVICE] Insert video - ERROR:', error);
        console.error('[VIDEO SERVICE] Error code:', error.code);
        console.error('[VIDEO SERVICE] Error message:', error.message);
        console.error('[VIDEO SERVICE] Error details:', JSON.stringify(error, null, 2));
        return { video: null, error };
      }

      console.log('[VIDEO SERVICE] Insert video - SUCCESS:', data);
      return { video: data as Video | null, error: null };
    } catch (err) {
      console.error('[VIDEO SERVICE] Unexpected error:', err);
      return {
        video: null,
        error: {
          message: err instanceof Error ? err.message : 'Unknown error',
          details: err
        } as any
      };
    }
  },

  async updateVideo(id: string, updates: Partial<Video>) {
    // Vérifier le rate limit
    try {
      checkRateLimit('update');
    } catch (error) {
      return {
        video: null,
        error: {
          message: error instanceof Error ? error.message : 'Rate limit atteint',
          code: 'RATE_LIMIT_EXCEEDED',
        } as any,
      };
    }

    // Valider les URLs si elles sont mises à jour
    if (updates.video_url) {
      const urlValidation = validateMediaUrl(updates.video_url, 'video_url');
      if (!urlValidation.valid) {
        return {
          video: null,
          error: {
            message: urlValidation.error || 'URL vidéo invalide',
            code: 'INVALID_URL',
          } as any,
        };
      }
    }

    if (updates.thumbnail_url) {
      const urlValidation = validateMediaUrl(updates.thumbnail_url, 'thumbnail_url');
      if (!urlValidation.valid) {
        return {
          video: null,
          error: {
            message: urlValidation.error || 'URL de miniature invalide',
            code: 'INVALID_URL',
          } as any,
        };
      }
    }

    const { data, error } = await supabaseClient
      .from('videos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { video: data as Video | null, error };
  },

  async deleteVideo(id: string) {
    const { error } = await supabaseClient
      .from('videos')
      .delete()
      .eq('id', id);

    return { error };
  },

  async updateDisplayOrder(id: string, display_order: number) {
    const { error } = await supabaseClient
      .from('videos')
      .update({ display_order })
      .eq('id', id);

    return { error };
  },

  async createVideoWithTags(
    videoData: {
      title: string;
      description: string | null;
      video_url: string;
      thumbnail_url: string | null;
      duration: number | null;
      display_order: number;
    },
    tagIds: string[] = []
  ) {
    const { video, error } = await this.createVideo(videoData);

    if (error || !video) {
      return { video: null, error };
    }

    // Ajouter les tags
    if (tagIds.length > 0) {
      const { error: tagsError } = await videoTagService.setTagsForVideo(video.id, tagIds);
      if (tagsError) {
        console.error('[VIDEO SERVICE] Error setting tags:', tagsError);
      }
    }

    return { video, error: null };
  },
};
