/**
 * @file PermissionScreen.tsx
 * @description Screen for requesting camera and microphone permissions after authentication.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import { setPermissionsRequested } from '../../store/authSlice';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { handlePermissionFlow } from '../../services/permissionService';

/**
 * Permission request screen component
 * @param navigation Navigation prop for moving to the main app
 */
export default function PermissionScreen({ navigation }: { navigation: any }) {
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'pending' | 'granted' | 'denied'>(
    'pending',
  );
  const dispatch = useDispatch();

  /**
   * Handles the permission request flow
   */
  async function handlePermissions() {
    setIsLoading(true);

    try {
      const granted = await handlePermissionFlow();

      // Mark that permissions have been requested (regardless of outcome)
      dispatch(setPermissionsRequested(true));

      if (granted) {
        setPermissionStatus('granted');
        // Navigate to main app after a brief delay to show success
        setTimeout(() => {
          navigation.replace('Main');
        }, 1000);
      } else {
        setPermissionStatus('denied');
      }
    } catch (error) {
      console.error('Error handling permissions:', error);
      Alert.alert('Error', 'Failed to request permissions. Please try again.');
      setPermissionStatus('denied');
      // Still mark as requested even if there was an error
      dispatch(setPermissionsRequested(true));
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Handles skipping permissions (user can still use app but with limited functionality)
   */
  function handleSkip() {
    // Mark that permissions have been requested (user chose to skip)
    dispatch(setPermissionsRequested(true));

    Alert.alert(
      'Limited Functionality',
      'You can still use SnapConnect, but camera and video features will be disabled. You can enable permissions later in settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => navigation.replace('Main') },
      ],
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="min-h-screen items-center justify-center px-6 py-8">
        <Card className="w-full max-w-sm rounded-lg bg-white p-6 shadow-sm">
          <View className="mb-6 items-center">
            <Text className="mb-2 text-center text-3xl font-bold text-purple-600">
              Welcome to SnapConnect!
            </Text>
            <Text className="text-center text-base text-gray-600">
              To get the full SnapConnect experience, we need a few permissions.
            </Text>
          </View>

          <View className="mb-6 space-y-4">
            <View className="flex-row items-center space-x-3">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                <Text className="font-bold text-purple-600">📷</Text>
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-800">Camera Access</Text>
                <Text className="text-sm text-gray-600">Take photos and record videos</Text>
              </View>
            </View>

            <View className="flex-row items-center space-x-3">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                <Text className="font-bold text-purple-600">🎤</Text>
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-gray-800">Microphone Access</Text>
                <Text className="text-sm text-gray-600">Record videos with sound</Text>
              </View>
            </View>
          </View>

          {permissionStatus === 'granted' && (
            <View className="mb-4 rounded-lg bg-green-50 p-3">
              <Text className="text-center font-medium text-green-700">
                ✅ Permissions granted! Setting up your experience...
              </Text>
            </View>
          )}

          {permissionStatus === 'denied' && (
            <View className="mb-4 rounded-lg bg-yellow-50 p-3">
              <Text className="text-center font-medium text-yellow-700">
                ⚠️ Some permissions were denied. You can still use the app with limited features.
              </Text>
            </View>
          )}

          <View className="space-y-3">
            <Button
              label={isLoading ? 'Requesting Permissions...' : 'Allow Permissions'}
              variant="primary"
              onPress={handlePermissions}
              disabled={isLoading || permissionStatus === 'granted'}
            />

            <Button
              label="Skip for Now"
              variant="text"
              onPress={handleSkip}
              disabled={isLoading || permissionStatus === 'granted'}
            />
          </View>

          <Text className="mt-4 text-center text-xs text-gray-500">
            You can change these permissions anytime in your device settings.
          </Text>
        </Card>
      </View>
    </View>
  );
}
