/**
 * @file CameraScreen.tsx
 * @description Camera screen with live preview, flip camera, and Snapchat-style capture button (tap for photo, hold for video). Video recording implemented.
 */
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { CameraView, CameraType } from 'expo-camera';
import { useCameraPermission } from '../../services/permissionService';
import { Video, ResizeMode } from 'expo-av';

const VIDEO_MAX_DURATION_MS = 5000;
const TAP_THRESHOLD_MS = 200;
const MIN_RECORDING_DURATION_MS = 500; // Minimum 500ms recording

/**
 * Displays the camera preview, flip button, and Snapchat-style capture button.
 */
export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermission();
  const [facing, setFacing] = useState<CameraType>('back');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [pressStartTime, setPressStartTime] = useState<number | null>(null);
  const [recordingProgress, setRecordingProgress] = useState(0); // 0-100
  const [recordingDuration, setRecordingDuration] = useState(0); // in milliseconds
  const [photoTimer, setPhotoTimer] = useState(3); // Default 3 seconds
  const cameraRef = useRef<CameraView | null>(null);
  const recordingTimeout = useRef<NodeJS.Timeout | null>(null);
  const recordingPromise = useRef<Promise<any> | null>(null);
  const progressTimer = useRef<NodeJS.Timeout | null>(null);

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

  // Start progress timer for recording
  function startProgressTimer() {
    const startTime = Date.now();
    setRecordingDuration(0);
    setRecordingProgress(0);

    progressTimer.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / VIDEO_MAX_DURATION_MS) * 100, 100);

      setRecordingDuration(elapsed);
      setRecordingProgress(progress);

      // Auto-stop at 15 seconds
      if (elapsed >= VIDEO_MAX_DURATION_MS) {
        console.log('⏰ 15-second limit reached, auto-stopping recording');
        handleStopRecording();
      }
    }, 100); // Update every 100ms
  }

  // Stop progress timer
  function stopProgressTimer() {
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
    setRecordingProgress(0);
    setRecordingDuration(0);
  }

  // Handle save functionality
  function handleSave() {
    console.log('💾 Saving content...');
    // TODO: Implement save to gallery functionality
    // For now, just close the preview
    setPhotoUri(null);
    setVideoUri(null);
  }

  // Handle discard functionality
  function handleDiscard() {
    console.log('🗑️ Discarding content...');
    setPhotoUri(null);
    setVideoUri(null);
  }

  // Handle send functionality
  function handleSend() {
    console.log('📤 Sending content...');
    // TODO: Navigate to send screen
    // For now, just close the preview
    setPhotoUri(null);
    setVideoUri(null);
  }

  // --- Snapchat-style capture logic ---
  async function handlePressIn() {
    console.log('🟢 Press In - Starting video recording...');
    setPressStartTime(Date.now());

    // Start video recording
    if (cameraRef.current) {
      try {
        setIsRecording(true);
        console.log('📹 Starting video recording...');

        // Use the full 15-second duration since we'll stop manually
        recordingPromise.current = cameraRef.current.recordAsync({
          maxDuration: VIDEO_MAX_DURATION_MS / 1000, // 15 seconds
        });

        // Start progress timer
        startProgressTimer();

        console.log('✅ Video recording started successfully');
      } catch (error) {
        console.error('❌ Failed to start video recording:', error);
        setIsRecording(false);
        setPressStartTime(null);
      }
    } else {
      console.error('❌ Camera ref is null');
      setPressStartTime(null);
    }
  }

  async function handleStopRecording() {
    console.log('🟡 Stop Recording - isRecording:', isRecording);
    if (isRecording && cameraRef.current) {
      try {
        console.log('📹 Stopping video recording...');
        setIsRecording(false);

        if (recordingTimeout.current) {
          clearTimeout(recordingTimeout.current);
          recordingTimeout.current = null;
        }

        // The recording promise will be processed by the useEffect
        console.log('📹 Recording stopped, promise will be processed automatically');
      } catch (error) {
        console.error('❌ Failed to stop video recording:', error);
        setIsRecording(false);
        recordingPromise.current = null;
      }
    } else {
      console.log('⚠️ Not recording or camera ref is null');
    }
  }

  async function handlePressOut() {
    console.log('🔴 Press Out - isRecording:', isRecording);
    if (isRecording && cameraRef.current) {
      console.log('📹 Stopping video recording immediately...');
      setIsRecording(false);

      try {
        // Stop the recording immediately
        await cameraRef.current.stopRecording();
        console.log('📹 Recording stopped successfully');

        // Stop progress timer
        stopProgressTimer();

        // Wait for the recording promise to resolve
        if (recordingPromise.current) {
          recordingPromise.current
            .then((video: any) => {
              console.log('✅ Video recorded successfully:', video);
              if (video && video.uri) {
                console.log('🎬 Setting video URI:', video.uri);
                setVideoUri(video.uri);
              } else {
                console.error('❌ Video object is invalid:', video);
              }
            })
            .catch((error: any) => {
              console.error('❌ Recording promise rejected:', error);
            })
            .finally(() => {
              recordingPromise.current = null;
            });
        }
      } catch (error) {
        console.error('❌ Failed to stop recording:', error);
      }
    }
    setPressStartTime(null);
  }

  async function handlePress() {
    console.log('👆 Press - pressStartTime:', pressStartTime);
    if (pressStartTime) {
      const pressDuration = Date.now() - pressStartTime;
      console.log('⏱️ Press duration:', pressDuration, 'ms');

      if (pressDuration < TAP_THRESHOLD_MS) {
        // Tap: Take photo
        console.log('📸 Taking photo (tap detected)');
        if (cameraRef.current) {
          try {
            const photo = await cameraRef.current.takePictureAsync();
            console.log('✅ Photo taken successfully:', photo.uri);
            setPhotoUri(photo.uri);
          } catch (error) {
            console.error('❌ Failed to take picture:', error);
          }
        }
      } else {
        console.log('📹 Long press detected, photo not taken');
      }
      setPressStartTime(null);
    }
  }

  // Enhanced Photo Preview Screen
  if (photoUri) {
    return (
      <View className="flex-1 bg-black">
        {/* Photo Preview */}
        <View className="flex-1">
          <Image
            source={{ uri: photoUri }}
            style={{ flex: 1, width: '100%' }}
            resizeMode="contain"
          />
        </View>

        {/* Top Controls */}
        <View className="absolute left-0 right-0 top-12 flex-row items-center justify-between px-4">
          <TouchableOpacity
            className="rounded-full bg-black/50 p-3"
            onPress={handleDiscard}
            accessibilityLabel="Close"
          >
            <Text className="text-lg font-bold text-white">✕</Text>
          </TouchableOpacity>

          <View className="flex-row space-x-2">
            <TouchableOpacity
              className="rounded-full bg-black/50 px-4 py-2"
              onPress={() => setPhotoTimer(Math.max(1, photoTimer - 1))}
            >
              <Text className="font-bold text-white">-</Text>
            </TouchableOpacity>
            <View className="rounded-full bg-black/50 px-4 py-2">
              <Text className="font-bold text-white">{photoTimer}s</Text>
            </View>
            <TouchableOpacity
              className="rounded-full bg-black/50 px-4 py-2"
              onPress={() => setPhotoTimer(Math.min(10, photoTimer + 1))}
            >
              <Text className="font-bold text-white">+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Controls */}
        <View className="absolute bottom-8 left-0 right-0 flex-row items-center justify-center space-x-4 px-4">
          <TouchableOpacity className="rounded-full bg-gray-600 px-6 py-3" onPress={handleSave}>
            <Text className="font-bold text-white">Save</Text>
          </TouchableOpacity>

          <TouchableOpacity className="rounded-full bg-yellow-500 px-6 py-3" onPress={handleSend}>
            <Text className="font-bold text-black">Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Enhanced Video Preview Screen
  if (videoUri) {
    return (
      <View className="flex-1 bg-black">
        {/* Video Preview */}
        <View className="flex-1">
          <Video
            source={{ uri: videoUri }}
            style={{ flex: 1, width: '100%' }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            isLooping={false}
          />
        </View>

        {/* Top Controls */}
        <View className="absolute left-0 right-0 top-12 flex-row items-center justify-between px-4">
          <TouchableOpacity
            className="rounded-full bg-black/50 p-3"
            onPress={handleDiscard}
            accessibilityLabel="Close"
          >
            <Text className="text-lg font-bold text-white">✕</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Controls */}
        <View className="absolute bottom-8 left-0 right-0 flex-row items-center justify-center space-x-4 px-4">
          <TouchableOpacity className="rounded-full bg-gray-600 px-6 py-3" onPress={handleSave}>
            <Text className="font-bold text-white">Save</Text>
          </TouchableOpacity>

          <TouchableOpacity className="rounded-full bg-yellow-500 px-6 py-3" onPress={handleSend}>
            <Text className="font-bold text-black">Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {/* Camera Preview as background */}
      <CameraView
        ref={cameraRef}
        style={{ flex: 1, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        facing={facing}
        mode="video"
        mute={true}
        mirror={facing === 'front'}
      />
      {/* Overlay UI */}
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
      {/* Snapchat-style Capture Button */}
      <View className="absolute bottom-8 left-0 right-0 items-center">
        <View className="relative">
          {/* Progress ring */}
          {isRecording && (
            <View
              className="absolute inset-0 rounded-full border-4 border-gray-300"
              style={{
                borderTopColor: recordingProgress >= 25 ? 'red' : 'gray',
                borderRightColor: recordingProgress >= 50 ? 'red' : 'gray',
                borderBottomColor: recordingProgress >= 75 ? 'red' : 'gray',
                borderLeftColor: recordingProgress >= 100 ? 'red' : 'gray',
              }}
            />
          )}

          <TouchableOpacity
            className={`h-20 w-20 items-center justify-center rounded-full border-4 ${
              isRecording ? 'border-red-500 bg-red-100' : 'border-gray-300 bg-white'
            }`}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
            accessibilityLabel="Snapchat-style Capture"
            activeOpacity={0.7}
          >
            <View
              className={`h-12 w-12 rounded-full ${isRecording ? 'bg-red-500' : 'bg-gray-200'}`}
            />
          </TouchableOpacity>
        </View>

        {isRecording && (
          <View className="mt-2 rounded bg-red-500 px-3 py-1">
            <Text className="text-sm font-bold text-white">
              Recording... {Math.round(recordingDuration / 1000)}s ({Math.round(recordingProgress)}
              %)
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
