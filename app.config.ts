/**
 * @file app.config.ts
 * @description Expo configuration with environment variables and app settings.
 */

import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'SnapConnect',
  slug: 'snapconnect',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.snapconnect.app',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: 'com.snapconnect.app',
  },
  web: {
    favicon: './assets/favicon.png',
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    appName: process.env.EXPO_PUBLIC_APP_NAME || 'SnapConnect',
    appVersion: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
    debugMode: process.env.EXPO_PUBLIC_DEBUG_MODE === 'true',
  },
  plugins: [
    'expo-router',
    [
      'expo-camera',
      {
        cameraPermission: 'Allow SnapConnect to access your camera to take photos and videos.',
        microphonePermission: 'Allow SnapConnect to access your microphone to record videos.',
      },
    ],
  ],
});
