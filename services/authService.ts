import { supabaseClient } from '@/lib/supabaseClient';
import { User, Session } from '@supabase/supabase-js';

export const authService = {
  async getSession() {
    const { data, error } = await supabaseClient.auth.getSession();
    return { session: data.session, error };
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    return { user: data.user, session: data.session, error };
  },

  async signOut() {
    const { error } = await supabaseClient.auth.signOut();
    return { error };
  },

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      (event, session) => {
        callback(event, session);
      }
    );
    return subscription;
  },
};
