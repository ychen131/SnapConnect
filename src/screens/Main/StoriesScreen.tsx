/**
 * @file StoriesScreen.tsx
 * @description UI for the Stories feed: Friends (avatars row) and Discovery (featured pups grid).
 */
import React from 'react';
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
import FeaturedAccountsSection from '../../components/ui/FeaturedAccountsSection';

function StoryAvatar({
  id,
  username,
  avatarUrl,
  isOwn,
  hasStory,
  isNew,
  hasVibeCheck,
  onPress,
  ...props
}: any) {
  const displayName = typeof username === 'string' && username.length > 0 ? username : 'U';
  let borderColor = '#E5E7EB';
  if (isOwn && hasStory) borderColor = '#FF8C69';
  else if (isNew) borderColor = '#FF8C69';

  return (
    <TouchableOpacity className="mx-2 items-center" onPress={onPress}>
      <View className="relative">
        <Avatar
          avatarUrl={avatarUrl}
          username={displayName}
          size={64}
          borderColor={borderColor}
          borderWidth={4}
          backgroundColor={hasStory ? '#FF8C69' : '#E5E7EB'}
          textColor={hasStory ? '#FFFFFF' : '#6B7280'}
        />
        {hasVibeCheck && (
          <View className="absolute -right-1 -top-1 rounded-full bg-yellow-400 p-1">
            <Text className="text-xs">✨</Text>
          </View>
        )}
      </View>
      <Text className="mt-2 w-16 text-center font-heading text-xs" numberOfLines={1}>
        {isOwn ? (hasStory ? 'Your Story' : 'Add Story') : displayName}
      </Text>
    </TouchableOpacity>
  );
}

export default function StoriesScreen() {
  const user = useSelector((state: RootState) => state.auth.user);
  const realtimeState = useSelector((state: RootState) => state.realtime);
  const [isLoading, setIsLoading] = React.useState(true);
  const [stories, setStories] = React.useState<any[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const navigation = useNavigation<NativeStackNavigationProp<StoriesStackParamList>>();
  const tabNavigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();

  async function fetchStories() {
    if (!user?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [friends, myStories] = await Promise.all([
        getFriendsWithActiveStories(user.id),
        getUserStories(user.id, false),
      ]);
      const hasMyStory = Array.isArray(myStories) && myStories.length > 0;
      const hasVibeCheck = hasMyStory && myStories.some((story: any) => story.vibe_check_summary);
      const storyList = [
        {
          id: 'me',
          username: user.username,
          avatarUrl: user.avatar_url || '',
          isOwn: true,
          hasStory: hasMyStory,
          hasVibeCheck: hasVibeCheck,
        },
        ...friends.map((f: any) => ({
          id: f.user_id,
          username: f.username,
          avatarUrl: f.avatar_url || '',
          isOwn: false,
          hasStory: true,
          isNew: true,
          hasVibeCheck: false,
        })),
      ];
      setStories(storyList);
    } catch (err) {
      setError('Failed to load stories.');
      Alert.alert('Error', 'Failed to load stories.');
    } finally {
      setIsLoading(false);
    }
  }

  React.useEffect(() => {
    fetchStories();
  }, [user?.id, user?.avatar_url]);

  useFocusEffect(
    React.useCallback(() => {
      if (realtimeState.newStoryNotifications.length > 0) {
        clearAllStoryNotifications();
      }
      if (user?.id) {
        fetchStories();
      }
    }, [user?.id]),
  );

  React.useEffect(() => {
    if (realtimeState.newStoryNotifications.length > 0 && user?.id) {
      fetchStories();
    }
  }, [realtimeState.newStoryNotifications.length, user?.id]);

  const usersWithStories = stories
    .map((s) => (s.isOwn ? { ...s, id: user?.id } : s))
    .filter((s) => s.hasStory || s.isOwn);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#FFF0E6' }}>
      <View className="flex-1" style={{ paddingBottom: 24 }}>
        {/* Header */}
        <View className="px-4 pb-2 pt-4">
          <Text className="text-text-primary font-heading text-2xl font-extrabold">Stories</Text>
        </View>
        {/* Friends Section */}
        <View className="px-4">
          <Text className="text-text-primary font-bold">Friends</Text>
          <FlatList
            data={stories}
            horizontal
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <StoryAvatar
                {...item}
                onPress={() => {
                  if (item.isOwn) {
                    if (item.hasStory) {
                      const realId = user?.id || '';
                      const userIndex = usersWithStories.findIndex((u) => u.id === realId);
                      navigation.navigate('StoryViewer', {
                        userId: realId,
                        username: item.username,
                        avatarUrl: item.avatarUrl,
                        usersWithStories,
                        userIndex,
                      });
                    } else {
                      tabNavigation.navigate('Camera', { screen: 'CameraMain' });
                    }
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
            contentContainerStyle={{ paddingVertical: 12 }}
          />
        </View>
        {/* Discovery Section */}
        <View className="mt-6 flex-1 px-4">
          <Text className="text-text-primary font-bold">Discovery</Text>
          <FeaturedAccountsSection
            onCardPress={(userId) => {
              console.log('Discovery card pressed, navigating to ProfileMain with userId:', userId);
              tabNavigation.navigate('Profile', {
                screen: 'ProfileMain',
                params: { userId },
              });
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
