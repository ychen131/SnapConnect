import 'dotenv/config';

export default {
  expo: {
    name: 'SnapConnect',
    slug: 'snapconnect',
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
    plugins: [
      [
        'expo-camera',
        {
          cameraPermission: 'Allow SnapConnect to access your camera',
          microphonePermission: 'Allow SnapConnect to access your microphone',
          recordAudioAndroid: true,
        },
      ],
    ],
  },
};
