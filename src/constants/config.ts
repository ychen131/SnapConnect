/**
 * @file config.ts
 * @description Application configuration constants and environment variables.
 */

import Constants from 'expo-constants';

export const CONFIG = {
  // App Information
  APP_NAME: Constants.expoConfig?.extra?.appName || 'SnapConnect',
  APP_VERSION: Constants.expoConfig?.extra?.appVersion || '1.0.0',

  // Supabase Configuration
  SUPABASE_URL: Constants.expoConfig?.extra?.supabaseUrl,
  SUPABASE_ANON_KEY: Constants.expoConfig?.extra?.supabaseAnonKey,

  // Development
  DEBUG_MODE: Constants.expoConfig?.extra?.debugMode || false,

  // App Settings
  MAX_VIDEO_DURATION: 15, // seconds
  MAX_PHOTO_DURATION: 10, // seconds
  STORY_DURATION: 24 * 60 * 60, // 24 hours in seconds

  // Navigation
  ROUTES: {
    AUTH: {
      LOGIN: 'Login',
      SIGNUP: 'Signup',
    },
    MAIN: {
      CAMERA: 'Camera',
      CHAT: 'Chat',
      STORIES: 'Stories',
      PROFILE: 'Profile',
    },
  },
} as const;

// Type-safe route names
export type RouteNames = typeof CONFIG.ROUTES;
