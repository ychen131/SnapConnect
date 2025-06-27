/**
 * @file permissionService.test.ts
 * @description Unit tests for permission service functions.
 */
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';
import { Alert, Linking, Platform } from 'react-native';
import {
  requestCameraPermission,
  requestMicrophonePermission,
  getCameraPermissionStatus,
  getMicrophonePermissionStatus,
  requestCameraAndMicrophonePermissions,
  checkAllPermissionsGranted,
  handlePermissionFlow,
  showPermissionDeniedAlert,
} from './permissionService';

// Mock expo-camera
jest.mock('expo-camera', () => ({
  Camera: {
    requestCameraPermissionsAsync: jest.fn(),
    getCameraPermissionsAsync: jest.fn(),
  },
}));

// Mock expo-av
jest.mock('expo-av', () => ({
  Audio: {
    requestPermissionsAsync: jest.fn(),
    getPermissionsAsync: jest.fn(),
  },
}));

// Mock react-native
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
  Linking: {
    openURL: jest.fn(),
    openSettings: jest.fn(),
  },
  Platform: {
    OS: 'ios',
  },
}));

describe('permissionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestCameraPermission', () => {
    it('should return granted status when permission is granted', async () => {
      (Camera.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await requestCameraPermission();
      expect(result).toBe('granted');
    });

    it('should return denied status when permission is denied', async () => {
      (Camera.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const result = await requestCameraPermission();
      expect(result).toBe('denied');
    });

    it('should return denied status when error occurs', async () => {
      (Camera.requestCameraPermissionsAsync as jest.Mock).mockRejectedValue(
        new Error('Permission error'),
      );

      const result = await requestCameraPermission();
      expect(result).toBe('denied');
    });
  });

  describe('requestMicrophonePermission', () => {
    it('should return granted status when permission is granted', async () => {
      (Audio.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await requestMicrophonePermission();
      expect(result).toBe('granted');
    });

    it('should return denied status when permission is denied', async () => {
      (Audio.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const result = await requestMicrophonePermission();
      expect(result).toBe('denied');
    });
  });

  describe('getCameraPermissionStatus', () => {
    it('should return current camera permission status', async () => {
      (Camera.getCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await getCameraPermissionStatus();
      expect(result).toBe('granted');
    });
  });

  describe('getMicrophonePermissionStatus', () => {
    it('should return current microphone permission status', async () => {
      (Audio.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await getMicrophonePermissionStatus();
      expect(result).toBe('granted');
    });
  });

  describe('requestCameraAndMicrophonePermissions', () => {
    it('should return all granted when both permissions are granted', async () => {
      (Camera.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Audio.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await requestCameraAndMicrophonePermissions();
      expect(result).toEqual({
        camera: 'granted',
        microphone: 'granted',
        allGranted: true,
      });
    });

    it('should return not all granted when one permission is denied', async () => {
      (Camera.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Audio.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const result = await requestCameraAndMicrophonePermissions();
      expect(result).toEqual({
        camera: 'granted',
        microphone: 'denied',
        allGranted: false,
      });
    });
  });

  describe('checkAllPermissionsGranted', () => {
    it('should return true when all permissions are granted', async () => {
      (Camera.getCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Audio.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await checkAllPermissionsGranted();
      expect(result).toBe(true);
    });

    it('should return false when one permission is not granted', async () => {
      (Camera.getCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Audio.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const result = await checkAllPermissionsGranted();
      expect(result).toBe(false);
    });
  });

  describe('showPermissionDeniedAlert', () => {
    it('should show alert with correct message for camera permission', () => {
      showPermissionDeniedAlert('camera');
      expect(Alert.alert).toHaveBeenCalledWith(
        'Permission Required',
        'SnapDog needs camera access to function properly. Please enable it in your device settings.',
        expect.any(Array),
        { cancelable: false },
      );
    });

    it('should show alert with correct message for microphone permission', () => {
      showPermissionDeniedAlert('microphone');
      expect(Alert.alert).toHaveBeenCalledWith(
        'Permission Required',
        'SnapDog needs microphone access to function properly. Please enable it in your device settings.',
        expect.any(Array),
        { cancelable: false },
      );
    });

    it('should show alert with correct message for both permissions', () => {
      showPermissionDeniedAlert('both');
      expect(Alert.alert).toHaveBeenCalledWith(
        'Permission Required',
        'SnapDog needs camera and microphone access to function properly. Please enable it in your device settings.',
        expect.any(Array),
        { cancelable: false },
      );
    });
  });

  describe('handlePermissionFlow', () => {
    it('should return true when permissions are already granted', async () => {
      (Camera.getCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Audio.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await handlePermissionFlow();
      expect(result).toBe(true);
    });

    it('should request permissions and return true when granted', async () => {
      (Camera.getCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'undetermined',
      });
      (Audio.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'undetermined',
      });
      (Camera.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Audio.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await handlePermissionFlow();
      expect(result).toBe(true);
    });

    it('should return false and show alert when permissions are denied', async () => {
      (Camera.getCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'undetermined',
      });
      (Audio.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'undetermined',
      });
      (Camera.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });
      (Audio.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await handlePermissionFlow();
      expect(result).toBe(false);
      expect(Alert.alert).toHaveBeenCalled();
    });
  });
});
