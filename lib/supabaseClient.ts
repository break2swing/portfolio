import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variables d\'environnement Supabase manquantes');
}

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Photo = {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  blur_data_url: string | null;
  display_order: number;
  user_id: string | null;
  created_at: string;
};

export type MusicTrack = {
  id: string;
  title: string;
  artist: string | null;
  album: string | null;
  audio_url: string;
  cover_image_url: string | null;
  duration: number | null;
  display_order: number;
  user_id: string | null;
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type Tag = {
  id: string;
  name: string;
  slug: string;
  color: string;
  created_at: string;
  updated_at: string;
};

export type Text = {
  id: string;
  title: string;
  subtitle: string | null;
  content: string;
  excerpt: string | null;
  author: string | null;
  published_date: string | null;
  display_order: number;
  category_id: string | null;
  user_id: string | null;
  is_published: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
};

export type TextTag = {
  text_id: string;
  tag_id: string;
  created_at: string;
};

export type MusicTag = {
  music_track_id: string;
  tag_id: string;
  created_at: string;
};

export type VideoTag = {
  video_id: string;
  tag_id: string;
  created_at: string;
};

export type PhotoTag = {
  photo_id: string;
  tag_id: string;
  created_at: string;
};

export type TextWithMetadata = Text & {
  category?: Category | null;
  tags?: Tag[];
};

export type MusicTrackWithTags = MusicTrack & {
  tags?: Tag[];
};

export type VideoWithTags = Video & {
  tags?: Tag[];
};

export type PhotoWithTags = Photo & {
  tags?: Tag[];
};

export type Video = {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  duration: number | null;
  display_order: number;
  user_id: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      photos: {
        Row: Photo;
        Insert: Omit<Photo, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Photo, 'id' | 'created_at'>>;
      };
      music_tracks: {
        Row: MusicTrack;
        Insert: Omit<MusicTrack, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<MusicTrack, 'id' | 'created_at'>>;
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Category, 'id' | 'created_at' | 'updated_at'>>;
      };
      tags: {
        Row: Tag;
        Insert: Omit<Tag, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Tag, 'id' | 'created_at' | 'updated_at'>>;
      };
      texts: {
        Row: Text;
        Insert: Omit<Text, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Text, 'id' | 'created_at' | 'updated_at'>>;
      };
      text_tags: {
        Row: TextTag;
        Insert: TextTag;
        Update: never;
      };
      music_tags: {
        Row: MusicTag;
        Insert: MusicTag;
        Update: never;
      };
      video_tags: {
        Row: VideoTag;
        Insert: VideoTag;
        Update: never;
      };
      photo_tags: {
        Row: PhotoTag;
        Insert: PhotoTag;
        Update: never;
      };
      videos: {
        Row: Video;
        Insert: Omit<Video, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Video, 'id' | 'created_at'>>;
      };
    };
  };
};
