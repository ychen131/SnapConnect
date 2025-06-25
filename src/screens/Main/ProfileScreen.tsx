/**
 * @file ProfileScreen.tsx
 * @description Profile screen displaying user information and friend management options.
 */
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootState } from '../../store';
import { logout } from '../../store/authSlice';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

/**
 * Displays the user's profile with basic information and navigation options.
 */
export default function ProfileScreen({ navigation }: { navigation: any }) {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();

  /**
   * Handles user logout
   */
  function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          dispatch(logout());
          navigation.reset({
            index: 0,
            routes: [{ name: 'Auth' }],
          });
        },
      },
    ]);
  }

  /**
   * Navigates to Add Friends screen
   */
  function handleAddFriends() {
    navigation.navigate('AddFriends');
  }

  /**
   * Navigates to Settings screen
   */
  function handleSettings() {
    // TODO: Navigate to Settings screen when implemented
    Alert.alert('Coming Soon', 'Settings feature will be available soon!');
  }

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-lg text-gray-600">User not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="border-b border-gray-200 bg-white px-6 py-4">
          <Text className="text-2xl font-bold text-gray-800">Profile</Text>
        </View>

        {/* Profile Info Card */}
        <View className="p-6">
          <Card className="p-6">
            {/* Avatar Section */}
            <View className="mb-6 items-center">
              <View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-purple-500">
                <Text className="text-3xl font-bold text-white">
                  {user.username?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <Text className="text-xl font-bold text-gray-800">{user.username}</Text>
              <Text className="text-gray-500">{user.email}</Text>
            </View>

            {/* User Stats */}
            <View className="mb-6 flex-row justify-around">
              <View className="items-center">
                <Text className="text-2xl font-bold text-purple-600">0</Text>
                <Text className="text-sm text-gray-500">Friends</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-purple-600">0</Text>
                <Text className="text-sm text-gray-500">Snaps Sent</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-purple-600">0</Text>
                <Text className="text-sm text-gray-500">Stories</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Action Buttons */}
        <View className="space-y-4 px-6">
          <Button
            label="Add Friends"
            variant="primary"
            onPress={handleAddFriends}
            className="w-full"
          />

          <Button
            label="Settings"
            variant="secondary"
            onPress={handleSettings}
            className="w-full"
          />

          <Button label="Logout" variant="text" onPress={handleLogout} className="w-full" />
        </View>

        {/* App Info */}
        <View className="mt-8 p-6">
          <Card className="p-4">
            <Text className="text-center text-sm text-gray-500">SnapConnect v1.0.0</Text>
            <Text className="mt-1 text-center text-xs text-gray-400">
              Built with React Native & Expo
            </Text>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
