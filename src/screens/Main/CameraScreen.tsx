/**
 * @file CameraScreen.tsx
 * @description Camera screen with live preview, flip camera, and Snapchat-style capture button (tap for photo, hold for video). Video recording implemented.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, CameraType } from 'expo-camera';
import { useCameraPermission } from '../../services/permissionService';
import { Video, ResizeMode } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CameraStackParamList } from '../../navigation/types';
import { RootState } from '../../store';
import { addToStory } from '../../services/storyService';
import { uploadMediaToStorage } from '../../services/snapService';
import PhotoEditingToolbar from '../../components/camera/PhotoEditingToolbar';
import TextOverlay from '../../components/camera/TextOverlay';
import TextEditModal from '../../components/camera/TextEditModal';
import {
  applyFilter,
  composeImageWithOverlays,
  createTextOverlay,
  updateTextOverlay,
  exportEditedImage,
  type FilterType,
  type TextOverlay as TextOverlayType,
} from '../../utils/imageFilters';
import FilteredImage from '../../components/camera/FilteredImage';
import * as FileSystem from 'expo-file-system';
import { ImageFormat } from '@shopify/react-native-skia';

type CameraScreenNavigationProp = NativeStackNavigationProp<CameraStackParamList, 'CameraMain'>;

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
  const [isAddingToStory, setIsAddingToStory] = useState(false);
  const [hasNetworkError, setHasNetworkError] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  // Photo editing state
  const [isEditMode, setIsEditMode] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [hasEdits, setHasEdits] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // Text overlay state
  const [textOverlays, setTextOverlays] = useState<TextOverlayType[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [currentFilter, setCurrentFilter] = useState<FilterType>('original');
  // Text edit modal state
  const [isTextModalVisible, setIsTextModalVisible] = useState(false);
  const [editingOverlay, setEditingOverlay] = useState<TextOverlayType | null>(null);
  // Filter state
  const [filteredImageUri, setFilteredImageUri] = useState<string | null>(null);
  const [isApplyingFilter, setIsApplyingFilter] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);
  const recordingTimeout = useRef<NodeJS.Timeout | null>(null);
  const recordingPromise = useRef<Promise<any> | null>(null);
  const progressTimer = useRef<NodeJS.Timeout | null>(null);
  const navigation = useNavigation<CameraScreenNavigationProp>();
  const user = useSelector((state: RootState) => state.auth.user);
  const filteredImageRef = useRef<any>(null);

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

  // Handle navigation back to camera
  function handleBackToCamera() {
    setPhotoUri(null);
    setVideoUri(null);
    setPhotoTimer(3);
    setIsAddingToStory(false);
    setUploadProgress(0);
    setHasNetworkError(false);
    // Reset editing state
    setIsEditMode(false);
    setCanUndo(false);
    setCanRedo(false);
    setHasEdits(false);
    setTextOverlays([]);
    setSelectedTextId(null);
    setCurrentFilter('original');
  }

  // Photo editing toolbar handlers
  function handleFilterPress() {
    // Filter selection is now handled by the FilterCarousel
    console.log('🎨 Filter button pressed');
  }

  function handleFilterSelect(filter: FilterType) {
    console.log('🎨 Filter selected:', filter);
    setCurrentFilter(filter);

    // Set hasEdits if a non-original filter is applied
    if (filter !== 'original') {
      setHasEdits(true);
    }

    // Apply filter to the current image
    if (photoUri) {
      applyFilterToImage(photoUri, filter);
    }
  }

  async function applyFilterToImage(imageUri: string, filter: FilterType) {
    if (filter === 'original') {
      setFilteredImageUri(null);
      return;
    }

    setIsApplyingFilter(true);
    try {
      const filteredUri = await applyFilter(imageUri, filter);
      setFilteredImageUri(filteredUri);
    } catch (error) {
      console.error('❌ Failed to apply filter:', error);
      // Fallback to original
      setFilteredImageUri(null);
    } finally {
      setIsApplyingFilter(false);
    }
  }

  function handleTextPress() {
    console.log('📝 Text button pressed');
    // Create a new text overlay at the center of the screen
    const newOverlay = createTextOverlay(
      'Tap to edit',
      100, // x position
      200, // y position
      24, // fontSize
      '#FFFFFF', // color
      'System', // fontFamily
    );

    setTextOverlays((prev) => [...prev, newOverlay]);
    setSelectedTextId(newOverlay.id);
    setHasEdits(true);
    setCanUndo(true);
  }

  function handleTextPositionChange(id: string, x: number, y: number) {
    setTextOverlays((prev) =>
      prev.map((overlay) => (overlay.id === id ? { ...overlay, x, y } : overlay)),
    );
  }

  function handleTextSelect(id: string) {
    setSelectedTextId(id);
  }

  function handleTextDelete(id: string) {
    setTextOverlays((prev) => {
      const newOverlays = prev.filter((overlay) => overlay.id !== id);
      // Update hasEdits based on the new length
      setHasEdits(newOverlays.length > 0 || currentFilter !== 'original');
      return newOverlays;
    });
    if (selectedTextId === id) {
      setSelectedTextId(null);
    }
  }

  function handleTextOverlayPress(id: string) {
    // Open text editing modal
    const overlay = textOverlays.find((o) => o.id === id);
    if (overlay) {
      setEditingOverlay(overlay);
      setIsTextModalVisible(true);
    }
  }

  function handleTextSave(updatedOverlay: TextOverlayType) {
    setTextOverlays((prev) =>
      prev.map((overlay) => (overlay.id === updatedOverlay.id ? updatedOverlay : overlay)),
    );
    setIsTextModalVisible(false);
    setEditingOverlay(null);
  }

  function handleTextModalCancel() {
    setIsTextModalVisible(false);
    setEditingOverlay(null);
  }

  function handleTextModalDelete() {
    if (editingOverlay) {
      handleTextDelete(editingOverlay.id);
      setIsTextModalVisible(false);
      setEditingOverlay(null);
    }
  }

  function handleUndoPress() {
    console.log('↶ Undo button pressed');
    // TODO: Implement undo functionality
    Alert.alert('Coming Soon', 'Undo functionality will be available in the next update!');
  }

  function handleRedoPress() {
    console.log('↷ Redo button pressed');
    // TODO: Implement redo functionality
    Alert.alert('Coming Soon', 'Redo functionality will be available in the next update!');
  }

  function handleResetPress() {
    console.log('🔄 Reset button pressed');
    Alert.alert('Reset Edits', 'Are you sure you want to reset all edits? This cannot be undone.', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          console.log('🔄 Resetting all edits...');
          // Reset all editing state
          setHasEdits(false);
          setCanUndo(false);
          setCanRedo(false);
          setTextOverlays([]);
          setSelectedTextId(null);
          setCurrentFilter('original');
          setFilteredImageUri(null);
          setIsTextModalVisible(false);
          setEditingOverlay(null);
          console.log('✅ All edits reset successfully');
        },
      },
    ]);
  }

  async function handleSavePress() {
    console.log('💾 Save button pressed');

    if (!photoUri) {
      Alert.alert('Error', 'No photo to save. Please take a photo first.');
      return;
    }

    setIsSaving(true);

    try {
      // 1. Take a snapshot of the Skia canvas
      if (!filteredImageRef.current || !filteredImageRef.current.makeImageSnapshot) {
        throw new Error('FilteredImage ref or snapshot method not available');
      }
      const skiaImage = filteredImageRef.current.makeImageSnapshot();
      if (!skiaImage) throw new Error('Failed to capture Skia snapshot');

      // 2. Encode to base64 (PNG)
      const base64 = skiaImage.encodeToBase64(ImageFormat.PNG, 1.0);
      if (!base64) throw new Error('Failed to encode Skia image to base64');

      // 3. Write to a temporary file
      const fileUri = FileSystem.cacheDirectory + `snapdog_export_${Date.now()}.png`;
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // 4. Save to gallery
      const { status } = await import('expo-media-library').then((m) =>
        m.requestPermissionsAsync(),
      );
      if (status !== 'granted') throw new Error('Media library permission denied');
      await import('expo-media-library').then((m) => m.saveToLibraryAsync(fileUri));

      Alert.alert('Success!', 'Your edited image has been saved to your device gallery.', [
        { text: 'OK' },
      ]);
    } catch (error) {
      console.error('❌ Save failed:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save image.', [
        { text: 'OK' },
      ]);
    } finally {
      setIsSaving(false);
    }
  }

  // Check network connectivity
  async function checkNetworkConnectivity(): Promise<boolean> {
    try {
      const response = await fetch('https://www.google.com', {
        method: 'HEAD',
        mode: 'no-cors',
      });
      return true;
    } catch (error) {
      console.log('Network connectivity check failed:', error);
      return false;
    }
  }

  // Handle offline scenario
  function handleOfflineScenario() {
    setHasNetworkError(true);
    Alert.alert(
      'No Internet Connection',
      "You need an internet connection to add stories. Your content will be saved locally and you can try again when you're back online.",
      [
        {
          text: 'Save Locally',
          onPress: () => {
            // TODO: Implement local storage for offline content
            Alert.alert('Coming Soon', 'Offline storage will be available in a future update.');
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
    );
  }

  // Handle send functionality
  function handleSend() {
    console.log('📤 Sending content...');

    if (photoUri) {
      // Navigate to SendTo screen with photo data
      navigation.navigate('SendTo', {
        contentUri: photoUri,
        contentType: 'photo',
        photoTimer: photoTimer,
      });
    } else if (videoUri) {
      // Navigate to SendTo screen with video data
      navigation.navigate('SendTo', {
        contentUri: videoUri,
        contentType: 'video',
      });
    }
  }

  // Handle add to story functionality
  async function handleAddToStory() {
    if (!user?.id) {
      Alert.alert('Error', 'User not found. Please log in again.');
      return;
    }

    // Validate content exists
    if (!photoUri && !videoUri) {
      Alert.alert('Error', 'No content to add to story. Please capture a photo or video first.');
      return;
    }

    // Check network connectivity first
    const isOnline = await checkNetworkConnectivity();
    if (!isOnline) {
      handleOfflineScenario();
      return;
    }

    setIsAddingToStory(true);
    setUploadProgress(0);
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        console.log(`📖 Adding to story (attempt ${retryCount + 1}/${maxRetries})...`);

        let mediaUrl: string;
        let mediaType: 'photo' | 'video';
        let timer: number | undefined;

        // Simulate upload progress
        setUploadProgress(25);
        await new Promise((resolve) => setTimeout(resolve, 500));

        if (photoUri) {
          mediaUrl = await uploadMediaToStorage(photoUri, user.id);
          mediaType = 'photo';
          timer = photoTimer;
        } else if (videoUri) {
          mediaUrl = await uploadMediaToStorage(videoUri, user.id);
          mediaType = 'video';
        } else {
          throw new Error('No content to add to story');
        }

        setUploadProgress(75);
        await new Promise((resolve) => setTimeout(resolve, 300));

        const story = await addToStory(user.id, mediaUrl, mediaType, timer);

        setUploadProgress(100);
        await new Promise((resolve) => setTimeout(resolve, 200));

        if (story) {
          Alert.alert(
            'Story Added!',
            'Your story has been added successfully. You can view it in the Stories tab or My Stories section.',
            [
              {
                text: 'Continue with Content',
                onPress: () => {
                  // Keep the content for sending to friends
                  // Don't clear photoUri/videoUri
                },
              },
              {
                text: 'Done',
                onPress: () => {
                  setPhotoUri(null);
                  setVideoUri(null);
                  setIsAddingToStory(false);
                  setUploadProgress(0);
                  setHasNetworkError(false);
                },
              },
            ],
          );
          return; // Success, exit retry loop
        } else {
          throw new Error('Failed to create story in database');
        }
      } catch (error) {
        retryCount++;
        console.error(`Error adding to story (attempt ${retryCount}/${maxRetries}):`, error);

        if (retryCount >= maxRetries) {
          // Final attempt failed
          let errorMessage = 'Failed to add to story. Please try again.';

          if (error instanceof Error) {
            if (error.message.includes('network') || error.message.includes('fetch')) {
              errorMessage = 'Network error. Please check your connection and try again.';
            } else if (error.message.includes('storage') || error.message.includes('upload')) {
              errorMessage = 'Failed to upload media. Please try again.';
            } else if (error.message.includes('database') || error.message.includes('insert')) {
              errorMessage = 'Failed to save story. Please try again.';
            }
          }

          Alert.alert('Error', errorMessage, [
            {
              text: 'Retry',
              onPress: () => handleAddToStory(),
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ]);
        } else {
          // Show retry dialog for intermediate failures
          const shouldRetry = await new Promise<boolean>((resolve) => {
            Alert.alert(
              'Upload Failed',
              `Failed to add story (attempt ${retryCount}/${maxRetries}). Would you like to retry?`,
              [
                {
                  text: 'Retry',
                  onPress: () => resolve(true),
                },
                {
                  text: 'Cancel',
                  style: 'cancel',
                  onPress: () => resolve(false),
                },
              ],
            );
          });

          if (!shouldRetry) {
            break; // User chose to cancel
          }

          // Wait a bit before retrying
          await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount));
        }
      }
    }

    setIsAddingToStory(false);
    setUploadProgress(0);
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

  // Progress indicator component
  function UploadProgressIndicator() {
    if (!isAddingToStory) return null;

    return (
      <View className="absolute left-0 right-0 top-1/2 items-center">
        <View className="rounded-lg bg-black/80 px-6 py-4">
          <Text className="mb-2 text-center text-white">Adding to Story...</Text>
          <View className="h-2 w-48 overflow-hidden rounded-full bg-gray-600">
            <View
              className="h-full rounded-full bg-purple-500"
              style={{ width: `${uploadProgress}%` }}
            />
          </View>
          <Text className="mt-2 text-center text-sm text-white">{uploadProgress}% Complete</Text>
        </View>
      </View>
    );
  }

  // Enhanced Photo Preview Screen
  if (photoUri) {
    return (
      <View className="flex-1 bg-black">
        {/* Photo Preview */}
        <View className="flex-1">
          {photoUri && (
            <FilteredImage imageUri={photoUri} filter={currentFilter} ref={filteredImageRef} />
          )}

          {/* Text Overlays */}
          {textOverlays.map((overlay) => (
            <TextOverlay
              key={overlay.id}
              overlay={overlay}
              onPositionChange={handleTextPositionChange}
              onPress={handleTextOverlayPress}
              isSelected={selectedTextId === overlay.id}
              onSelect={handleTextSelect}
              onDelete={handleTextDelete}
            />
          ))}
        </View>

        {/* Top Controls */}
        <View className="absolute left-0 right-0 top-12 flex-row items-center justify-between px-4">
          <TouchableOpacity
            className="rounded-full bg-black/50 p-3"
            onPress={handleBackToCamera}
            accessibilityLabel="Close"
          >
            <Text className="text-lg font-bold text-white">✕</Text>
          </TouchableOpacity>

          <View className="flex-row space-x-2">
            {/* Edit Button */}
            <TouchableOpacity
              className="rounded-full bg-black/50 px-4 py-2"
              onPress={() => setIsEditMode(!isEditMode)}
            >
              <Text className="font-bold text-white">{isEditMode ? 'Done' : 'Edit'}</Text>
            </TouchableOpacity>

            {/* Timer Controls - only show when not in edit mode */}
            {!isEditMode && (
              <>
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
              </>
            )}
          </View>
        </View>

        {/* Network Error Indicator */}
        {hasNetworkError && (
          <View className="absolute left-0 right-0 top-20 items-center">
            <View className="rounded-lg bg-red-500 px-4 py-2">
              <Text className="text-sm font-semibold text-white">⚠️ No Internet Connection</Text>
            </View>
          </View>
        )}

        {/* Bottom Controls */}
        <View className="absolute bottom-8 left-0 right-0 flex-row items-center justify-center space-x-4 px-4">
          <TouchableOpacity className="rounded-full bg-gray-600 px-6 py-3" onPress={handleSave}>
            <Text className="font-bold text-white">Save</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="rounded-full bg-purple-500 px-6 py-3"
            onPress={handleAddToStory}
            disabled={isAddingToStory}
          >
            {isAddingToStory ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="font-bold text-white">Add to Story</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity className="rounded-full bg-yellow-500 px-6 py-3" onPress={handleSend}>
            <Text className="font-bold text-black">Send</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Indicator */}
        {isAddingToStory && (photoUri || videoUri) && <UploadProgressIndicator />}

        {/* Photo Editing Toolbar */}
        <PhotoEditingToolbar
          isVisible={isEditMode}
          onFilterPress={handleFilterPress}
          onTextPress={handleTextPress}
          onUndoPress={handleUndoPress}
          onRedoPress={handleRedoPress}
          onResetPress={handleResetPress}
          onSavePress={handleSavePress}
          canUndo={canUndo}
          canRedo={canRedo}
          hasEdits={hasEdits}
          isSaving={isSaving}
          selectedFilter={currentFilter}
          onFilterSelect={handleFilterSelect}
          imageUri={photoUri || undefined}
        />

        {/* Text Edit Modal */}
        <TextEditModal
          visible={isTextModalVisible}
          overlay={editingOverlay}
          onSave={handleTextSave}
          onCancel={handleTextModalCancel}
          onDelete={handleTextModalDelete}
        />
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
            onPress={handleBackToCamera}
            accessibilityLabel="Close"
          >
            <Text className="text-lg font-bold text-white">✕</Text>
          </TouchableOpacity>
        </View>

        {/* Network Error Indicator */}
        {hasNetworkError && (
          <View className="absolute left-0 right-0 top-20 items-center">
            <View className="rounded-lg bg-red-500 px-4 py-2">
              <Text className="text-sm font-semibold text-white">⚠️ No Internet Connection</Text>
            </View>
          </View>
        )}

        {/* Bottom Controls */}
        <View className="absolute bottom-8 left-0 right-0 flex-row items-center justify-center space-x-4 px-4">
          <TouchableOpacity className="rounded-full bg-gray-600 px-6 py-3" onPress={handleSave}>
            <Text className="font-bold text-white">Save</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="rounded-full bg-purple-500 px-6 py-3"
            onPress={handleAddToStory}
            disabled={isAddingToStory}
          >
            {isAddingToStory ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="font-bold text-white">Add to Story</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity className="rounded-full bg-yellow-500 px-6 py-3" onPress={handleSend}>
            <Text className="font-bold text-black">Send</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Indicator */}
        {isAddingToStory && (photoUri || videoUri) && <UploadProgressIndicator />}

        {/* Photo Editing Toolbar */}
        <PhotoEditingToolbar
          isVisible={isEditMode}
          onFilterPress={handleFilterPress}
          onTextPress={handleTextPress}
          onUndoPress={handleUndoPress}
          onRedoPress={handleRedoPress}
          onResetPress={handleResetPress}
          onSavePress={handleSavePress}
          canUndo={canUndo}
          canRedo={canRedo}
          hasEdits={hasEdits}
          isSaving={isSaving}
          selectedFilter={currentFilter}
          onFilterSelect={handleFilterSelect}
          imageUri={photoUri || undefined}
        />
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
