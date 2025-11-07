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
  display_order: number;
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

export type Text = {
  id: string;
  title: string;
  subtitle: string | null;
  content: string;
  excerpt: string | null;
  author: string | null;
  published_date: string | null;
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
      texts: {
        Row: Text;
        Insert: Omit<Text, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Text, 'id' | 'created_at'>>;
      };
    };
  };
};
