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
  useWindowDimensions,
  Image as RNImage,
  Dimensions,
} from 'react-native';
import { CameraView, CameraType } from 'expo-camera';
import { useCameraPermission } from '../../services/permissionService';
import { Video, ResizeMode } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CameraStackParamList } from '../../navigation/types';
import { RootState } from '../../store';
import { addToStory } from '../../services/storyService';
import { uploadMediaToStorage } from '../../services/snapService';
import { analyzeDogImageWithValidation } from '../../services/vibeCheckService';
import { performVibeCheck, performVibeCheckOptimized } from '../../store/vibeCheckSlice';
import { clearVibeCheck, getErrorInfo } from '../../store/vibeCheckSlice';
import type { AppDispatch } from '../../store/store';
import PhotoEditingToolbar from '../../components/camera/PhotoEditingToolbar';
import TextOverlay from '../../components/camera/TextOverlay';
import TextEditModal from '../../components/camera/TextEditModal';
import {
  applyFilter,
  composeImageWithOverlays,
  composeImageWithVibeCheckSticker,
  createTextOverlay,
  updateTextOverlay,
  exportEditedImage,
  type FilterType,
  type TextOverlay as TextOverlayType,
} from '../../utils/imageFilters';
import FilteredImage from '../../components/camera/FilteredImage';
import * as FileSystem from 'expo-file-system';
import { ImageFormat } from '@shopify/react-native-skia';
import Toast from '../../components/ui/Toast';
import VibeCheckSticker from '../../components/editor/VibeCheckSticker';
import VibeCheckReport from '../../components/report/VibeCheckReport';
import { checkNetworkConnectivity, isNetworkError } from '../../utils/networkUtils';
import { VibeCheckHistoryItem } from '../../components/ui/VibeCheckHistoryGrid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  uploadImageToSupabaseStorage,
  saveVibeCheckToCloud,
} from '../../services/vibeCheckService';

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
  const dispatch = useDispatch<AppDispatch>();

  // Redux state selectors
  const vibeCheckState = useSelector((state: RootState) => state.vibeCheck);
  const {
    status,
    shortSummary,
    detailedReport,
    sourceURL,
    confidence,
    error,
    retryCount,
    lastErrorType,
  } = vibeCheckState;

  // Calculate error info for UI
  const errorInfo = lastErrorType ? getErrorInfo(lastErrorType, retryCount) : null;

  // Edit history stack for undo/redo
  interface EditState {
    filter: FilterType;
    textOverlays: TextOverlayType[];
  }
  const MAX_HISTORY = 20;
  const [editHistory, setEditHistory] = useState<EditState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Add backup state
  const [editModeBackup, setEditModeBackup] = useState<{
    filter: FilterType;
    overlays: TextOverlayType[];
  } | null>(null);

  // Toast state (keep local for UI feedback)
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'info' | 'success' | 'error'>('info');
  const [showReport, setShowReport] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Vibe Check state
  const [currentVibeCheck, setCurrentVibeCheck] = useState<VibeCheckHistoryItem | null>(null);

  // Saved Vibe Checks state
  const [savedVibeChecks, setSavedVibeChecks] = useState<VibeCheckHistoryItem[]>([]);

  // Add state for upload progress and pending vibe check
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [pendingVibeCheck, setPendingVibeCheck] = useState<any>(null); // Store the result to be saved
  const [publicImageUrl, setPublicImageUrl] = useState<string | null>(null);

  // Add state for capturing composed image with overlays
  const [isComposingImage, setIsComposingImage] = useState(false);

  const { height: windowHeight, width: windowWidth } = Dimensions.get('window');
  const insets = useSafeAreaInsets();
  // Estimate top and bottom controls height (adjust as needed)
  const controlsHeight = 0; // e.g., 120 top + 140 bottom
  const previewHeight = windowHeight; // - controlsHeight - insets.top - insets.bottom;
  const maxPreviewHeight = windowHeight;

  // Initialize history when a photo is taken
  useEffect(() => {
    if (photoUri) {
      const initialState: EditState = {
        filter: 'original',
        textOverlays: [],
      };
      setEditHistory([initialState]);
      setHistoryIndex(0);
    } else {
      setEditHistory([]);
      setHistoryIndex(-1);
    }
  }, [photoUri]);

  // Check network connectivity periodically
  useEffect(() => {
    const checkNetwork = async () => {
      const isConnected = await checkNetworkConnectivity();
      setIsOffline(!isConnected);
    };

    // Check immediately
    checkNetwork();

    // Check every 30 seconds
    const interval = setInterval(checkNetwork, 30000);

    return () => clearInterval(interval);
  }, []);

  // Preload the photo image when photoUri changes
  useEffect(() => {
    if (photoUri) {
      Image.prefetch(photoUri)
        .then(() => {
          console.log('📸 Image preloaded:', photoUri);
        })
        .catch((err) => {
          console.warn('⚠️ Failed to preload image:', photoUri, err);
        });
    }
  }, [photoUri]);

  // When Vibe Check is successful, set currentVibeCheck
  useEffect(() => {
    if (shortSummary && detailedReport && photoUri && status === 'succeeded') {
      setCurrentVibeCheck({
        id: `${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
        summary: shortSummary,
        detailedReport,
        photoUri,
        timestamp: new Date().toISOString(),
      });
    }
  }, [shortSummary, detailedReport, photoUri, status]);

  // Load saved Vibe Checks on mount
  useEffect(() => {
    AsyncStorage.getItem('savedVibeChecks').then((data) => {
      setSavedVibeChecks(data ? JSON.parse(data) : []);
    });
  }, []);

  async function handlePhotoLibraryUpload() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  }

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
    setFilteredImageUri(null);
    setIsTextModalVisible(false);
    setEditingOverlay(null);
  }

  // Photo editing toolbar handlers
  function handleFilterPress() {
    // Filter selection is now handled by the FilterCarousel
    console.log('🎨 Filter button pressed');
  }

  // Helper to push a new edit state to history
  function pushEditState(newState: EditState) {
    setEditHistory((prev) => {
      let history = prev.slice(0, historyIndex + 1); // Truncate redo history
      history.push(newState);
      if (history.length > MAX_HISTORY) history = history.slice(history.length - MAX_HISTORY);
      return history;
    });
    setHistoryIndex((prev) => {
      let next = prev + 1;
      if (next >= MAX_HISTORY) next = MAX_HISTORY - 1;
      return next;
    });
    setCanUndo(true);
    setCanRedo(false);
  }

  function handleFilterSelect(filter: FilterType) {
    console.log('🎨 Filter selected:', filter);
    setCurrentFilter(filter);
    if (filter !== 'original') setHasEdits(true);
    if (photoUri) applyFilterToImage(photoUri, filter);
    // Push to history
    pushEditState({ filter, textOverlays });
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
    const newOverlay = createTextOverlay('Tap to edit', 100, 200, 24, '#FFFFFF', 'System');
    const newOverlays = [...textOverlays, newOverlay];
    setTextOverlays(newOverlays);
    setSelectedTextId(newOverlay.id);
    setHasEdits(true);
    setCanUndo(true);
    // Push to history
    pushEditState({ filter: currentFilter, textOverlays: newOverlays });
    // Open text editor modal for new overlay
    setIsTextModalVisible(true);
    setEditingOverlay(newOverlay);
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
      setHasEdits(newOverlays.length > 0 || currentFilter !== 'original');
      // Push to history
      pushEditState({ filter: currentFilter, textOverlays: newOverlays });
      return newOverlays;
    });
    if (selectedTextId === id) setSelectedTextId(null);
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
    setTextOverlays((prev) => {
      const newOverlays = prev.map((overlay) =>
        overlay.id === updatedOverlay.id ? updatedOverlay : overlay,
      );
      // Push to history
      pushEditState({ filter: currentFilter, textOverlays: newOverlays });
      return newOverlays;
    });
    setIsTextModalVisible(false);
    setEditingOverlay(null);
  }

  function handleTextModalCancel() {
    setIsTextModalVisible(false);
    setEditingOverlay(null);
  }

  function handleTextModalDelete() {
    if (editingOverlay) {
      const updatedOverlays = textOverlays.filter((overlay) => overlay.id !== editingOverlay.id);
      setTextOverlays(updatedOverlays);
      pushEditState({
        filter: currentFilter,
        textOverlays: updatedOverlays,
      });
      setIsTextModalVisible(false);
      setEditingOverlay(null);
    }
  }

  function handleUndoPress() {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const state = editHistory[newIndex];
      setCurrentFilter(state.filter);
      setTextOverlays(state.textOverlays);
      setCanUndo(newIndex > 0);
      setCanRedo(true);
    }
  }

  function handleRedoPress() {
    if (historyIndex < editHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const state = editHistory[newIndex];
      setCurrentFilter(state.filter);
      setTextOverlays(state.textOverlays);
      setCanUndo(true);
      setCanRedo(newIndex < editHistory.length - 1);
    }
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

  /**
   * Captures the current photo with all overlays (filters, text, and Vibe Check sticker)
   * and returns the composed image URI
   */
  async function captureComposedImage(): Promise<string> {
    if (!photoUri) {
      throw new Error('No photo available for composition');
    }

    setIsComposingImage(true);
    try {
      console.log('🎨 Capturing composed image with overlays...');

      // If we have a filtered image, use that as the base
      let baseImageUri = filteredImageUri || photoUri;

      // If we have text overlays, compose them with the base image
      if (textOverlays.length > 0) {
        console.log(`📝 Composing ${textOverlays.length} text overlays...`);
        baseImageUri = await composeImageWithOverlays(baseImageUri, currentFilter, textOverlays);
      }

      // If we have a Vibe Check sticker, we need to render it on the image
      if (shortSummary && status === 'succeeded') {
        console.log('✨ Adding Vibe Check sticker to composed image...');
        baseImageUri = await composeImageWithVibeCheckSticker(baseImageUri, shortSummary, {
          x: 100,
          y: 200,
        });
      }

      console.log('✅ Composed image captured successfully');
      return baseImageUri;
    } catch (error) {
      console.error('❌ Failed to capture composed image:', error);
      // Fallback to original photo
      return photoUri;
    } finally {
      setIsComposingImage(false);
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
          // Capture the composed image with all overlays (filters, text, Vibe Check sticker)
          const composedImageUri = await captureComposedImage();
          mediaUrl = await uploadMediaToStorage(composedImageUri, user.id);
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

        // Add Vibe Check metadata to the story if available
        const storyMetadata =
          shortSummary && status === 'succeeded' && confidence !== null
            ? {
                vibe_check_summary: shortSummary,
                vibe_check_confidence: confidence,
                vibe_check_source_url: sourceURL || '',
              }
            : undefined;

        // Debug: Log Vibe Check metadata being passed
        if (storyMetadata) {
          console.log('🔍 Passing Vibe Check metadata to story:', storyMetadata);
        } else {
          console.log(
            '🔍 No Vibe Check metadata to pass (shortSummary:',
            shortSummary,
            'status:',
            status,
            'confidence:',
            confidence,
            ')',
          );
        }

        const story = await addToStory(user.id, mediaUrl, mediaType, timer, true, storyMetadata);

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

  function enterEditMode() {
    setEditModeBackup({ filter: currentFilter, overlays: textOverlays });
    setIsEditMode(true);
  }

  // Vibe Check handler
  async function handleVibeCheckPress() {
    if (!photoUri || !user?.id) {
      console.log('❌ No photo or user available for Vibe Check');
      return;
    }

    try {
      // Check network connectivity first
      const isConnected = await checkNetworkConnectivity();
      if (!isConnected) {
        setToastMessage('No internet connection. Please check your network settings.');
        setToastType('error');
        setToastVisible(true);
        return;
      }

      // Show loading toast
      setToastMessage("Checking your pup's vibe... 🐾");
      setToastType('info');
      setToastVisible(true);

      // 1. Upload image to Supabase Storage
      setIsUploadingImage(true);
      let uploadedImageUrl = '';
      try {
        uploadedImageUrl = await uploadImageToSupabaseStorage(photoUri, user.id);
        setPublicImageUrl(uploadedImageUrl);
      } catch (uploadErr) {
        setIsUploadingImage(false);
        setToastMessage('Image upload failed. Please try again.');
        setToastType('error');
        setToastVisible(true);
        return;
      }
      setIsUploadingImage(false);

      // 2. Run Vibe Check analysis (using the uploaded image URL if needed)
      const result = await dispatch(
        performVibeCheckOptimized({ imageUri: photoUri, userId: user.id }),
      ).unwrap();

      // 3. Store the result and image URL in local state for the report modal
      setPendingVibeCheck({
        ...result,
        source_url: uploadedImageUrl,
      });

      setToastMessage(`Vibe Check Complete! ${result.short_summary}`);
      setToastType('success');
      setToastVisible(true);
    } catch (error) {
      console.error('❌ Vibe Check failed:', error);

      // Determine if it's a network error
      const isNetworkIssue = isNetworkError(error as Error);

      // Show appropriate error message
      let errorMessage = 'Vibe Check failed. Please try again.';
      if (isNetworkIssue) {
        errorMessage =
          'Network connection issue. Please check your internet connection and try again.';
      } else {
        const errorObj = error as any;
        errorMessage = errorObj?.message || 'Something went wrong. Please try again.';
      }

      setToastMessage(errorMessage);
      setToastType('error');
      setToastVisible(true);
    }
  }

  // Handler for Save to Profile button in the report modal
  async function handleSaveToProfileFromCamera() {
    if (!pendingVibeCheck || !user?.id || !publicImageUrl) return;
    try {
      await saveVibeCheckToCloud({
        user_id: user.id,
        session_id: Date.now().toString(),
        short_summary: pendingVibeCheck.short_summary,
        detailed_report: pendingVibeCheck.detailed_report,
        source_url: publicImageUrl,
        confidence_score: pendingVibeCheck.confidence,
        analysis_data: pendingVibeCheck.analysis,
        request_timestamp: new Date().toISOString(),
      });
      setToastMessage('Vibe check saved to profile!');
      setToastType('success');
      setToastVisible(true);
      setShowReport(false);
      setPendingVibeCheck(null);
      setPublicImageUrl(null);
    } catch (err) {
      setToastMessage('Failed to save vibe check.');
      setToastType('error');
      setToastVisible(true);
    }
  }

  // Enhanced Photo Preview Screen
  if (photoUri) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'bg-primary' }}>
        <View
          style={{
            flex: 1,
            // alignItems: 'center',
            // justifyContent: 'center',
            backgroundColor: 'black',
          }}
        >
          {photoUri && (
            <RNImage
              source={{ uri: photoUri }}
              style={{
                width: windowWidth,
                height: maxPreviewHeight,
                resizeMode: 'cover',
                backgroundColor: 'black',
              }}
            />
          )}
        </View>

        {/* Text Overlays */}
        <View pointerEvents={isEditMode ? 'auto' : 'none'} style={{ flex: 1 }}>
          {textOverlays.map((overlay) => (
            <TextOverlay
              key={overlay.id}
              overlay={overlay}
              onPositionChange={handleTextPositionChange}
              onPress={handleTextOverlayPress}
              isSelected={selectedTextId === overlay.id}
              onSelect={handleTextSelect}
              onDelete={handleTextDelete}
              isEditMode={isEditMode}
            />
          ))}
        </View>

        {/* Top Controls */}
        <View className="absolute left-0 right-0 top-12 flex-row items-center justify-between px-4">
          <TouchableOpacity
            className="rounded-full bg-black/50 p-3"
            onPress={() => {
              // Reset all relevant state to return to camera view
              setPhotoUri(null);
              setVideoUri(null);
              dispatch(clearVibeCheck());
              setShowReport(false);
              setIsEditMode(false);
              setSelectedTextId(null);
              setIsTextModalVisible(false);
              setEditingOverlay(null);
              setEditModeBackup(null);
              setTextOverlays([]);
              setCurrentFilter('original');
            }}
            accessibilityLabel="Close"
          >
            <Text className="text-lg font-bold text-white">✕</Text>
          </TouchableOpacity>

          <View className="flex-row items-center space-x-2">
            {/* Vibe Check Button */}
            <TouchableOpacity
              className={`flex-row items-center rounded-full px-4 py-2 ${
                isOffline
                  ? 'bg-gray-400'
                  : status === 'loading'
                    ? 'bg-yellow-400'
                    : status === 'failed' && errorInfo?.canRetry
                      ? 'bg-red-400'
                      : 'bg-yellow-400'
              }`}
              onPress={handleVibeCheckPress}
              disabled={status === 'loading' || isOffline}
              accessibilityLabel="Vibe Check"
            >
              {status === 'loading' ? (
                <ActivityIndicator size="small" color="black" />
              ) : isOffline ? (
                <Text className="text-lg font-bold" style={{ marginRight: 4 }}>
                  📡
                </Text>
              ) : status === 'failed' && errorInfo ? (
                <Text className="text-lg font-bold" style={{ marginRight: 4 }}>
                  {errorInfo.icon}
                </Text>
              ) : (
                <Text className="text-lg font-bold" style={{ marginRight: 4 }}>
                  🐾
                </Text>
              )}
              <Text
                className={`font-bold ${
                  isOffline
                    ? 'text-gray-600'
                    : status === 'failed' && errorInfo?.canRetry
                      ? 'text-white'
                      : 'text-black'
                }`}
              >
                {isOffline
                  ? 'Offline'
                  : status === 'loading'
                    ? 'Checking...'
                    : status === 'failed' && errorInfo?.canRetry
                      ? 'Retry'
                      : 'Vibe Check'}
              </Text>
            </TouchableOpacity>

            {/* Edit Button */}
            <TouchableOpacity
              className="rounded-full bg-black/50 px-4 py-2"
              onPress={() =>
                isEditMode
                  ? (setIsEditMode(false),
                    setSelectedTextId(null),
                    setIsTextModalVisible(false),
                    setEditingOverlay(null),
                    setEditModeBackup(null))
                  : enterEditMode()
              }
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

        {/* Offline Indicator */}
        {isOffline && (
          <View className="absolute left-0 right-0 top-20 items-center">
            <View className="rounded-lg bg-orange-500 px-4 py-2">
              <Text className="text-sm font-semibold text-white">
                📡 You're offline - Vibe Check unavailable
              </Text>
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
          onVibeCheckPress={handleVibeCheckPress}
          onUndoPress={handleUndoPress}
          onRedoPress={handleRedoPress}
          onResetPress={handleResetPress}
          onSavePress={handleSavePress}
          canUndo={canUndo}
          canRedo={canRedo}
          hasEdits={hasEdits}
          isSaving={isSaving}
          isVibeChecking={status === 'loading'}
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

        {/* Toast Notifications */}
        <Toast
          visible={toastVisible}
          message={toastMessage}
          type={toastType}
          duration={toastType === 'info' ? 2000 : 4000}
          onHide={() => setToastVisible(false)}
        />

        {/* Vibe Check Sticker (show after Vibe Check attempt - success or error) */}
        {photoUri && (shortSummary || error) && (
          <VibeCheckSticker
            summary={shortSummary || 'Vibe Check failed'}
            onLearnWhy={() => setShowReport(true)}
            initialPosition={{ x: 0, y: 0 }}
            isLoading={status === 'loading'}
            error={errorInfo?.message || error || undefined}
            onRetry={errorInfo?.canRetry ? handleVibeCheckPress : undefined}
            photoUri={photoUri}
            isSuccess={!!shortSummary && status === 'succeeded' && !error}
            mode={isEditMode ? 'edit' : 'preview'}
            bottomOffset={120} // Adjust as needed to sit above bottom controls
          />
        )}

        {/* Vibe Check Report Modal */}
        {pendingVibeCheck && (
          <VibeCheckReport
            visible={showReport}
            onClose={() => setShowReport(false)}
            report={pendingVibeCheck.detailed_report}
            photoUri={publicImageUrl || undefined}
            isLoading={false}
            onSaveToProfile={handleSaveToProfileFromCamera}
          />
        )}

        {/* Uploading Image Indicator */}
        {isUploadingImage && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,0.4)',
              zIndex: 100,
            }}
          >
            <ActivityIndicator size="large" color="#FFD700" />
            <Text style={{ color: '#FFD700', marginTop: 16 }}>Uploading image...</Text>
          </View>
        )}
      </SafeAreaView>
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
            onPress={() => {
              handleBackToCamera();
              setSelectedTextId(null);
              setIsTextModalVisible(false);
              setEditingOverlay(null);
              setEditModeBackup(null);
            }}
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

        {/* Offline Indicator */}
        {isOffline && (
          <View className="absolute left-0 right-0 top-20 items-center">
            <View className="rounded-lg bg-orange-500 px-4 py-2">
              <Text className="text-sm font-semibold text-white">
                📡 You're offline - Vibe Check unavailable
              </Text>
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
          onVibeCheckPress={handleVibeCheckPress}
          onUndoPress={handleUndoPress}
          onRedoPress={handleRedoPress}
          onResetPress={handleResetPress}
          onSavePress={handleSavePress}
          canUndo={canUndo}
          canRedo={canRedo}
          hasEdits={hasEdits}
          isSaving={isSaving}
          isVibeChecking={status === 'loading'}
          selectedFilter={currentFilter}
          onFilterSelect={handleFilterSelect}
          imageUri={photoUri || undefined}
        />

        {/* Toast Notifications */}
        <Toast
          visible={toastVisible}
          message={toastMessage}
          type={toastType}
          duration={toastType === 'info' ? 2000 : 4000}
          onHide={() => setToastVisible(false)}
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
        zoom={facing === 'back' ? 0.05 : 0}
      />
      {/* Overlay UI */}
      {/* Camera Controls Row */}
      <View className="absolute bottom-8 left-0 right-0 flex-row items-center justify-center space-x-12">
        {/* Photo Library Icon Button */}
        <TouchableOpacity
          className="mr-6 items-center justify-center"
          onPress={handlePhotoLibraryUpload}
          accessibilityLabel="Open Photo Library"
        >
          <MaterialCommunityIcons name="image-multiple" size={40} color="#222" />
        </TouchableOpacity>
        {/* Capture Button */}
        <View className="relative">
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
        {/* Flip Camera Icon Button */}
        <TouchableOpacity
          className="ml-6 items-center justify-center"
          onPress={toggleCameraFacing}
          accessibilityLabel="Flip Camera"
        >
          <MaterialCommunityIcons name="camera-flip" size={40} color="#222" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
