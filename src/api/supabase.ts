/**
 * @file supabase.ts
 * @description Supabase client configuration and initialization.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types (to be defined based on your schema)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          email: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          email?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      snaps: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          media_url: string;
          media_type: 'photo' | 'video';
          duration: number;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          media_url: string;
          media_type: 'photo' | 'video';
          duration: number;
          created_at?: string;
          expires_at: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          media_url?: string;
          media_type?: 'photo' | 'video';
          duration?: number;
          created_at?: string;
          expires_at?: string;
        };
      };
    };
  };
}
