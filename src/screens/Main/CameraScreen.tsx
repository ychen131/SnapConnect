/**
 * @file CameraScreen.tsx
 * @description Camera screen with live preview, flip camera, and photo capture functionality using expo-camera (CameraView).
 */
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { CameraView, CameraType } from 'expo-camera';
import { useCameraPermission } from '../../services/permissionService';

/**
 * Displays the camera preview, flip button, and capture button. Shows photo preview after capture.
 */
export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermission();
  const [facing, setFacing] = useState<CameraType>('back');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const cameraRef = useRef<any>(null);

  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-lg">Loading camera permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="mb-4 text-lg">Camera access is required to use this feature.</Text>
        <TouchableOpacity className="rounded bg-blue-500 px-4 py-2" onPress={requestPermission}>
          <Text className="font-bold text-white">Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }

  async function handleCapture() {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        setPhotoUri(photo.uri);
      } catch (error) {
        // Optionally show error feedback
        console.error('Failed to take picture:', error);
      }
    }
  }

  if (photoUri) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <Image source={{ uri: photoUri }} style={{ flex: 1, width: '100%' }} resizeMode="contain" />
        <TouchableOpacity
          className="absolute right-6 top-10 rounded bg-white/80 px-4 py-2"
          onPress={() => setPhotoUri(null)}
        >
          <Text className="text-lg font-bold text-black">Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing}>
        {/* Flip Camera Button */}
        <View className="absolute bottom-28 left-0 right-0 items-center">
          <TouchableOpacity
            className="rounded-full bg-white/80 px-6 py-3"
            onPress={toggleCameraFacing}
            accessibilityLabel="Flip Camera"
          >
            <Text className="text-lg font-bold text-black">Flip Camera</Text>
          </TouchableOpacity>
        </View>
        {/* Capture Button */}
        <View className="absolute bottom-8 left-0 right-0 items-center">
          <TouchableOpacity
            className="h-20 w-20 items-center justify-center rounded-full border-4 border-gray-300 bg-white"
            onPress={handleCapture}
            accessibilityLabel="Take Photo"
            activeOpacity={0.7}
          >
            <View className="h-12 w-12 rounded-full bg-gray-200" />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}
