/**
 * @file CameraScreen.tsx
 * @description Camera screen with live preview using expo-camera (CameraView) and a flip camera button.
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CameraView, CameraType } from 'expo-camera';
import { useCameraPermission } from '../../services/permissionService';

/**
 * Displays the camera preview or permission request UI.
 */
export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermission();
  const [facing, setFacing] = useState<CameraType>('back');

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

  return (
    <View className="flex-1 bg-black">
      <CameraView style={{ flex: 1 }} facing={facing}>
        <View className="absolute bottom-10 left-0 right-0 items-center">
          <TouchableOpacity
            className="rounded-full bg-white/80 px-6 py-3"
            onPress={toggleCameraFacing}
            accessibilityLabel="Flip Camera"
          >
            <Text className="text-lg font-bold text-black">Flip Camera</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}
