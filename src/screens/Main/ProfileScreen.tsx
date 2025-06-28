/**
 * @file ProfileScreen.tsx
 * @description Profile screen displaying user information and friend management options.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { RootState } from '../../store';
import { logout } from '../../store/authSlice';
import { getFriendsList } from '../../services/friendService';
import { getUserStories } from '../../services/storyService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import Menu from '../../components/ui/Menu';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import StoriesGrid, { Story } from '../../components/ui/StoriesGrid';

/**
 * Displays the user's profile with basic information and navigation options.
 */
export default function ProfileScreen({ navigation }: { navigation: any }) {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const [friendCount, setFriendCount] = useState(0);
  const [snapCount, setSnapCount] = useState(0);
  const [storyCount, setStoryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [userStories, setUserStories] = useState<Story[]>([]);

  // Load user stats when component mounts
  useEffect(() => {
    if (user?.id) {
      loadUserStats();
      fetchUserStories();
    }
  }, [user?.id]);

  // Refresh stats when screen comes into focus (e.g., after adding friends)
  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        loadUserStats();
      }
    }, [user?.id]),
  );

  /**
   * Loads user statistics (friends, snaps, stories)
   */
  async function loadUserStats() {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Load friend count
      const friends = await getFriendsList(user.id);
      setFriendCount(friends.length);

      // Load story count
      const stories = await getUserStories(user.id, false); // Only active stories
      setStoryCount(stories.length);

      // TODO: Load snap count when that feature is implemented
      // For now, we'll keep it at 0
      setSnapCount(0);
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchUserStories() {
    if (!user?.id) return;
    try {
      const stories = await getUserStories(user.id, false);
      setUserStories(stories);
    } catch (error) {
      setUserStories([]);
    }
  }

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
    navigation.navigate('Settings');
  }

  // Helper to display username in title case
  function toTitleCase(str: string) {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  }
  const displayUsername = (user as any).username ? toTitleCase((user as any).username) : '';

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
        {/* Profile Info Card */}
        <View className="px-4 pb-4 pt-4">
          <View className="flex-row items-center">
            <View className="w-24 flex-shrink-0 items-center justify-center">
              {(user as any).avatar_url ? (
                <Image
                  source={{ uri: (user as any).avatar_url }}
                  className="h-24 w-24 rounded-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="h-24 w-24 items-center justify-center rounded-full bg-brand">
                  <Text className="font-heading text-4xl font-bold text-white">
                    {user.username?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
            </View>
            <View className="ml-4 flex-grow flex-row items-center justify-around">
              <View className="items-center">
                <Text className="text-text-primary font-heading text-lg font-bold">
                  {isLoading ? '...' : storyCount}
                </Text>
                <Text className="text-text-secondary text-xs">Stories</Text>
              </View>
              <View className="items-center">
                <Text className="text-text-primary font-heading text-lg font-bold">
                  {isLoading ? '...' : friendCount}
                </Text>
                <Text className="text-text-secondary text-xs">Friends</Text>
              </View>
              <View className="items-center">
                <Text className="text-text-primary font-heading text-lg font-bold">12</Text>
                <Text className="text-text-secondary text-xs">Vibes</Text>
              </View>
            </View>
          </View>
          {/* Name, Handle, and Bio Section */}
          <View className="pt-4">
            <Text className="text-text-primary font-heading text-base font-bold">
              {(user as any).displayName || displayUsername || 'User'}
            </Text>
            <Text className="text-text-secondary text-sm">@{user.username || 'username'}</Text>
            <Text className="text-text-primary mt-2 text-base">
              {(user as any).bio ||
                'Lover of squeaky toys & long walks on the beach. Professional napper. Send snacks.'}
            </Text>
          </View>
        </View>

        {/* Action Buttons Section */}
        {user.id === (user as any).id ? (
          // Own profile: Edit Profile and Add Friends, less prominent
          <View className="flex-row justify-center gap-4 px-4 pb-4">
            <Button
              label="Edit Profile"
              variant="secondary"
              onPress={() => navigation.navigate('Settings')}
              className="flex-1 rounded-xl bg-gray-200 py-2 text-sm text-gray-700"
            />
            <Button
              label="Add Friends"
              variant="secondary"
              onPress={handleAddFriends}
              className="flex-1 rounded-xl bg-gray-200 py-2 text-sm text-gray-700"
            />
          </View>
        ) : (
          // Friend or potential friend profile: Add Friend and Send Snap, bold CTAs
          <View className="flex-row justify-center gap-4 px-4 pb-4">
            <Button
              label="Add Friend"
              variant="primary"
              onPress={handleAddFriends}
              className="flex-1 rounded-xl py-2 text-sm shadow-lg"
            />
            <Button
              label="Send Snap"
              variant="secondary"
              onPress={() => {}}
              className="text-brand-red flex-1 rounded-xl bg-brand-light py-2 text-sm"
            />
          </View>
        )}

        {/* Tab Navigation */}
        <View className="border-b border-gray-200">
          <View className="flex-row justify-around">
            <TouchableOpacity className="border-text-primary flex-1 items-center border-b-2 py-3 text-center">
              <MaterialCommunityIcons name="view-grid" size={24} color="#2D2D2D" />
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 items-center py-3 text-center">
              <MaterialCommunityIcons name="account-group-outline" size={24} color="#AAB0B7" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Grid Section */}
        <View className="px-1 pb-4 pt-1">
          <StoriesGrid stories={userStories} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
