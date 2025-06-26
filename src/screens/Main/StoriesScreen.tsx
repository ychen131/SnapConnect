/**
 * @file StoriesScreen.tsx
 * @description UI skeleton for the Stories feed: horizontal scroll of avatars (your story first), username labels, loading and empty states.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { getFriendsWithActiveStories, getUserStories } from '../../services/storyService';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { StoriesStackParamList } from '../../navigation/types';

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
  return (
    <TouchableOpacity className="mx-2 items-center" onPress={onPress}>
      <View
        className={`h-16 w-16 items-center justify-center rounded-full border-4 ${
          isOwn
            ? hasStory
              ? 'border-purple-500'
              : 'border-gray-300'
            : isNew
              ? 'border-blue-500'
              : 'border-gray-300'
        } bg-gray-200`}
      >
        {/* Placeholder for avatar image */}
        {avatarUrl ? (
          // TODO: Replace with <Image source={{ uri: avatarUrl }} ... />
          <Text className="text-2xl font-bold text-gray-600">
            {displayName.charAt(0).toUpperCase()}
          </Text>
        ) : (
          <Text className="text-2xl font-bold text-gray-600">
            {displayName.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>
      <Text className="mt-2 w-16 text-center text-xs" numberOfLines={1}>
        {isOwn ? (hasStory ? 'Your Story' : 'Add Story') : displayName}
      </Text>
    </TouchableOpacity>
  );
}

export default function StoriesScreen() {
  const user = useSelector((state: RootState) => state.auth.user);
  console.log('Redux user:', user);
  const [isLoading, setIsLoading] = useState(true);
  const [stories, setStories] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<NativeStackNavigationProp<StoriesStackParamList>>();

  useEffect(() => {
    async function fetchStories() {
      if (!user?.id) return;
      setIsLoading(true);
      setError(null);
      try {
        const [friends, myStories] = await Promise.all([
          getFriendsWithActiveStories(user.id),
          getUserStories(user.id, false), // Only active stories
        ]);
        console.log('Fetched friends:', friends);
        console.log('Fetched myStories:', myStories);
        // Map to UI format
        const hasMyStory = Array.isArray(myStories) && myStories.length > 0;
        const storyList = [
          {
            id: 'me',
            username: user.username,
            avatarUrl: '',
            isOwn: true,
            hasStory: hasMyStory,
          },
          ...friends.map((f: any) => {
            console.log('Mapping friend:', f);
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
    fetchStories();
  }, [user?.id]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="border-b border-gray-200 px-4 py-3">
        <Text className="text-2xl font-bold">Stories</Text>
      </View>
      <View className="py-6">
        {isLoading ? (
          <ActivityIndicator size="large" color="#a78bfa" />
        ) : error ? (
          <View className="items-center justify-center py-12">
            <Text className="text-lg text-red-500">{error}</Text>
          </View>
        ) : stories.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Text className="text-lg text-gray-500">No stories yet</Text>
            <Text className="text-sm text-gray-400">Your friends' stories will appear here</Text>
          </View>
        ) : (
          <FlatList
            data={stories}
            horizontal
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <StoryAvatar
                {...item}
                onPress={() => {
                  if (!item.hasStory) return;
                  if (item.id === 'me') {
                    if (!user) return;
                    navigation.navigate('StoryViewer', {
                      userId: user.id,
                      username: item.username,
                      avatarUrl: item.avatarUrl,
                    });
                  } else {
                    navigation.navigate('StoryViewer', {
                      userId: item.id,
                      username: item.username,
                      avatarUrl: item.avatarUrl,
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
