/**
 * @file SettingsScreen.tsx
 * @description Screen for editing user profile (avatar, username, bio) and logging out.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, ScrollView, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { Button } from '../../components/ui/Button';
import * as ImagePicker from 'expo-image-picker';
import { uploadMediaToStorage } from '../../services/snapService';
import { upsertUserProfile, getUserProfile } from '../../services/userService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { setUser, logout } from '../../store/authSlice';
import { useImagePreloader } from '../../hooks/useImagePreloader';
import CachedImage from '../../components/ui/CachedImage';
import { vibeCheckCacheService } from '../../services/vibeCheckCacheService';

export default function SettingsScreen({ navigation }: { navigation: any }) {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const { getCacheStats, clearCache } = useImagePreloader();
  const [cacheStats, setCacheStats] = useState<{
    totalEntries: number;
    totalSizeMB: number;
    oldestEntry: number;
    newestEntry: number;
  } | null>(null);
  const [vibeCheckCacheStats, setVibeCheckCacheStats] = useState<{
    totalEntries: number;
    totalSizeMB: number;
    oldestEntry: number;
    newestEntry: number;
    cacheHitRate: number;
  } | null>(null);

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="font-heading text-lg text-muted">User not found</Text>
      </View>
    );
  }
  const [username, setUsername] = useState((user as any).username || '');
  const [bio, setBio] = useState((user as any).bio || '');
  const [avatarUrl, setAvatarUrl] = useState(
    (user as any).avatar_url || (user as any).avatarUrl || '',
  );
  const [isSaving, setIsSaving] = useState(false);
  const [email, setEmail] = useState((user as any).email || '');

  // Load cache stats on mount
  useEffect(() => {
    loadCacheStats();
  }, []);

  async function loadCacheStats() {
    try {
      const [imageStats, vibeStats] = await Promise.all([
        getCacheStats(),
        vibeCheckCacheService.getCacheStats(),
      ]);
      setCacheStats(imageStats);
      setVibeCheckCacheStats(vibeStats);
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    }
  }

  // Header with back button
  function handleBack() {
    navigation.goBack();
  }

  // Avatar upload logic
  async function handleAvatarUpload() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets[0]?.uri) {
      try {
        const uploadedUrl = await uploadMediaToStorage(result.assets[0].uri, user!.id);
        setAvatarUrl(uploadedUrl);
      } catch (error) {
        Alert.alert('Upload Failed', 'Could not upload avatar.');
      }
    }
  }

  // Save profile changes
  async function handleSave() {
    setIsSaving(true);
    try {
      await upsertUserProfile(user!.id, {
        username,
        bio,
        avatar_url: avatarUrl,
        email,
      });
      // Fetch updated profile and update Redux
      const { data: updatedUser } = await getUserProfile(user!.id);
      if (updatedUser) dispatch(setUser(updatedUser));
      Alert.alert('Profile Updated', 'Your profile has been updated.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  }

  // Clear image cache
  async function handleClearCache() {
    Alert.alert(
      'Clear Image Cache',
      'This will remove all cached images from your device. Images will be re-downloaded when needed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearCache();
              await loadCacheStats();
              Alert.alert('Success', 'Image cache cleared successfully.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear image cache.');
            }
          },
        },
      ],
    );
  }

  // Clear vibe check cache
  async function handleClearVibeCheckCache() {
    Alert.alert(
      'Clear Vibe Check Cache',
      'This will remove all cached vibe check data from your device. Data will be re-fetched when needed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: async () => {
            try {
              await vibeCheckCacheService.clearCache();
              await loadCacheStats();
              Alert.alert('Success', 'Vibe check cache cleared successfully.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear vibe check cache.');
            }
          },
        },
      ],
    );
  }

  // Clear all caches
  async function handleClearAllCaches() {
    Alert.alert(
      'Clear All Caches',
      'This will remove all cached images and vibe check data from your device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all([clearCache(), vibeCheckCacheService.clearCache()]);
              await loadCacheStats();
              Alert.alert('Success', 'All caches cleared successfully.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear caches.');
            }
          },
        },
      ],
    );
  }

  // Placeholder for logout
  function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          dispatch(logout());
          // The RootNavigator will automatically handle navigation based on Redux state
        },
      },
    ]);
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <SafeAreaView edges={['top']} className="bg-white">
        <View className="flex-row items-center justify-between border-b border-gray-200 px-6 py-4">
          <TouchableOpacity onPress={handleBack}>
            <Text className="font-heading text-lg font-semibold text-brand">Back</Text>
          </TouchableOpacity>
          <Text className="text-text-primary font-heading text-xl font-bold">Edit Profile</Text>
          <View className="w-12" />
        </View>
      </SafeAreaView>
      {/* Avatar lower on the page */}
      <View className="mb-8 mt-8 items-center">
        <TouchableOpacity onPress={handleAvatarUpload} className="mb-4">
          {avatarUrl ? (
            <CachedImage
              uri={avatarUrl}
              style={{ width: 96, height: 96, borderRadius: 48 }}
              fallbackSource={require('../../../assets/icon.png')}
              showLoadingIndicator={false}
            />
          ) : (
            <View className="h-24 w-24 items-center justify-center rounded-full bg-brand-light">
              <Text className="font-heading text-4xl font-bold text-brand">
                {username.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          <Text className="mt-2 font-heading text-sm text-brand">Change Avatar</Text>
        </TouchableOpacity>
      </View>
      <View className="mb-6 px-6">
        <Text className="text-text-primary mb-2 font-heading text-base font-bold">Username</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 font-heading text-base"
          placeholder="Enter your username"
        />
      </View>
      <View className="mb-8 px-6">
        <Text className="text-text-primary mb-2 font-heading text-base font-bold">Bio</Text>
        <TextInput
          value={bio}
          onChangeText={setBio}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 font-heading text-base"
          placeholder="Tell us about yourself..."
          multiline
          numberOfLines={3}
        />
      </View>
      <View className="mb-6 px-6">
        <Text className="text-text-primary mb-2 font-heading text-base font-bold">Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 font-heading text-base"
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      {/* Image Cache Management Section */}
      <View className="mb-6 px-6">
        <Text className="text-text-primary mb-4 font-heading text-lg font-bold">Image Cache</Text>
        <View className="rounded-lg border border-gray-200 bg-white p-4">
          {cacheStats ? (
            <View>
              <View className="mb-3 flex-row justify-between">
                <Text className="text-text-secondary font-heading text-sm">Cached Images:</Text>
                <Text className="font-heading text-sm font-semibold">
                  {cacheStats.totalEntries}
                </Text>
              </View>
              <View className="mb-3 flex-row justify-between">
                <Text className="text-text-secondary font-heading text-sm">Cache Size:</Text>
                <Text className="font-heading text-sm font-semibold">
                  {cacheStats.totalSizeMB.toFixed(1)} MB
                </Text>
              </View>
              <View className="mb-4 flex-row justify-between">
                <Text className="text-text-secondary font-heading text-sm">Oldest Entry:</Text>
                <Text className="font-heading text-sm font-semibold">
                  {cacheStats.oldestEntry
                    ? new Date(cacheStats.oldestEntry).toLocaleDateString()
                    : 'N/A'}
                </Text>
              </View>
            </View>
          ) : (
            <Text className="text-text-secondary font-heading text-sm">Loading cache stats...</Text>
          )}
          <Button
            label="Clear Image Cache"
            variant="secondary"
            onPress={handleClearCache}
            className="mt-2"
          />
        </View>
      </View>

      {/* Vibe Check Cache Management Section */}
      <View className="mb-6 px-6">
        <Text className="text-text-primary mb-4 font-heading text-lg font-bold">
          Vibe Check Cache
        </Text>
        <View className="rounded-lg border border-gray-200 bg-white p-4">
          {vibeCheckCacheStats ? (
            <View>
              <View className="mb-3 flex-row justify-between">
                <Text className="text-text-secondary font-heading text-sm">Cached Users:</Text>
                <Text className="font-heading text-sm font-semibold">
                  {vibeCheckCacheStats.totalEntries}
                </Text>
              </View>
              <View className="mb-3 flex-row justify-between">
                <Text className="text-text-secondary font-heading text-sm">Cache Size:</Text>
                <Text className="font-heading text-sm font-semibold">
                  {vibeCheckCacheStats.totalSizeMB.toFixed(1)} MB
                </Text>
              </View>
              <View className="mb-3 flex-row justify-between">
                <Text className="text-text-secondary font-heading text-sm">Cache Hit Rate:</Text>
                <Text className="font-heading text-sm font-semibold">
                  {vibeCheckCacheStats.cacheHitRate.toFixed(1)}%
                </Text>
              </View>
              <View className="mb-4 flex-row justify-between">
                <Text className="text-text-secondary font-heading text-sm">Oldest Entry:</Text>
                <Text className="font-heading text-sm font-semibold">
                  {vibeCheckCacheStats.oldestEntry
                    ? new Date(vibeCheckCacheStats.oldestEntry).toLocaleDateString()
                    : 'N/A'}
                </Text>
              </View>
            </View>
          ) : (
            <Text className="text-text-secondary font-heading text-sm">Loading cache stats...</Text>
          )}
          <Button
            label="Clear Vibe Check Cache"
            variant="secondary"
            onPress={handleClearVibeCheckCache}
            className="mt-2"
          />
        </View>
      </View>

      {/* Clear All Caches Section */}
      <View className="mb-6 px-6">
        <Text className="text-text-primary mb-4 font-heading text-lg font-bold">
          Cache Management
        </Text>
        <Button
          label="Clear All Caches"
          variant="secondary"
          onPress={handleClearAllCaches}
          className="border-red-200 bg-red-50 text-red-700"
        />
      </View>

      <View className="px-6">
        <Button
          label={isSaving ? 'Saving...' : 'Save Changes'}
          variant="primary"
          onPress={handleSave}
          className="mb-8"
          disabled={isSaving}
        />
        <Button label="Logout" variant="text" onPress={handleLogout} className="text-error" />
      </View>
    </ScrollView>
  );
}
