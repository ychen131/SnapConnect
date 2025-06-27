import 'dotenv/config';

export default {
  expo: {
    name: 'SnapDog',
    slug: 'snapdog',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    cameraPermission: 'Allow SnapDog to access your camera',
    microphonePermission: 'Allow SnapDog to access your microphone',
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
    plugins: [
      [
        'expo-camera',
        {
          cameraPermission: 'Allow SnapDog to access your camera',
          microphonePermission: 'Allow SnapDog to access your microphone',
          recordAudioAndroid: true,
        },
      ],
    ],
  },
};
