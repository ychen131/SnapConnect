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

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
