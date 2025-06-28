/**
 * @file StoriesScreen.tsx
 * @description UI skeleton for the Stories feed: horizontal scroll of avatars (your story first), username labels, loading and empty states.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { RootState } from '../../store';
import { getFriendsWithActiveStories, getUserStories } from '../../services/storyService';
import { clearAllStoryNotifications } from '../../services/realtimeService';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { StoriesStackParamList } from '../../navigation/types';
import type { MainTabParamList } from '../../navigation/types';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Avatar from '../../components/ui/Avatar';
import { StackActions } from '@react-navigation/native';

function StoryAvatar({ id, username, avatarUrl, isOwn, hasStory, isNew, onPress, ...props }: any) {
  if (!username) {
    console.warn('StoryAvatar missing username:', {
      username,
      avatarUrl,
      isOwn,
      hasStory,
      isNew,
      ...props,
    });
  }
  const displayName = typeof username === 'string' && username.length > 0 ? username : 'U';

  // Determine border color based on story status
  let borderColor = '#E5E7EB'; // Default gray
  if (isOwn && hasStory) {
    borderColor = '#FF8C69'; // Brand color for own story
  } else if (isNew) {
    borderColor = '#FF8C69'; // Brand color for new stories
  }

  return (
    <TouchableOpacity className="mx-2 items-center" onPress={onPress}>
      <Avatar
        avatarUrl={avatarUrl}
        username={displayName}
        size={64}
        borderColor={borderColor}
        borderWidth={4}
        backgroundColor={hasStory ? '#FF8C69' : '#E5E7EB'}
        textColor={hasStory ? '#FFFFFF' : '#6B7280'}
      />
      <Text className="mt-2 w-16 text-center font-heading text-xs" numberOfLines={1}>
        {isOwn ? (hasStory ? 'Your Story' : 'Add Story') : displayName}
      </Text>
    </TouchableOpacity>
  );
}

export default function StoriesScreen() {
  const user = useSelector((state: RootState) => state.auth.user);
  const realtimeState = useSelector((state: RootState) => state.realtime);

  const [isLoading, setIsLoading] = useState(true);
  const [stories, setStories] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<NativeStackNavigationProp<StoriesStackParamList>>();
  const tabNavigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();

  async function fetchStories() {
    if (!user?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [friends, myStories] = await Promise.all([
        getFriendsWithActiveStories(user.id),
        getUserStories(user.id, false), // Only active stories
      ]);
      // Map to UI format
      const hasMyStory = Array.isArray(myStories) && myStories.length > 0;
      const storyList = [
        {
          id: 'me',
          username: user.username,
          avatarUrl: user.avatar_url || '', // Use user's own avatar
          isOwn: true,
          hasStory: hasMyStory,
        },
        ...friends.map((f: any) => {
          return {
            id: f.user_id,
            username: f.username,
            avatarUrl: f.avatar_url || '',
            isOwn: false,
            hasStory: true,
            isNew: true,
          };
        }),
      ];
      setStories(storyList);
    } catch (err) {
      setError('Failed to load stories.');
      Alert.alert('Error', 'Failed to load stories.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchStories();
  }, [user?.id, user?.avatar_url]); // Also update if avatar changes

  // Refresh stories when screen comes into focus (e.g., returning from story viewer)
  useFocusEffect(
    React.useCallback(() => {
      // Clear story notifications when user intentionally views the stories list
      if (realtimeState.newStoryNotifications.length > 0) {
        clearAllStoryNotifications();
      }

      // Refresh stories list
      if (user?.id) {
        fetchStories();
      }
    }, [user?.id]),
  );

  // Refresh stories when there are new story notifications
  useEffect(() => {
    if (realtimeState.newStoryNotifications.length > 0 && user?.id) {
      fetchStories();
    }
  }, [realtimeState.newStoryNotifications.length, user?.id]);

  // Build usersWithStories array for StoryViewer
  const usersWithStories = stories
    .map((s) => (s.isOwn ? { ...s, id: user?.id } : s))
    .filter((s) => s.hasStory || s.isOwn);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center border-b border-gray-200 bg-white px-4 py-3">
        <Text className="text-text-primary font-heading text-2xl font-bold">Stories</Text>
      </View>
      <View className="py-6">
        {isLoading ? (
          <ActivityIndicator size="large" color="#FF8C69" />
        ) : error ? (
          <View className="items-center justify-center py-12">
            <Text className="font-heading text-lg text-error">{error}</Text>
          </View>
        ) : stories.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Text className="font-heading text-lg text-muted">No stories yet</Text>
            <Text className="font-heading text-sm text-muted">
              Your friends' stories will appear here
            </Text>
          </View>
        ) : (
          <FlatList
            data={stories}
            horizontal
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <StoryAvatar
                {...item}
                onPress={() => {
                  if (item.isOwn) {
                    // Switch to Camera tab and show CameraMain
                    tabNavigation.navigate('Camera', { screen: 'CameraMain' });
                  } else if (item.hasStory) {
                    const realId = item.isOwn ? user?.id : item.id;
                    const userIndex = usersWithStories.findIndex((u) => u.id === realId);
                    navigation.navigate('StoryViewer', {
                      userId: realId,
                      username: item.username,
                      avatarUrl: item.avatarUrl,
                      usersWithStories,
                      userIndex,
                    });
                  }
                }}
              />
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
