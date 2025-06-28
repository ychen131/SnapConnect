/**
 * @file SettingsScreen.tsx
 * @description Screen for editing user profile (avatar, username, bio) and logging out.
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, ScrollView, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { Button } from '../../components/ui/Button';
import * as ImagePicker from 'expo-image-picker';
import { uploadMediaToStorage } from '../../services/snapService';
import { upsertUserProfile, getUserProfile } from '../../services/userService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { setUser, logout } from '../../store/authSlice';
import { navigationRef } from '../../navigation/navigationRef';

export default function SettingsScreen({ navigation }: { navigation: any }) {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-lg text-gray-600">User not found</Text>
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

  // Placeholder for logout
  function handleLogout() {
    dispatch(logout());
    if (navigationRef.isReady()) {
      navigationRef.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
    }
  }

  return (
    <ScrollView className="flex-1 bg-white">
      {/* Header */}
      <SafeAreaView edges={['top']} className="bg-white">
        <View className="flex-row items-center justify-between border-b border-gray-100 px-4 py-4">
          <TouchableOpacity
            onPress={handleBack}
            style={{ minWidth: 48, minHeight: 40, justifyContent: 'center' }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text className="font-heading text-lg text-brand">&lt; Back</Text>
          </TouchableOpacity>
          <Text
            className="text-text-primary flex-1 text-center font-heading text-lg font-bold"
            style={{ marginLeft: -48 }}
          >
            Edit Profile
          </Text>
          <View style={{ width: 48 }} />
        </View>
      </SafeAreaView>
      {/* Avatar lower on the page */}
      <View className="mb-8 mt-8 items-center">
        <TouchableOpacity onPress={handleAvatarUpload} className="mb-4">
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} className="h-24 w-24 rounded-full" />
          ) : (
            <View className="h-24 w-24 items-center justify-center rounded-full bg-gray-200">
              <Text className="font-heading text-4xl font-bold text-gray-400">
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
      <View className="px-6">
        <Button
          label={isSaving ? 'Saving...' : 'Save Changes'}
          variant="primary"
          onPress={handleSave}
          className="mb-8"
          disabled={isSaving}
        />
        <Button label="Logout" variant="text" onPress={handleLogout} className="text-red-500" />
      </View>
    </ScrollView>
  );
}
