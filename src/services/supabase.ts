/**
 * @file supabase.ts
 * @description Exports a configured Supabase client for use throughout the app.
 */
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

/**
 * Creates and exports a Supabase client using public environment variables from Expo config.
 * @see https://supabase.com/docs/reference/javascript/initializing
 */
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl as string;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey as string;

// Debug logging
console.log('🔧 Supabase configuration:');
console.log('URL:', supabaseUrl ? 'Present' : 'Missing');
console.log('Key:', supabaseAnonKey ? 'Present' : 'Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration. Check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Test the connection
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('❌ Supabase session check failed:', error);
  } else {
    console.log('✅ Supabase client initialized successfully');
    if (data.session) {
      console.log('✅ User session found:', data.session.user.id);
    } else {
      console.log('ℹ️ No active user session');
    }
  }
});
