/**
 * @file permissionService.ts
 * @description Service for handling camera and microphone permissions in SnapDog.
 */
import { useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Alert, Linking, Platform } from 'react-native';

/**
 * Permission status types
 */
export type PermissionStatus = 'granted' | 'denied' | 'undetermined' | 'restricted';

/**
 * Permission result interface
 */
export interface PermissionResult {
  camera: PermissionStatus;
  microphone: PermissionStatus;
  allGranted: boolean;
}

/**
 * Hook to get camera permissions status and request function
 * @returns [permission, requestPermission] Camera permission hook result
 */
export function useCameraPermission() {
  return useCameraPermissions();
}

/**
 * Hook to get microphone permissions status and request function
 * @returns [permission, requestPermission] Microphone permission hook result
 */
export function useMicrophonePermission() {
  return useMicrophonePermissions();
}

/**
 * Requests camera permission and returns the status
 * @returns Promise<PermissionStatus> The camera permission status
 */
export async function requestCameraPermission(): Promise<PermissionStatus> {
  try {
    const [permission, requestPermission] = useCameraPermissions();
    if (!permission) return 'undetermined';

    if (permission.granted) return 'granted';

    const result = await requestPermission();
    return result.granted ? 'granted' : 'denied';
  } catch (error) {
    console.error('Error requesting camera permission:', error);
    return 'denied';
  }
}

/**
 * Requests microphone permission and returns the status
 * @returns Promise<PermissionStatus> The microphone permission status
 */
export async function requestMicrophonePermission(): Promise<PermissionStatus> {
  try {
    const [permission, requestPermission] = useMicrophonePermissions();
    if (!permission) return 'undetermined';

    if (permission.granted) return 'granted';

    const result = await requestPermission();
    return result.granted ? 'granted' : 'denied';
  } catch (error) {
    console.error('Error requesting microphone permission:', error);
    return 'denied';
  }
}

/**
 * Checks current camera permission status
 * @returns Promise<PermissionStatus> The current camera permission status
 */
export async function getCameraPermissionStatus(): Promise<PermissionStatus> {
  try {
    const [permission] = useCameraPermissions();
    if (!permission) return 'undetermined';
    return permission.granted ? 'granted' : 'denied';
  } catch (error) {
    console.error('Error getting camera permission status:', error);
    return 'undetermined';
  }
}

/**
 * Checks current microphone permission status
 * @returns Promise<PermissionStatus> The current microphone permission status
 */
export async function getMicrophonePermissionStatus(): Promise<PermissionStatus> {
  try {
    const [permission] = useMicrophonePermissions();
    if (!permission) return 'undetermined';
    return permission.granted ? 'granted' : 'denied';
  } catch (error) {
    console.error('Error getting microphone permission status:', error);
    return 'undetermined';
  }
}

/**
 * Requests both camera and microphone permissions
 * @returns Promise<PermissionResult> Object containing permission statuses
 */
export async function requestCameraAndMicrophonePermissions(): Promise<PermissionResult> {
  const cameraStatus = await requestCameraPermission();
  const microphoneStatus = await requestMicrophonePermission();

  return {
    camera: cameraStatus,
    microphone: microphoneStatus,
    allGranted: cameraStatus === 'granted' && microphoneStatus === 'granted',
  };
}

/**
 * Shows an alert to guide users to settings if permissions are denied
 * @param permissionType The type of permission that was denied
 */
export function showPermissionDeniedAlert(permissionType: 'camera' | 'microphone' | 'both'): void {
  const title = 'Permission Required';
  const message = `SnapDog needs ${permissionType === 'both' ? 'camera and microphone' : permissionType} access to function properly. Please enable it in your device settings.`;

  Alert.alert(
    title,
    message,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Open Settings',
        onPress: () => {
          if (Platform.OS === 'ios') {
            Linking.openURL('app-settings:');
          } else {
            Linking.openSettings();
          }
        },
      },
    ],
    { cancelable: false },
  );
}

/**
 * Checks if all required permissions are granted
 * @returns Promise<boolean> True if all permissions are granted
 */
export async function checkAllPermissionsGranted(): Promise<boolean> {
  const cameraStatus = await getCameraPermissionStatus();
  const microphoneStatus = await getMicrophonePermissionStatus();

  return cameraStatus === 'granted' && microphoneStatus === 'granted';
}

/**
 * Handles permission flow with user-friendly prompts
 * @returns Promise<boolean> True if all permissions were granted
 */
export async function handlePermissionFlow(): Promise<boolean> {
  // First check current status
  const cameraStatus = await getCameraPermissionStatus();
  const microphoneStatus = await getMicrophonePermissionStatus();

  // If already granted, return true
  if (cameraStatus === 'granted' && microphoneStatus === 'granted') {
    return true;
  }

  // Request permissions
  const result = await requestCameraAndMicrophonePermissions();

  if (result.allGranted) {
    return true;
  }

  // Handle denied permissions
  if (result.camera === 'denied' || result.microphone === 'denied') {
    const deniedPermissions: string[] = [];
    if (result.camera === 'denied') deniedPermissions.push('camera');
    if (result.microphone === 'denied') deniedPermissions.push('microphone');

    const permissionType =
      deniedPermissions.length === 2 ? 'both' : (deniedPermissions[0] as 'camera' | 'microphone');
    showPermissionDeniedAlert(permissionType);
  }

  return false;
}
