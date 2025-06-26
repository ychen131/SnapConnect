/**
 * @file MyStoriesScreen.tsx
 * @description Screen for users to view, manage, and delete their own stories.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  getUserStories,
  deleteStory,
  updateStoryPrivacy,
  Story,
} from '../../services/storyService';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../../navigation/types';

/**
 * Displays user's stories with management options
 */
export default function MyStoriesScreen({ navigation }: { navigation: any }) {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = useSelector((state: RootState) => state.auth.user);
  const storiesNavigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();

  useEffect(() => {
    if (user?.id) {
      fetchStories();
    }
  }, [user?.id]);

  /**
   * Fetches user's stories
   */
  async function fetchStories() {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);
      const userStories = await getUserStories(user.id, false); // Only active stories
      setStories(userStories);
    } catch (error) {
      console.error('Error fetching stories:', error);
      setError('Failed to load your stories. Please try again.');

      // Show alert for immediate feedback
      Alert.alert('Error', 'Failed to load your stories. Pull down to refresh.');
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Handles pull-to-refresh
   */
  async function handleRefresh() {
    setRefreshing(true);
    await fetchStories();
    setRefreshing(false);
  }

  /**
   * Handles deleting a story
   */
  async function handleDeleteStory(story: Story) {
    Alert.alert(
      'Delete Story',
      'Are you sure you want to delete this story? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) return;

            try {
              const success = await deleteStory(story.id, user.id);
              if (success) {
                setStories(stories.filter((s) => s.id !== story.id));
                Alert.alert('Success', 'Story deleted successfully');
              } else {
                Alert.alert('Error', 'Failed to delete story');
              }
            } catch (error) {
              console.error('Error deleting story:', error);
              Alert.alert('Error', 'Failed to delete story');
            }
          },
        },
      ],
    );
  }

  /**
   * Handles toggling story privacy
   */
  async function handleTogglePrivacy(story: Story) {
    if (!user?.id) return;

    try {
      const success = await updateStoryPrivacy(story.id, user.id, !story.is_public);
      if (success) {
        setStories(stories.map((s) => (s.id === story.id ? { ...s, is_public: !s.is_public } : s)));
      } else {
        Alert.alert('Error', 'Failed to update story privacy');
      }
    } catch (error) {
      console.error('Error updating story privacy:', error);
      Alert.alert('Error', 'Failed to update story privacy');
    }
  }

  /**
   * Formats the time since story was created
   */
  function formatTimeAgo(createdAt: string): string {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    } else {
      return 'Just now';
    }
  }

  // Build usersWithStories array for StoryViewer (just the current user)
  const usersWithStories = [
    {
      id: user?.id || '',
      username: user?.username || '',
      avatarUrl: (user as any)?.avatarUrl || '',
      isOwn: true,
      hasStory: stories.length > 0,
    },
  ];

  /**
   * Renders a single story item
   */
  function renderStoryItem({ item }: { item: Story }) {
    return (
      <View className="mb-4 rounded-lg bg-white p-4 shadow-sm">
        {/* Story Media */}
        <TouchableOpacity
          className="mb-3 overflow-hidden rounded-lg"
          onPress={() => {
            if (!user) return;
            storiesNavigation.navigate('StoryViewer', {
              userId: user.id,
              username: user.username,
              avatarUrl: (user as any).avatarUrl || '',
              usersWithStories,
              userIndex: 0,
            });
          }}
        >
          <Image source={{ uri: item.media_url }} className="h-48 w-full" resizeMode="cover" />
          {item.media_type === 'video' && (
            <View className="absolute right-2 top-2 rounded-full bg-black/50 p-1">
              <Text className="text-xs text-white">🎬</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Story Info */}
        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-sm text-gray-600">{formatTimeAgo(item.created_at)}</Text>
            <Text className="text-xs text-gray-500">
              {item.media_type === 'photo' ? `${item.timer}s timer` : 'Video'}
            </Text>
            <Text className="text-xs text-gray-500">{item.view_count} views</Text>
          </View>

          {/* Privacy Toggle */}
          <View className="flex-row items-center">
            <Text className="mr-2 text-sm text-gray-600">
              {item.is_public ? 'Public' : 'Private'}
            </Text>
            <Switch
              value={item.is_public}
              onValueChange={() => handleTogglePrivacy(item)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={item.is_public ? '#f5dd4b' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row space-x-2">
          <TouchableOpacity
            className="flex-1 rounded-lg bg-red-500 py-2"
            onPress={() => handleDeleteStory(item)}
          >
            <Text className="text-center font-semibold text-white">Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0000ff" />
          <Text className="mt-2 text-gray-600">Loading your stories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="border-b border-gray-200 bg-white px-4 py-3">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text className="text-lg text-blue-500">← Back</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold">My Stories</Text>
          <View className="w-12" />
        </View>
      </View>

      {/* Content */}
      {error ? (
        <View className="flex-1 items-center justify-center px-4 py-4">
          <Text className="mb-2 text-xl text-red-600">⚠️ Error Loading Stories</Text>
          <Text className="mb-4 text-center text-gray-500">{error}</Text>
          <TouchableOpacity className="rounded-lg bg-blue-500 px-6 py-3" onPress={fetchStories}>
            <Text className="font-semibold text-white">Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : stories.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4 py-4">
          <Text className="mb-2 text-xl text-gray-600">No Stories Yet</Text>
          <Text className="text-center text-gray-500">
            Create your first story by taking a photo or video and tapping "Add to Story"
          </Text>
        </View>
      ) : (
        <FlatList
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          data={stories}
          renderItem={renderStoryItem}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          showsVerticalScrollIndicator={true}
        />
      )}
    </SafeAreaView>
  );
}
